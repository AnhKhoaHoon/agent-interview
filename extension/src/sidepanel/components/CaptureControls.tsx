import type { CaptureStatus } from '../../audio/tab-capture';
import type { VadUiState } from '../../audio/utterance-segmenter';
import type { TranscriptionLanguage } from '../../types/interview';

const statusLabels: Record<CaptureStatus, string> = {
  requesting_permission: 'Choose tab',
  connecting: 'Connecting',
  listening: 'Listening',
  stopped: 'Audio off',
  error: 'Audio issue'
};

interface CaptureControlsProps {
  status: CaptureStatus;
  vadState?: VadUiState;
  interviewerListening: boolean;
  error?: string;
  disabled?: boolean;
  language: TranscriptionLanguage;
  onLanguageChange: (language: TranscriptionLanguage) => void;
  audioLevel: number;
  speechThreshold: number;
  onFinishQuestion: () => void;
  onCancelQuestion: () => void;
  onStartListening: () => void;
  onPauseListening: () => void;
  onStart: () => void;
  onUseActiveTab: () => void;
  onStop: () => void;
}

function captureGuidance(error: string): string | undefined {
  if (/not been invoked|activeTab permission|Chrome pages cannot be captured/i.test(error)) {
    return 'Open a regular interview website tab, click the Agent Interview toolbar icon while that tab is active, then try capture again. Chrome internal pages cannot be captured.';
  }
  return undefined;
}

export function CaptureControls({ status, vadState, interviewerListening, error, disabled = false, language, onLanguageChange, audioLevel, speechThreshold, onFinishQuestion, onCancelQuestion, onStartListening, onPauseListening, onStart, onUseActiveTab, onStop }: CaptureControlsProps): JSX.Element {
  const capturing = status === 'requesting_permission' || status === 'connecting' || status === 'listening';
  const guidance = error ? captureGuidance(error) : undefined;
  const vadLabel = vadState === 'speech_detected' ? 'Speech detected' : vadState === 'finalizing' ? 'Finalizing' : undefined;
  return (
    <section className={`capture-controls capture-${status}${capturing && !interviewerListening ? ' capture-interviewer-paused' : ''}`} aria-label="Tab audio capture">
      <div className="capture-summary">
        <span className="capture-indicator" aria-hidden="true" />
        <span className="capture-label">Audio</span>
        <strong aria-live="polite">{disabled ? 'Start session first' : capturing && !interviewerListening ? 'Paused — your turn' : statusLabels[status]}</strong>
        {interviewerListening && vadLabel && <span className="vad-state">{vadLabel}</span>}
      </div>
      <label className="transcription-language">
        <select value={language} onChange={(event) => onLanguageChange(event.target.value as TranscriptionLanguage)} aria-label="Interview audio language">
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
      </label>
      {capturing && (
        <div className="audio-meter" aria-label={`Tab audio level ${Math.round(audioLevel * 100)} percent`} title="Live level from the selected interview tab">
          <span className="audio-meter-track"><i style={{ width: `${Math.min(100, (audioLevel / Math.max(speechThreshold * 2, 0.01)) * 100)}%` }} /></span>
        </div>
      )}
      <div className="capture-actions">
        {capturing ? (
          <>
            {interviewerListening ? (
              <>
                {vadState === 'speech_detected' && <button className="button ghost capture-action compact-button" type="button" onClick={onFinishQuestion} aria-label="Finish the current interviewer question" title="Finalize the interviewer question now">Finish</button>}
                {(vadState === 'speech_detected' || vadState === 'finalizing') && <button className="button ghost capture-action compact-button" type="button" onClick={onCancelQuestion} aria-label="Discard the current detected interviewer audio" title="Discard this detected audio. It will not be transcribed or sent to the backend.">Cancel</button>}
                <button className="button secondary capture-action compact-button listening-toggle" type="button" onClick={onPauseListening} aria-label="Pause interviewer listening while you answer" title="Pause before you answer so your voice is not transcribed">Pause</button>
              </>
            ) : (
              <button className="button capture-action compact-button listening-toggle" type="button" onClick={onStartListening} disabled={disabled} aria-label="Listen for the next interviewer question" title="Turn on only while the interviewer is speaking">Listen</button>
            )}
            <button className="button ghost capture-action compact-button" type="button" onClick={onStop} aria-label="End interview audio capture" title="Release the selected tab audio">End audio</button>
          </>
        ) : (
          <>
            <button className="button capture-action compact-button" type="button" onClick={onStart} disabled={disabled} aria-label="Choose a tab and start audio capture" title="Choose a tab and start audio capture">Audio</button>
            {!disabled && <button className="button ghost compact-button" type="button" onClick={onUseActiveTab} aria-label="Capture audio from the active tab" title="Capture audio from the active tab">Tab</button>}
          </>
        )}
      </div>
      {error && (
        <details className="capture-help">
          <summary>Audio error</summary>
          <p>{guidance ? 'Chrome did not authorize quick active-tab capture. Use Start capture and select the Meet tab in the picker.' : error}</p>
          {guidance && <code>{error}</code>}
        </details>
      )}
    </section>
  );
}
