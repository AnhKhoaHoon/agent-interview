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
  error?: string;
  disabled?: boolean;
  language: TranscriptionLanguage;
  onLanguageChange: (language: TranscriptionLanguage) => void;
  audioLevel: number;
  speechThreshold: number;
  onFinishQuestion: () => void;
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

export function CaptureControls({ status, vadState, error, disabled = false, language, onLanguageChange, audioLevel, speechThreshold, onFinishQuestion, onStart, onUseActiveTab, onStop }: CaptureControlsProps): JSX.Element {
  const capturing = status === 'requesting_permission' || status === 'connecting' || status === 'listening';
  const guidance = error ? captureGuidance(error) : undefined;
  const vadLabel = vadState === 'speech_detected' ? 'Speech detected' : vadState === 'finalizing' ? 'Finalizing' : 'Listening';
  return (
    <section className={`capture-controls capture-${status}`} aria-label="Tab audio capture">
      <div className="capture-summary">
        <span className="capture-indicator" aria-hidden="true" />
        <strong>{disabled ? 'Start session first' : statusLabels[status]}</strong>
        {vadState && <span className="vad-state">{vadLabel}</span>}
      </div>
      <label className="transcription-language">
        <span>Language</span>
        <select value={language} onChange={(event) => onLanguageChange(event.target.value as TranscriptionLanguage)} aria-label="Interview audio language">
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
      </label>
      {capturing && (
        <div className="audio-meter" aria-label={`Tab audio level ${Math.round(audioLevel * 100)} percent`} title="Live level from the selected interview tab">
          <span className="audio-meter-label">Sound</span>
          <span className="audio-meter-track"><i style={{ width: `${Math.min(100, (audioLevel / Math.max(speechThreshold * 2, 0.01)) * 100)}%` }} /></span>
        </div>
      )}
      <div className="capture-actions">
        {capturing ? (
          <>
            {vadState === 'speech_detected' && <button className="button ghost capture-action compact-button" type="button" onClick={onFinishQuestion} aria-label="Finish the current interviewer question" title="Use only after the interviewer has finished the question">Finish</button>}
            <button className="button secondary capture-action compact-button" type="button" onClick={onStop} aria-label="Stop interview audio capture" title="Stop interview audio capture">Stop</button>
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
