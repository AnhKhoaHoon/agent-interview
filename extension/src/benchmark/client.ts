import type { InterviewSession, TranscriptionLanguage } from '../types/interview';

export const BENCHMARK_BUILD = import.meta.env.VITE_BENCHMARK_ENABLED === 'true';
const COORDINATOR = 'http://localhost:4318';
export interface BenchmarkTrial {
  trialId: string;
  question: string;
  language: TranscriptionLanguage;
  session: InterviewSession;
}
let active: BenchmarkTrial | undefined;
let claimed = false;
const visibleQuestions = new Set<string>();
export function setBenchmarkTrial(trial?: BenchmarkTrial): void {
  active = trial;
  claimed = false;
  visibleQuestions.clear();
}
export async function nextBenchmarkTrial(): Promise<BenchmarkTrial | null> {
  const response = await fetch(`${COORDINATOR}/trial`, { signal: AbortSignal.timeout(2000) });
  if (!response.ok) throw new Error('Benchmark coordinator rejected this extension origin.');
  return response.json() as Promise<BenchmarkTrial | null>;
}
export function benchmarkEvent(kind: string, fields: Record<string, string | number | boolean> = {}): void {
  if (!BENCHMARK_BUILD || !active) return;
  void fetch(`${COORDINATOR}/events`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trialId: active.trialId, kind, ...fields }), signal: AbortSignal.timeout(2000)
  }).catch(() => undefined);
}
export async function permitBenchmarkSegment(): Promise<boolean> {
  if (!BENCHMARK_BUILD || !active) return true;
  if (claimed) return false;
  claimed = true;
  const trialId = active.trialId;
  try {
    const response = await fetch(`${COORDINATOR}/permit`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trialId }), signal: AbortSignal.timeout(2000)
    });
    const result = await response.json() as { accepted?: boolean };
    return response.ok && result.accepted === true && active?.trialId === trialId;
  } catch { return false; }
}
export function elementIsVisible(element: HTMLElement, documentVisible: boolean): boolean {
  if (!documentVisible) return false;
  const box = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return box.width > 0 && box.height > 0 && box.top < innerHeight && box.bottom > 0 && box.left < innerWidth && box.right > 0
    && style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
}
export function reportFirstVisible(element: HTMLElement, questionId: string): () => void {
  if (!BENCHMARK_BUILD || !active || visibleQuestions.has(questionId)) return () => undefined;
  let second = 0;
  const trialId = active.trialId;
  const first = requestAnimationFrame(() => {
    second = requestAnimationFrame(() => {
      if (active?.trialId !== trialId || visibleQuestions.has(questionId) || !elementIsVisible(element, document.visibilityState === 'visible')) return;
      visibleQuestions.add(questionId);
      benchmarkEvent('visible', { questionId, atMs: performance.timeOrigin + performance.now(), visible: true });
    });
  });
  return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
}
