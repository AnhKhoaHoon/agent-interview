import type { CaptureDiagnostics } from '../../audio/tab-capture';

interface DevCaptureDiagnosticsProps {
  diagnostics: CaptureDiagnostics;
  lastSegmentDurationMs?: number;
  lastSpeechEndToFirstAnswerMs?: number;
}

export function DevCaptureDiagnostics({ diagnostics, lastSegmentDurationMs, lastSpeechEndToFirstAnswerMs }: DevCaptureDiagnosticsProps): JSX.Element {
  return (
    <section className="capture-diagnostics" aria-label="Capture diagnostics">
      <h2>Capture diagnostics</h2>
      <dl>
        <div><dt>Stream active</dt><dd>{diagnostics.streamActive ? 'yes' : 'no'}</dd></div>
        <div><dt>Audio track</dt><dd>{diagnostics.audioTrackState}</dd></div>
        <div><dt>Sample rate</dt><dd>{diagnostics.sampleRate ? `${diagnostics.sampleRate} Hz` : 'unavailable'}</dd></div>
        <div><dt>Last segment</dt><dd>{lastSegmentDurationMs ? `${Math.round(lastSegmentDurationMs)} ms` : 'none'}</dd></div>
        <div><dt>Speech end → first answer</dt><dd>{lastSpeechEndToFirstAnswerMs ? `${Math.round(lastSpeechEndToFirstAnswerMs)} ms` : 'none'}</dd></div>
      </dl>
    </section>
  );
}
