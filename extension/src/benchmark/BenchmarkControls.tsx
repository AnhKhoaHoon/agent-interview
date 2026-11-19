import { useEffect, useRef, useState } from 'react';
import { benchmarkEvent, nextBenchmarkTrial, setBenchmarkTrial, type BenchmarkTrial } from './client';

interface Props {
  onTrial: (trial: BenchmarkTrial) => Promise<void>;
  ready: boolean;
}
export function BenchmarkControls({ onTrial, ready }: Props): JSX.Element {
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState('90 audio turns maximum. Join explicitly, share the player tab, then Listen.');
  const latest = useRef({ onTrial, ready });
  latest.current = { onTrial, ready };
  useEffect(() => {
    if (!joined) return;
    let cancelled = false, busy = false, trialId = '';
    const poll = async () => {
      if (busy) return;
      busy = true;
      try {
        const trial = await nextBenchmarkTrial();
        if (cancelled) return;
        if (trial && trial.trialId !== trialId) {
          trialId = trial.trialId;
          setBenchmarkTrial(trial);
          await latest.current.onTrial(trial);
          setStatus(`${trial.trialId}: ${trial.question}`);
        }
        if (trial && latest.current.ready) benchmarkEvent('ready');
      } catch (error) { if (!cancelled) setStatus(error instanceof Error ? error.message : 'Coordinator unavailable'); }
      finally { busy = false; }
    };
    const interval = setInterval(() => void poll(), 400);
    void poll();
    return () => { cancelled = true; clearInterval(interval); setBenchmarkTrial(undefined); };
  }, [joined]);
  return (
    <aside aria-label="DevOps benchmark controls">
      <button type="button" onClick={() => setJoined(value => !value)}>{joined ? 'Leave benchmark' : 'Join benchmark'}</button>
      <small role="status"> {status}</small>
    </aside>
  );
}
