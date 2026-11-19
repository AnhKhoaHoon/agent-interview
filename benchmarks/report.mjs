import { writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { cases } from './cases.mjs';
import { csvCell, digest, METRICS, summarize } from './core.mjs';

const md = value => String(value ?? 'n/a').replaceAll('|', '\\|').replaceAll('\n', '<br>');
export function reviewVerdict(row) {
  if (row.status !== 'completed') return row.status === 'not_run' || row.status === 'blocked' ? 'not_evaluated' : 'fail';
  const review = row.review;
  if (!review || review.answerHash !== digest(row.answer)) return 'needs_review';
  return review.criticalError || review.score < 80 ? 'fail' : 'pass';
}
export async function saveReport(directory, run) {
  run.summary = Object.fromEntries(['text', 'audio'].map(mode => [mode, summarize(run.rows.filter(row => row.mode === mode))]));
  const json = JSON.stringify(run, null, 2) + '\n';
  await writeFile(join(directory, 'results.json.tmp'), json);
  await rename(join(directory, 'results.json.tmp'), join(directory, 'results.json'));
  const columns = ['trialId', 'mode', 'caseId', 'repetition', 'question', 'language', 'status', 'transcript', 'answer', ...METRICS, 'wer', 'screeningScore', 'qualityScore', 'qualityVerdict', 'errorCode'];
  const lines = [columns.map(csvCell).join(',')];
  for (const row of run.rows) {
    const flat = { ...row, ...row.metrics, screeningScore: row.screening?.score, qualityScore: row.review?.score, qualityVerdict: reviewVerdict(row), errorCode: row.error?.code };
    lines.push(columns.map(column => csvCell(flat[column])).join(','));
  }
  await writeFile(join(directory, 'results.csv'), lines.join('\n') + '\n');
  const summary = ['# DevOps baseline benchmark', '', `Run: ${run.id}`, `Started: ${run.startedAt}`, '',
    'Scope: 30 DevOps cases × 3 repetitions per path; text first, then real Chrome tab audio.',
    'No model, prompt, VAD, RAG, retry, or quality policy optimization is part of this baseline.',
    '', `Budget: ${run.budget.turnSubmissions}/180 turn submissions; ${run.budget.apiRequests}/1200 backend requests.`,
    `Provider upper bound (including existing SDK retries): ${run.providerRequestCeiling ?? 'not captured'}.`,
    'This upper bound is a conservative bound, not a measured bill or count of actual upstream retries.', '',
    'Latency percentiles use every available measurement, including failed turns with observed tokens; missing values are counted explicitly. Failed/missing measurements never count as SLO successes.',
    'STT is the backend service duration from logs (includes transcript handoff). LLM provider timing excludes RAG/preparation. First-visible is a foreground, visible-element double-animation-frame approximation after React commits, not proof of physical display scanout.',
    'Audio reference speech end comes from the playback clock and annotated WAV offset; VAD speech end is recorded separately. No audio bytes or bearer/provider credentials are exported.',
    'Lexical scores are screening only. Final quality requires an answer-hash-bound reference review; reviewer method is recorded. An unreviewed response cannot pass.', '',
    '| Path | Planned | Attempted | Completed | Failed | Timeout | Blocked | Not run |', '|---|---:|---:|---:|---:|---:|---:|---:|'];
  for (const [mode, item] of Object.entries(run.summary)) summary.push(`| ${mode} | ${item.planned} | ${item.attempted} | ${item.completed} | ${item.failed} | ${item.timeout} | ${item.blocked} | ${item.notRun} |`);
  summary.push('', '| Path / metric (ms) | Measured | Missing | Median | p95 |', '|---|---:|---:|---:|---:|');
  for (const [mode, item] of Object.entries(run.summary)) for (const [metric, stats] of Object.entries(item.metrics)) summary.push(`| ${mode} / ${metric} | ${stats.measured} | ${stats.missing} | ${md(stats.median)} | ${md(stats.p95)} |`);
  const audio = run.summary.audio;
  const visible = audio.metrics.speechEndToFirstVisibleMs;
  const performanceVerdict = audio.completed === 90 && visible.measured === 90
    ? (visible.median < 3000 && visible.p95 < 6000 && audio.completionRate >= .98 ? 'pass' : 'fail') : 'incomplete';
  summary.push('', `Audio end-to-end performance: **${performanceVerdict}** (target median <3000 ms, p95 <6000 ms, completion ≥98%).`,
    `Audio completed within 3s: ${audio.firstVisibleWithin3s}/${audio.attempted}; within 6s: ${audio.firstVisibleWithin6s}/${audio.attempted}.`,
    'Text API latency is diagnostic; it cannot satisfy the audio-to-visible SLO.', '', '## Configuration and provenance', '', '```json', JSON.stringify(run.provenance, null, 2), '```', '', '## Trials', '');
  for (const row of run.rows) {
    const fixture = cases.find(item => item.id === row.caseId);
    summary.push(`### ${row.trialId}`, '', `Status: **${row.status}**; quality: **${reviewVerdict(row)}**; screening: ${row.screening?.score ?? 'n/a'}/100; reviewed score: ${row.review?.score ?? 'n/a'}/100.`, '',
      `Question: ${row.question}`, '', `Transcript: ${row.transcript ?? 'not measured (text path or not run)'}`, '',
      `Answer: ${row.answer || '(no answer)'}`, '', `Reference: ${fixture.reference}`, '',
      ...fixture.rubric.map(point => `- ${point.description}`), '',
      `Sources: ${fixture.sources.join(', ')}`, '',
      `Metrics: ${JSON.stringify(row.metrics)}`, `Error: ${row.error ? JSON.stringify(row.error) : 'none'}`, '',
      ...(row.review ? [`Review (${row.review.method}): ${row.review.notes}`, ''] : []));
  }
  await writeFile(join(directory, 'report.md'), summary.join('\n').trimEnd() + '\n');
}
