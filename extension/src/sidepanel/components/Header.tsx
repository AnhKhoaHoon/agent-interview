import type { PanelStatus } from '../../types/interview';

interface HeaderProps {
  status: PanelStatus;
  hasSession: boolean;
  onStart: () => void;
  onStop: () => void;
}

const labels: Record<PanelStatus, string> = {
  idle: 'Idle',
  connected: 'Connected',
  thinking: 'Thinking',
  streaming: 'Answering',
  error: 'Connection issue'
};

export function Header({ status, hasSession, onStart, onStop }: HeaderProps): JSX.Element {
  return (
    <header className="app-header">
      <div className="app-identity">
        <h1>Agent Interview</h1>
        <div className="header-meta">
          <span className="role-chip">DevOps</span>
          <span className={`header-status status-${status}`} aria-live="polite">
            <span className="status-dot" aria-hidden="true" />{labels[status]}
          </span>
        </div>
      </div>
      {hasSession ? (
        <button className="button secondary compact-button" type="button" onClick={onStop} aria-label="End interview session">End</button>
      ) : (
        <button className="button compact-button" type="button" onClick={onStart} disabled={status === 'thinking'}>Start</button>
      )}
    </header>
  );
}
