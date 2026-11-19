import test from 'node:test';
import assert from 'node:assert/strict';
import { cases, validateCases } from './cases.mjs';
import { csvCell, digest, median, percentile, plannedRows, screen, splitFrames, summarize, wordErrorRate } from './core.mjs';
import { providerCeiling } from './run.mjs';
import { reviewVerdict } from './report.mjs';

test('dataset has 30 DevOps fixtures, 15 questions per language and no hidden setup questions', () => {
  validateCases();
  assert.equal(cases.filter(item => item.language === 'vi').length, 15);
  assert.equal(cases.filter(item => item.language === 'en').length, 15);
  const rows = plannedRows(cases);
  assert.equal(rows.length, 180);
  assert.equal(new Set(rows.map(row => row.trialId)).size, 180);
  assert.equal(rows.filter(row => row.mode === 'text').length, 90);
});
test('failed and timed out turns remain in denominators and measured latency distributions', () => {
  const rows = [
    { status: 'completed', metrics: { providerFirstTokenMs: 100, speechEndToFirstVisibleMs: 200 } },
    { status: 'error', metrics: { providerFirstTokenMs: 9000, speechEndToFirstVisibleMs: 10000 } },
    { status: 'timeout', metrics: {} }, { status: 'not_run', metrics: {} }
  ];
  const result = summarize(rows);
  assert.equal(result.attempted, 3);
  assert.equal(result.failed, 2);
  assert.equal(result.completionRate, 1 / 3);
  assert.equal(result.metrics.providerFirstTokenMs.median, 4550);
  assert.equal(result.metrics.providerFirstTokenMs.p95, 9000);
  assert.equal(result.metrics.providerFirstTokenMs.missing, 1);
  assert.equal(result.firstVisibleWithin6s, 1);
  assert.equal(median([]), null);
  assert.equal(percentile([], .95), null);
});
test('SSE handles split CRLF boundaries, multiple frames, comments and multiline data', () => {
  const first = splitFrames(': heartbeat\r\n\r\nevent: answer.token\r\ndata: {"text":"D"}\r');
  assert.equal(first.frames.length, 0);
  const second = splitFrames(first.rest + '\n\r\nevent: answer.completed\ndata: {}\n\n');
  assert.deepEqual(second.frames.map(frame => frame.type), ['answer.token', 'answer.completed']);
  assert.equal(second.frames[0].data.text, 'D');
});
test('lexical screening cannot certify correctness or accept an outdated review', () => {
  const answer = 'image container package isolated';
  assert.equal(screen(answer, cases[0]).verdict, 'needs_review');
  assert.equal(reviewVerdict({ status: 'completed', answer }), 'needs_review');
  assert.equal(reviewVerdict({ status: 'completed', answer, review: { answerHash: 'stale', score: 100 } }), 'needs_review');
  assert.equal(reviewVerdict({ status: 'completed', answer, review: { answerHash: digest(answer), score: 100, criticalError: true } }), 'fail');
});
test('CSV prevents formulas and escapes quotes/newlines; WER counts substitutions/deletions', () => {
  assert.equal(csvCell('=IMPORT("x")'), '"\'=IMPORT(""x"")"');
  assert.equal(csvCell('a\nb'), '"a\nb"');
  assert.equal(wordErrorRate('Kubernetes HPA scales pods', 'Kubernetes scales nodes'), .5);
});
test('retry-aware provider bound is finite and includes embeddings and STT', () => {
  assert.deepEqual(providerCeiling({}), { llm: 540, stt: 270, embeddings: 540, total: 1350 });
  assert.throws(() => providerCeiling({ LLM_MAX_RETRIES: 'Infinity' }));
  assert.equal(providerCeiling({ RAG_ENABLED: 'false' }).embeddings, 0);
});
