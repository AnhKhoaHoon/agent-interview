import { API_BASE_URL, ApiClientError, requestJson } from './client';
import type { ApiError, InterviewSession, InterviewSessionSummary, TranscriptionLanguage } from '../types/interview';

export interface QuestionAccepted {
  questionId: string;
  accepted: true;
}

export interface TranscriptionAccepted {
  messageId: string;
  questionId: string;
  text: string;
  language: string;
  durationMs: number;
}

export function createInterview(): Promise<InterviewSession> {
  return requestJson<InterviewSession>('/interviews', {
    method: 'POST',
    body: JSON.stringify({ role: 'devops' })
  });
}

export function endInterview(interviewId: string, accessToken: string): Promise<InterviewSessionSummary> {
  return requestJson<InterviewSessionSummary>(`/interviews/${encodeURIComponent(interviewId)}/end`, { method: 'POST' }, accessToken);
}

export function askQuestion(
  interviewId: string,
  accessToken: string,
  question: string,
  language: TranscriptionLanguage
): Promise<QuestionAccepted> {
  return requestJson<QuestionAccepted>(`/interviews/${encodeURIComponent(interviewId)}/questions`, {
    method: 'POST',
    body: JSON.stringify({ question, language })
  }, accessToken);
}

export function eventStreamUrl(interviewId: string): string {
  return `${API_BASE_URL}/interviews/${encodeURIComponent(interviewId)}/events`;
}

export async function uploadTranscription(
  interviewId: string,
  audio: Blob,
  durationMs: number,
  segmentId: string,
  speechEndedAtMs: number,
  language: TranscriptionLanguage,
  accessToken: string
): Promise<TranscriptionAccepted> {
  const body = new FormData();
  body.append('audio', audio, audio.type === 'audio/wav' ? 'utterance.wav' : 'utterance.webm');
  body.append('durationMs', String(Math.round(durationMs)));
  body.append('segmentId', segmentId);
  body.append('speechEndedAtMs', String(Math.round(speechEndedAtMs)));
  body.append('language', language);
  const response = await fetch(`${API_BASE_URL}/interviews/${encodeURIComponent(interviewId)}/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({
      code: 'NETWORK_ERROR',
      message: `Backend request failed with ${response.status}`,
      retryable: response.status >= 500,
      requestId: 'unavailable'
    }))) as ApiError;
    throw new ApiClientError(error, response.status);
  }
  return response.json() as Promise<TranscriptionAccepted>;
}

export interface AnswerRetryAccepted {
  questionId: string;
  answerMessageId: string;
  accepted: true;
}

export function retryAnswer(interviewId: string, accessToken: string, questionId: string): Promise<AnswerRetryAccepted> {
  return requestJson<AnswerRetryAccepted>(
    `/interviews/${encodeURIComponent(interviewId)}/questions/${encodeURIComponent(questionId)}/answer/retry`,
    { method: 'POST' },
    accessToken
  );
}
