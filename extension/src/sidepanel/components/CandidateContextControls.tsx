import { useRef } from 'react';
import type { CandidateContextKind, CandidateContextSummary } from '../../api/interview.api';

interface CandidateContextControlsProps {
  disabled: boolean;
  contexts: CandidateContextSummary[];
  uploadingKind?: CandidateContextKind;
  onUpload: (kind: CandidateContextKind, document: File) => void;
  onRemove: (kind: CandidateContextKind) => void;
}

const labels: Record<CandidateContextKind, string> = {
  profile: 'CV',
  'job-description': 'JD'
};

export function CandidateContextControls({ disabled, contexts, uploadingKind, onUpload, onRemove }: CandidateContextControlsProps): JSX.Element {
  const profileInput = useRef<HTMLInputElement>(null);
  const jobDescriptionInput = useRef<HTMLInputElement>(null);
  const contextFor = (kind: CandidateContextKind): CandidateContextSummary | undefined =>
    contexts.find((context) => context.kind === (kind === 'profile' ? 'profile' : 'job_description'));
  const select = (kind: CandidateContextKind, input: HTMLInputElement | null): void => {
    if (!input) return;
    const document = input.files?.[0];
    input.value = '';
    if (document) onUpload(kind, document);
  };

  return (
    <details className="candidate-context-controls">
      <summary aria-label="Open candidate profile context">Profile <span>{contexts.length ? `${contexts.length}/2` : 'Optional'}</span></summary>
      <div className="candidate-context-menu">
        <p>Use verified experience from your CV; attach a JD for the target role.</p>
        <div className="candidate-context-actions">
          {(['profile', 'job-description'] as const).map((kind) => {
            const context = contextFor(kind);
            const inputRef = kind === 'profile' ? profileInput : jobDescriptionInput;
            const isUploading = uploadingKind === kind;
            return (
              <div className="candidate-context-item" key={kind}>
                <input ref={inputRef} type="file" accept="application/pdf,text/plain,text/markdown,.pdf,.txt,.md" onChange={(event) => select(kind, event.currentTarget)} hidden />
                <div className="candidate-context-item-actions">
                  <button className="button ghost compact-button" type="button" disabled={disabled || Boolean(uploadingKind)} onClick={() => inputRef.current?.click()}>
                    {isUploading ? `Uploading ${labels[kind]}…` : context ? `Replace ${labels[kind]}` : `Add ${labels[kind]}`}
                  </button>
                  {context && <button className="text-button" type="button" disabled={disabled || Boolean(uploadingKind)} onClick={() => onRemove(kind)}>Remove</button>}
                </div>
                <small>{context ? `${context.sourceFilename} · ${context.characterCount.toLocaleString()} chars` : kind === 'profile' ? 'PDF, TXT, or MD' : 'Optional target role/JD'}</small>
              </div>
            );
          })}
        </div>
      </div>
    </details>
  );
}
