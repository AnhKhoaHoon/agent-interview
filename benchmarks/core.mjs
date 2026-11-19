import { createHash } from 'node:crypto';

export const LIMITS = Object.freeze({ repetitions: 3, textTurns: 90, audioTurns: 90, totalTurns: 180, apiRequests: 1200, timeoutMs: 90_000 });
export const METRICS = ['sttMs', 'providerFirstTokenMs', 'providerTotalMs', 'answerPreparationMs', 'requestToFirstTokenMs', 'requestToCompletedMs', 'speechEndToFirstVisibleMs', 'speechEndToCompletedMs'];
export function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}
export function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}
export function screen(answer, fixture) {
  const normalized = normalize(answer);
  const checks = fixture.rubric.map(point => ({ id: point.id, description: point.description, matched: new RegExp(point.pattern, 'i').test(normalized) }));
  return {
    method: 'lexical-screening-not-technical-verification',
    score: Math.round(100 * checks.filter(check => check.matched).length / checks.length), checks,
    verdict: 'needs_review', answerHash: digest(answer)
  };
}
export function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}
export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
export function summarize(rows) {
  const attempted = rows.filter(row => !['not_run', 'blocked'].includes(row.status));
  const completed = rows.filter(row => row.status === 'completed');
  return {
    planned: rows.length, attempted: attempted.length, completed: completed.length,
    failed: attempted.filter(row => row.status !== 'completed').length,
    timeout: rows.filter(row => row.status === 'timeout').length,
    blocked: rows.filter(row => row.status === 'blocked').length,
    notRun: rows.filter(row => row.status === 'not_run').length,
    completionRate: attempted.length ? completed.length / attempted.length : null,
    metrics: Object.fromEntries(METRICS.map(metric => {
      const values = attempted.map(row => row.metrics[metric]).filter(Number.isFinite);
      return [metric, { measured: values.length, missing: attempted.length - values.length, median: median(values), p95: percentile(values, .95) }];
    })),
    // Failures never disappear from SLO denominators, even when a token was seen.
    firstVisibleWithin3s: attempted.filter(row => row.status === 'completed' && row.metrics.speechEndToFirstVisibleMs < 3000 && Number.isFinite(row.metrics.speechEndToFirstVisibleMs)).length,
    firstVisibleWithin6s: attempted.filter(row => row.status === 'completed' && row.metrics.speechEndToFirstVisibleMs < 6000 && Number.isFinite(row.metrics.speechEndToFirstVisibleMs)).length
  };
}
export function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function wordErrorRate(reference, hypothesis) {
  const words = value => normalize(value).replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/).filter(Boolean);
  const a = words(reference), b = words(hypothesis);
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, previous[j] + 1, previous[j - 1] + Number(a[i - 1] !== b[j - 1]));
    previous = next;
  }
  return a.length ? previous[b.length] / a.length : null;
}
export function splitFrames(buffer) {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const parts = normalized.split('\n\n');
  return { rest: parts.pop(), frames: parts.flatMap(frame => {
    const type = frame.match(/^event:\s*(.+)$/m)?.[1];
    const data = frame.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
    return type && data ? [{ type, data: JSON.parse(data) }] : [];
  }) };
}
export function plannedRows(fixtures) {
  return ['text', 'audio'].flatMap(mode => Array.from({ length: LIMITS.repetitions }, (_, i) => fixtures.map(fixture => ({
    trialId: `${mode}-${fixture.id}-${i + 1}`, mode, caseId: fixture.id, repetition: i + 1,
    question: fixture.question, language: fixture.language, status: 'not_run', answer: '', transcript: null,
    metrics: Object.fromEntries(METRICS.map(metric => [metric, null])), error: null, review: null
  })))).flat();
}
