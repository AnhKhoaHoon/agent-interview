import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { CaptureDiagnostics, CaptureInterruption, CaptureStatus, TabAudioCapture } from '../audio/tab-capture';
import { InterviewerListeningGate } from '../audio/interviewer-listening-gate';
import { VadPipeline, type FinalizedAudioSegment } from '../audio/vad-pipeline';
import type { VadUiState } from '../audio/utterance-segmenter';
import { ApiClientError } from '../api/client';
import { askQuestion, cancelQuestion as requestQuestionCancel, CandidateContextKind, CandidateContextSummary, createInterview, deleteCandidateContext, endInterview, eventStreamUrl, listCandidateContexts, retryAnswer as requestAnswerRetry, uploadCandidateContext, uploadTranscription } from '../api/interview.api';
import { connectInterviewEvents, type SseConnection } from '../realtime/sse-client';
import { initialPanelState, interviewReducer } from '../state/interview.reducer';
import type { InterviewEvent } from '../types/events';
import type { InterviewRole, InterviewSession, TranscriptionLanguage } from '../types/interview';
import { ChatWindow } from './components/ChatWindow';
import { CaptureControls } from './components/CaptureControls';
import { DevCaptureDiagnostics } from './components/DevCaptureDiagnostics';
import { DevQuestionForm } from './components/DevQuestionForm';
import { ErrorBanner } from './components/ErrorBanner';
import { Header } from './components/Header';
import { CandidateContextControls } from './components/CandidateContextControls';

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    const transcriptionGuidance: Record<string, string> = {
      STT_EMPTY_RESULT: 'No speech was recognized. Select the interview tab in the picker, enable Share tab audio, then let the interviewer speak and retry.',
      STT_AUDIO_REJECTED: 'The speech service could not read this audio segment. Stop and start audio capture, then retry.',
      STT_CREDENTIALS_REJECTED: 'The backend speech-service credential was rejected. Update STT_API_KEY on the backend and restart it.',
      STT_RATE_LIMITED: 'The speech service is temporarily rate-limited. Wait briefly, then retry transcription.',
      AUDIO_FILE_EMPTY: 'The captured segment was empty. Confirm that the selected interview tab is sharing audio, then retry.',
      AUDIO_TYPE_UNSUPPORTED: 'The captured audio format is unsupported. Reload the Agent Interview extension, start capture again, and retry.'
    };
    return transcriptionGuidance[error.response.code] ?? error.response.message;
  }
  if (error instanceof Error) return error.message;
  return 'The backend connection failed.';
}

function stringField(data: Record<string, unknown>, field: string): string | undefined {
  const value = data[field];
  return typeof value === 'string' ? value : undefined;
}

function stringArrayField(data: Record<string, unknown>, field: string): string[] | undefined {
  const value = data[field];
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : undefined;
}

