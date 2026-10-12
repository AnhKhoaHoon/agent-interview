import { useState, type ReactNode } from 'react';
import type { InterviewRole, PanelStatus } from '../../types/interview';

interface HeaderProps {
  status: PanelStatus;
  hasSession: boolean;
  controls: ReactNode;
  role: InterviewRole;
  roleLocked: boolean;
  onRoleChange: (role: InterviewRole) => void;
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

export function Header({ status, hasSession, controls, role, roleLocked, onRoleChange, onStart, onStop }: HeaderProps): JSX.Element {
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const selectedRoleLabel = role === 'devops' ? 'DevOps' : 'DBA';

  return (
    <header className="app-header">
      <div className="header-main-row">
        <div className="app-identity">
          <h1>Agent Interview</h1>
          <div className="header-meta">
            <div className="role-selector">
              <button
                className="role-trigger"
                type="button"
                disabled={roleLocked}
                aria-haspopup="listbox"
                aria-expanded={isRoleMenuOpen}
                aria-label={`Interview role: ${selectedRoleLabel}`}
                onClick={() => setIsRoleMenuOpen((open) => !open)}
              >
                <span>Role</span>
                <strong>{selectedRoleLabel}</strong>
                <i aria-hidden="true">⌄</i>
              </button>
              {isRoleMenuOpen && (
                <div className="role-options" role="listbox" aria-label="Select interview role">
                {(['devops', 'dba'] as const).map((option) => (
                  <button
                    className={`role-option ${role === option ? 'is-active' : ''}`}
                    type="button"
                    key={option}
                    role="option"
                    aria-selected={role === option}
                    onClick={() => {
                      onRoleChange(option);
                      setIsRoleMenuOpen(false);
                    }}
                  >
                    {option === 'devops' ? 'DevOps' : 'DBA'}
                  </button>
                ))}
              </div>
              )}
            </div>
            <span className={`header-status status-${status}`} aria-live="polite">
              <span className="status-dot" aria-hidden="true" />{labels[status]}
            </span>
          </div>
        </div>
        {hasSession ? (
          <button className="button secondary compact-button session-button" type="button" onClick={onStop} aria-label="End interview session">End</button>
        ) : (
          <button className="button compact-button session-button" type="button" onClick={onStart} disabled={status === 'thinking'}>Start</button>
        )}
      </div>
      <div className="header-controls">{controls}</div>
    </header>
  );
}
