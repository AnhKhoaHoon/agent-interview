import type { CaptureStatus } from '../../audio/tab-capture';
import type { VadUiState } from '../../audio/utterance-segmenter';

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

export function CaptureControls({ status, vadState, error, disabled = false, onStart, onUseActiveTab, onStop }: CaptureControlsProps): JSX.Element {
  const capturing = status === 'requesting_permission' || status === 'connecting' || status === 'listening';
  const guidance = error ? captureGuidance(error) : undefined;
  const vadLabel = vadState === 'speech_detected' ? 'Speech detected' : vadState === 'finalizing' ? 'Finalizing' : 'Listening';
  return (
    <section className={`capture-controls capture-${status}`} aria-label="Tab audio capture">
      <div className="capture-summary">
        <span className="capture-indicator" aria-hidden="true" />
        <span><small>Interview audio</small><strong>{disabled ? 'Session required' : statusLabels[status]}</strong></span>
        {vadState && <span className="vad-state">{vadLabel}</span>}
      </div>
      <div className="capture-actions">
        {capturing ? (
          <button className="button secondary capture-action compact-button" type="button" onClick={onStop}>Stop audio</button>
        ) : (
          <>
            <button className="button capture-action compact-button" type="button" onClick={onStart} disabled={disabled}>Start audio</button>
            {!disabled && <button className="button ghost compact-button" type="button" onClick={onUseActiveTab}>Active tab</button>}
          </>
        )}
      </div>
      {error && (
        <details className="capture-help">
          <summary>View audio error</summary>
          <p>{guidance ? 'Chrome did not authorize quick active-tab capture. Use Start capture and select the Meet tab in the picker.' : error}</p>
          {guidance && <code>{error}</code>}
        </details>
      )}
    </section>
  );
}