function numberField(data: Record<string, unknown>, field: string): number | undefined {
  const value = data[field];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toEpochMs(performanceTimestampMs: number): number {
  return Date.now() - Math.max(0, performance.now() - performanceTimestampMs);
}

export function App(): JSX.Element {
  const [state, dispatch] = useReducer(interviewReducer, initialPanelState);
  const [session, setSession] = useState<InterviewSession>();
  const [selectedRole, setSelectedRole] = useState<InterviewRole>('devops');
  const [candidateContexts, setCandidateContexts] = useState<CandidateContextSummary[]>([]);
  const [uploadingCandidateContext, setUploadingCandidateContext] = useState<CandidateContextKind>();
  const sessionRef = useRef<InterviewSession>();
  const sourceRef = useRef<SseConnection>();
  const activeAnswerIdsRef = useRef(new Set<string>());
  const activeAnswerQuestionIdsRef = useRef(new Map<string, string>());
  const retryingAnswerIdsRef = useRef(new Set<string>());
  const ignoredQuestionIdsRef = useRef(new Set<string>());
  const speechEndedAtByQuestionIdRef = useRef(new Map<string, number>());
  const firstAnswerTokenSeenRef = useRef(new Set<string>());
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('stopped');
  const [captureError, setCaptureError] = useState<string>();
  const [captureDiagnostics, setCaptureDiagnostics] = useState<CaptureDiagnostics>({
    streamActive: false,
    audioTrackState: 'unavailable'
  });
  const [vadState, setVadState] = useState<VadUiState>();
  const [interviewerListening, setInterviewerListening] = useState(false);
  const [lastSegmentDurationMs, setLastSegmentDurationMs] = useState<number>();
  const [lastSpeechEndToFirstAnswerMs, setLastSpeechEndToFirstAnswerMs] = useState<number>();
  const [transcriptionLanguage, setTranscriptionLanguage] = useState<TranscriptionLanguage>('en');
  const transcriptionLanguageRef = useRef<TranscriptionLanguage>('en');
  const [audioLevel, setAudioLevel] = useState(0);
  const [speechThreshold, setSpeechThreshold] = useState(0);
  const pipelineRef = useRef<VadPipeline>();
  const listeningGateRef = useRef(new InterviewerListeningGate());
  const pendingSegmentsRef = useRef(new Map<string, FinalizedAudioSegment>());

  const handleCaptureInterruption = useCallback((interruption: CaptureInterruption) => {
    pipelineRef.current?.stop();
    listeningGateRef.current.reset();
    setInterviewerListening(false);
    setCaptureStatus('error');
    setCaptureError(interruption.reason === 'tab_closed'
      ? 'The selected interview tab was closed.'
      : interruption.reason === 'tab_navigated'
        ? 'The selected interview tab navigated. Capture stopped.'
        : 'The selected tab audio track ended.');
    setCaptureDiagnostics({ streamActive: false, audioTrackState: 'unavailable' });
    setVadState(undefined);
    setAudioLevel(0);
    setSpeechThreshold(0);
  }, []);
  const captureRef = useRef<TabAudioCapture>();
  if (!captureRef.current) captureRef.current = new TabAudioCapture(handleCaptureInterruption, undefined, setCaptureStatus);

  const closeEventSource = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = undefined;
  }, []);

  const sendSegmentForTranscription = useCallback(async (
    temporaryId: string,
    segment: FinalizedAudioSegment,
    language: TranscriptionLanguage
  ) => {
    const activeSession = sessionRef.current;
    if (!activeSession) {
      pendingSegmentsRef.current.delete(temporaryId);
      dispatch({ type: 'transcription-error', temporaryId, message: 'Start an interview session before transcribing audio.', retryable: false });
      return;
    }
    try {
      const speechEndedAtMs = toEpochMs(segment.speechEndedAtMs);
      const transcript = await uploadTranscription(
        activeSession.id, segment.audio, segment.durationMs, temporaryId, speechEndedAtMs, language, activeSession.accessToken
      );
      speechEndedAtByQuestionIdRef.current.set(transcript.questionId, speechEndedAtMs);
      pendingSegmentsRef.current.delete(temporaryId);
      dispatch({
        type: 'transcribed',
        temporaryId,
        message: { id: transcript.messageId, role: 'interviewer', content: transcript.text, ...(transcript.understoodText ? { understoodText: transcript.understoodText } : {}) }
      });
    } catch (error) {
      const retryable = error instanceof ApiClientError ? error.response.retryable : true;
      if (!retryable) pendingSegmentsRef.current.delete(temporaryId);
      dispatch({ type: 'transcription-error', temporaryId, message: `Transcription failed: ${errorMessage(error)}`, retryable });
    }
  }, []);

  const queueSegmentForTranscription = useCallback((segment: FinalizedAudioSegment) => {
    const temporaryId = crypto.randomUUID();
    pendingSegmentsRef.current.set(temporaryId, segment);
    dispatch({ type: 'transcribing', temporaryId });
    void sendSegmentForTranscription(temporaryId, segment, transcriptionLanguageRef.current);
  }, [sendSegmentForTranscription]);

  const retryTranscription = useCallback((temporaryId: string) => {
    const segment = pendingSegmentsRef.current.get(temporaryId);
    if (!segment) return;
    dispatch({ type: 'transcribing', temporaryId });
    void sendSegmentForTranscription(temporaryId, segment, transcriptionLanguageRef.current);
  }, [sendSegmentForTranscription]);

  const changeTranscriptionLanguage = useCallback((language: TranscriptionLanguage) => {
    transcriptionLanguageRef.current = language;
    setTranscriptionLanguage(language);
  }, []);

  const retryAnswer = useCallback(async (questionId: string) => {
    const activeSession = sessionRef.current;
    if (!activeSession || retryingAnswerIdsRef.current.has(questionId)) return;
    retryingAnswerIdsRef.current.add(questionId);
    try {
      await requestAnswerRetry(activeSession.id, activeSession.accessToken, questionId);
    } catch (error) {
      dispatch({ type: 'error', message: `Answer retry failed: ${errorMessage(error)}` });
    } finally {
      retryingAnswerIdsRef.current.delete(questionId);
    }
  }, []);

  const cancelTranscript = useCallback(async (questionId: string) => {
    const activeSession = sessionRef.current;
    if (!activeSession) return;
    ignoredQuestionIdsRef.current.add(questionId);
    speechEndedAtByQuestionIdRef.current.delete(questionId);
    activeAnswerQuestionIdsRef.current.forEach((activeQuestionId, answerMessageId) => {
      if (activeQuestionId === questionId) {
        activeAnswerQuestionIdsRef.current.delete(answerMessageId);
        activeAnswerIdsRef.current.delete(answerMessageId);
      }
    });
    dispatch({ type: 'discard-question', questionId });
    try {
      await requestQuestionCancel(activeSession.id, activeSession.accessToken, questionId);
    } catch (error) {
      dispatch({ type: 'error', message: 'The incorrect transcript is hidden locally, but backend cancellation failed: ' + errorMessage(error) });
    }
  }, []);

  const handleEvent = useCallback((event: InterviewEvent) => {
    const { data } = event;
    if (event.type === 'question.transcribed') {
      const messageId = stringField(data, 'messageId');
      const questionId = stringField(data, 'questionId') ?? messageId;
      const text = stringField(data, 'text');
      const understoodText = stringField(data, 'understoodText');
      const segmentId = stringField(data, 'segmentId');
      const speechEndedAtMs = numberField(data, 'speechEndedAtMs');
      if (questionId && ignoredQuestionIdsRef.current.has(questionId)) return;
      if (questionId && speechEndedAtMs) speechEndedAtByQuestionIdRef.current.set(questionId, speechEndedAtMs);
      if (messageId && text) {
        const message = { id: messageId, role: 'interviewer' as const, content: text, ...(understoodText ? { understoodText } : {}) };
        if (segmentId && pendingSegmentsRef.current.has(segmentId)) dispatch({ type: 'transcribed', temporaryId: segmentId, message });
        else dispatch({ type: 'add-question', message });
      }
    }
    if (event.type === 'question.cancelled') {
      const questionId = stringField(data, 'questionId');
      if (questionId) {
        ignoredQuestionIdsRef.current.add(questionId);
        speechEndedAtByQuestionIdRef.current.delete(questionId);
        activeAnswerQuestionIdsRef.current.forEach((activeQuestionId, answerMessageId) => {
          if (activeQuestionId === questionId) {
            activeAnswerQuestionIdsRef.current.delete(answerMessageId);
            activeAnswerIdsRef.current.delete(answerMessageId);
          }
        });
        dispatch({ type: 'discard-question', questionId });
      }
      return;
    }
    if (event.type === 'answer.started') {
      const messageId = stringField(data, 'messageId');
      const questionId = stringField(data, 'questionId');
      if (questionId && ignoredQuestionIdsRef.current.has(questionId)) return;
      if (messageId && questionId) {
        activeAnswerIdsRef.current.add(messageId);
        activeAnswerQuestionIdsRef.current.set(messageId, questionId);
        dispatch({ type: 'streaming', messageId, questionId });
      }
    }
    if (event.type === 'answer.token') {
      const messageId = stringField(data, 'messageId');
      const questionId = stringField(data, 'questionId');
      const text = stringField(data, 'text');
      if (questionId && ignoredQuestionIdsRef.current.has(questionId)) return;
      if (messageId && questionId && text) dispatch({ type: 'append-token', messageId, questionId, text });
      if (messageId && questionId && !firstAnswerTokenSeenRef.current.has(messageId)) {
        firstAnswerTokenSeenRef.current.add(messageId);
        const speechEndedAtMs = speechEndedAtByQuestionIdRef.current.get(questionId);
        if (speechEndedAtMs) {
          const latencyMs = Date.now() - speechEndedAtMs;
          setLastSpeechEndToFirstAnswerMs(latencyMs);
          if (import.meta.env.DEV) console.info('[Agent Interview] speech-end to first-answer token', { questionId, messageId, latencyMs });
        }
      }
    }
    if (event.type === 'answer.keywords') {
      const messageId = stringField(data, 'messageId');
      const questionId = stringField(data, 'questionId');
      const keywords = stringArrayField(data, 'keywords');
      if (questionId && ignoredQuestionIdsRef.current.has(questionId)) return;
      if (messageId && questionId && keywords) dispatch({ type: 'keywords', messageId, questionId, keywords });
    }
    if (event.type === 'answer.completed') {
      const messageId = stringField(data, 'messageId');
      const questionId = stringField(data, 'questionId');
      if (questionId && ignoredQuestionIdsRef.current.has(questionId)) return;
      if (messageId && questionId) {
        activeAnswerIdsRef.current.delete(messageId);
        activeAnswerQuestionIdsRef.current.delete(messageId);
        dispatch({ type: 'completed', messageId, questionId });
      }
    }
    if (event.type === 'answer.error') {
      const messageId = stringField(data, 'messageId');
      const questionId = stringField(data, 'questionId');
      const message = stringField(data, 'message') ?? 'The backend could not generate an answer.';
      const retryable = data.retryable === true;
      if (questionId && ignoredQuestionIdsRef.current.has(questionId)) return;
      if (messageId && questionId) {
        activeAnswerIdsRef.current.delete(messageId);
        activeAnswerQuestionIdsRef.current.delete(messageId);
        dispatch({ type: 'answer-error', messageId, questionId, message, retryable });
      } else {
        dispatch({ type: 'error', message });
      }
    }
    if (event.type === 'session.error') {
      dispatch({ type: 'error', message: stringField(data, 'message') ?? 'The interview session failed.' });
    }
  }, []);

  const connect = useCallback((interviewId: string, accessToken: string) => {
    closeEventSource();
    pipelineRef.current?.stop();
    listeningGateRef.current.reset();
    setInterviewerListening(false);
    sourceRef.current = connectInterviewEvents(eventStreamUrl(interviewId), accessToken, {
      onOpen: () => {
        if (activeAnswerIdsRef.current.size === 0) dispatch({ type: 'connected' });
      },
      onEvent: handleEvent,
      onError: () => dispatch({ type: 'error', message: 'Backend connection interrupted. Reconnecting…' })
    });
  }, [closeEventSource, handleEvent]);

  const startSession = useCallback(async () => {
    try {
      dispatch({ type: 'reset' });
      const createdSession = await createInterview(selectedRole);
      sessionRef.current = createdSession;
      setSession(createdSession);
      setCandidateContexts([]);
      connect(createdSession.id, createdSession.accessToken);
      void listCandidateContexts(createdSession.id, createdSession.accessToken)
        .then(setCandidateContexts)
        .catch((error: unknown) => dispatch({ type: 'error', message: `Profile context could not load: ${errorMessage(error)}` }));
    } catch (error) {
      dispatch({ type: 'error', message: errorMessage(error) });
    }
  }, [connect, selectedRole]);

  const uploadContext = useCallback(async (kind: CandidateContextKind, document: File) => {
    const activeSession = sessionRef.current;
    if (!activeSession || uploadingCandidateContext) return;
    setUploadingCandidateContext(kind);
    try {
      const saved = await uploadCandidateContext(activeSession.id, activeSession.accessToken, kind, document);
      setCandidateContexts((current) => [...current.filter((context) => context.kind !== saved.kind), saved]);
    } catch (error) {
      dispatch({ type: 'error', message: `Profile upload failed: ${errorMessage(error)}` });
    } finally {
      setUploadingCandidateContext(undefined);
    }
  }, [uploadingCandidateContext]);

  const removeContext = useCallback(async (kind: CandidateContextKind) => {
    const activeSession = sessionRef.current;
    if (!activeSession || uploadingCandidateContext) return;
    setUploadingCandidateContext(kind);
    try {
      await deleteCandidateContext(activeSession.id, activeSession.accessToken, kind);
      const persistedKind = kind === 'profile' ? 'profile' : 'job_description';
      setCandidateContexts((current) => current.filter((context) => context.kind !== persistedKind));
    } catch (error) {
      dispatch({ type: 'error', message: `Profile removal failed: ${errorMessage(error)}` });
    } finally {
      setUploadingCandidateContext(undefined);
    }
  }, [uploadingCandidateContext]);

  const stopSession = useCallback(async () => {
    const interviewId = session?.id;
    closeEventSource();
    listeningGateRef.current.reset();
    await captureRef.current?.stop();
    pendingSegmentsRef.current.clear();
    activeAnswerIdsRef.current.clear();
    activeAnswerQuestionIdsRef.current.clear();
    retryingAnswerIdsRef.current.clear();
    ignoredQuestionIdsRef.current.clear();
    speechEndedAtByQuestionIdRef.current.clear();
    firstAnswerTokenSeenRef.current.clear();
    setCaptureStatus('stopped');
    setCaptureDiagnostics(captureRef.current?.diagnostics() ?? { streamActive: false, audioTrackState: 'unavailable' });
    setVadState(undefined);
    setInterviewerListening(false);
    setAudioLevel(0);
    setSpeechThreshold(0);
    setSession(undefined);
    setCandidateContexts([]);
    setUploadingCandidateContext(undefined);
    sessionRef.current = undefined;
    dispatch({ type: 'reset' });
    if (!interviewId) return;
    try {
      if (session?.accessToken) await endInterview(interviewId, session.accessToken);
    } catch (error) {
      dispatch({ type: 'error', message: `Session stopped locally. ${errorMessage(error)}` });
    }
  }, [closeEventSource, session?.accessToken, session?.id]);

  const submitQuestion = useCallback(async (question: string) => {
    if (!session) return;
    try {
      dispatch({ type: 'thinking' });
      const result = await askQuestion(session.id, session.accessToken, question, transcriptionLanguage);
      dispatch({ type: 'add-question', message: { id: result.questionId, role: 'interviewer', content: question } });
    } catch (error) {
      dispatch({ type: 'error', message: errorMessage(error) });
    }
  }, [session, transcriptionLanguage]);

  const startListening = useCallback(async () => {
    if (!captureRef.current?.activeStream()) {
      setCaptureError('Connect interview-tab audio before listening for a question.');
      return;
    }
    try {
      setCaptureError(undefined);
      setAudioLevel(0);
      setSpeechThreshold(0);
      pipelineRef.current?.stop();
      listeningGateRef.current.start();
      setInterviewerListening(true);
      pipelineRef.current = new VadPipeline(captureRef.current, {
        onStateChange: setVadState,
        onAudioLevel: (level, threshold) => {
          setAudioLevel(level);
          setSpeechThreshold(threshold);
        },
        onSegment: (segment) => {
          // The user may have paused listening while VAD was finishing. In
          // that case discard locally; never upload the candidate's audio.
          if (!listeningGateRef.current.acceptsSegment()) {
            if (import.meta.env.DEV) console.info('[Agent Interview] discarded segment outside interviewer listening window');
            return;
          }
          setLastSegmentDurationMs(segment.durationMs);
          if (import.meta.env.DEV) console.info('[Agent Interview] finalized interviewer segment', { durationMs: Math.round(segment.durationMs) });
          queueSegmentForTranscription(segment);
        },
        onError: (error) => {
          listeningGateRef.current.pause();
          setInterviewerListening(false);
          setCaptureStatus('error');
          setCaptureError(error.message);
        }
      });
      await pipelineRef.current.start();
      setCaptureStatus('listening');
    } catch (error) {
      pipelineRef.current?.stop();
      listeningGateRef.current.pause();
      setInterviewerListening(false);
      setVadState(undefined);
      setCaptureError(error instanceof Error ? error.message : 'Interviewer listening could not start.');
    }
  }, [queueSegmentForTranscription]);

  const pauseListening = useCallback(() => {
    listeningGateRef.current.pause();
    pipelineRef.current?.stop();
    setInterviewerListening(false);
    setVadState(undefined);
    setAudioLevel(0);
    setSpeechThreshold(0);
  }, []);

  const startCapture = useCallback(async (source: 'active-tab' | 'picker' = 'active-tab') => {
    try {
      setCaptureError(undefined);
      setAudioLevel(0);
      setSpeechThreshold(0);
      pipelineRef.current?.stop();
      listeningGateRef.current.reset();
      setInterviewerListening(false);
      const activeCapture = source === 'picker'
        ? await captureRef.current!.startWithPicker()
        : await captureRef.current!.start();
      setCaptureDiagnostics(activeCapture.diagnostics);
      setCaptureStatus('listening');
      setVadState(undefined);
    } catch (error) {
      pipelineRef.current?.stop();
      listeningGateRef.current.reset();
      setInterviewerListening(false);
      await captureRef.current!.stop();
      setCaptureDiagnostics(captureRef.current!.diagnostics());
      setCaptureStatus('error');
      setCaptureError(error instanceof Error ? error.message : 'Tab audio capture failed.');
    }
  }, []);

  const stopCapture = useCallback(async () => {
    listeningGateRef.current.reset();
    pipelineRef.current?.stop();
    await captureRef.current!.stop();
    setCaptureDiagnostics(captureRef.current!.diagnostics());
    setCaptureError(undefined);
    setInterviewerListening(false);
    setAudioLevel(0);
    setSpeechThreshold(0);
    setCaptureStatus('stopped');
    setVadState(undefined);
  }, []);

  const finishCurrentQuestion = useCallback(() => {
    if (listeningGateRef.current.isListening()) pipelineRef.current?.finishCurrentUtterance();
  }, []);

  const cancelCurrentQuestion = useCallback(() => {
    if (listeningGateRef.current.isListening()) pipelineRef.current?.cancelCurrentUtterance();
  }, []);

  useEffect(() => {
    const listener = (message: unknown): void => {
      if (!message || typeof message !== 'object') return;
      const event = message as { type?: string; tabId?: unknown };
      if (typeof event.tabId !== 'number') return;
      if (event.type === 'tab-capture-tab-closed') void captureRef.current?.interrupt({ tabId: event.tabId, reason: 'tab_closed' });
      if (event.type === 'tab-capture-tab-navigated') void captureRef.current?.interrupt({ tabId: event.tabId, reason: 'tab_navigated' });
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => () => {
    closeEventSource();
    listeningGateRef.current.reset();
    pipelineRef.current?.stop();
    pendingSegmentsRef.current.clear();
    activeAnswerIdsRef.current.clear();
    activeAnswerQuestionIdsRef.current.clear();
    retryingAnswerIdsRef.current.clear();
    ignoredQuestionIdsRef.current.clear();
    speechEndedAtByQuestionIdRef.current.clear();
    firstAnswerTokenSeenRef.current.clear();
    void captureRef.current?.stop();
  }, [closeEventSource]);

  const formDisabled = !session || state.status === 'thinking' || state.status === 'streaming';
  return (
    <div className="app-shell">
      <Header
        status={state.status}
        hasSession={Boolean(session)}
        role={session?.role ?? selectedRole}
        roleLocked={Boolean(session)}
        onRoleChange={setSelectedRole}
        onStart={() => void startSession()}
        onStop={() => void stopSession()}
        controls={(
          <>
            <CaptureControls
              status={captureStatus}
              vadState={vadState}
              interviewerListening={interviewerListening}
              error={captureError}
              disabled={!session}
              language={transcriptionLanguage}
              onLanguageChange={changeTranscriptionLanguage}
              audioLevel={audioLevel}
              speechThreshold={speechThreshold}
              onFinishQuestion={finishCurrentQuestion}
              onCancelQuestion={cancelCurrentQuestion}
              onStartListening={() => void startListening()}
              onPauseListening={pauseListening}
              onStart={() => void startCapture('picker')}
              onUseActiveTab={() => void startCapture()}
              onStop={() => void stopCapture()}
            />
            <CandidateContextControls
              disabled={!session}
              contexts={candidateContexts}
              uploadingKind={uploadingCandidateContext}
              onUpload={(kind, document) => void uploadContext(kind, document)}
              onRemove={(kind) => void removeContext(kind)}
            />
          </>
        )}
      />
      <ErrorBanner message={state.error} />
      <ChatWindow messages={state.messages} hasSession={Boolean(session)} role={session?.role ?? selectedRole} onRetryTranscription={retryTranscription} onRetryAnswer={(questionId) => void retryAnswer(questionId)} onCancelQuestion={(questionId) => void cancelTranscript(questionId)} />
      {import.meta.env.DEV && (
        <details className="developer-tools">
          <summary>Developer tools</summary>
          <DevCaptureDiagnostics diagnostics={captureDiagnostics} lastSegmentDurationMs={lastSegmentDurationMs} lastSpeechEndToFirstAnswerMs={lastSpeechEndToFirstAnswerMs} />
          <DevQuestionForm disabled={formDisabled} onAsk={submitQuestion} />
        </details>
      )}
    </div>
  );
}
