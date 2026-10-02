import type { PanelStatus } from '../../types/interview';

const labels: Record<PanelStatus, string> = {
  idle: 'Idle',
  connected: 'Connected',
  thinking: 'Thinking',
  streaming: 'Streaming',
  error: 'Error'
};

export function StatusBar({ status }: { status: PanelStatus }): JSX.Element {
  return <div className={`status status-${status}`} aria-live="polite"><span className="status-dot" aria-hidden="true" />{labels[status]}</div>;
}
