import { execFileSync } from 'node:child_process';
import { readFile, mkdir, open, unlink } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';
import { cases, validateCases } from './cases.mjs';
import { LIMITS, digest, plannedRows, screen, splitFrames, wordErrorRate } from './core.mjs';
import { saveReport } from './report.mjs';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SAFE_SETTINGS = ['NODE_ENV', 'LLM_PROVIDER', 'LLM_MODEL', 'LLM_ROUTINE_MODEL', 'LLM_REASONING_EFFORT', 'LLM_MAX_OUTPUT_TOKENS', 'LLM_VERBOSITY', 'LLM_ROUTINE_REASONING_EFFORT', 'LLM_ROUTINE_MAX_OUTPUT_TOKENS', 'LLM_ROUTINE_VERBOSITY', 'LLM_TIMEOUT_MS', 'LLM_MAX_RETRIES', 'STT_PROVIDER', 'STT_MODEL', 'STT_TIMEOUT_MS', 'STT_MAX_RETRIES', 'EMBEDDING_MODEL', 'EMBEDDING_MAX_RETRIES', 'EMBEDDING_TIMEOUT_MS', 'RAG_ENABLED', 'RAG_MAX_CHUNKS', 'RAG_MIN_SIMILARITY', 'RAG_MIN_KEYWORD_COVERAGE'];
export function runtimeSnapshot() {
  const script = `const keys=${JSON.stringify(SAFE_SETTINGS)};console.log(JSON.stringify(Object.fromEntries(keys.map(k=>[k,process.env[k]??null]))))`;
  return JSON.parse(execFileSync('docker', ['compose', 'exec', '-T', 'backend', 'node', '-e', script], { cwd: root, encoding: 'utf8', timeout: 15000 }).trim());
}
export function providerCeiling(settings) {
  const retries = name => {
    const number = Number(settings[name] ?? 2);
    if (!Number.isInteger(number) || number < 0 || number > 10) throw new Error('Provider retry budget must be finite and ≤10');
    return number + 1;
  };
  const llm = LIMITS.totalTurns * retries('LLM_MAX_RETRIES');
  const stt = LIMITS.audioTurns * retries('STT_MAX_RETRIES');
  const embeddings = settings.RAG_ENABLED === 'false' ? 0 : LIMITS.totalTurns * retries('EMBEDDING_MAX_RETRIES');
  return { llm, stt, embeddings, total: llm + stt + embeddings };
}
export async function provenance() {
  const paths = ['backend/src/ai/prompt/prompt-builder.service.ts', 'backend/src/ai/planner/interview-answer-planner.service.ts', 'backend/src/ai/providers/openai-llm.provider.ts', 'backend/src/transcription/providers/openai-stt.provider.ts', 'extension/src/audio/vad-config.ts', 'benchmarks/cases.mjs'];
  const hashes = Object.fromEntries(await Promise.all(paths.map(async path => [path, digest(await readFile(join(root, path)))])));
  return {
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    worktreeStatus: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }).trim(),
    settings: runtimeSnapshot(), hashes, node: process.version, platform: process.platform,
    backendImage: execFileSync('docker', ['inspect', '--format', '{{.Image}}', 'app-phong-van-backend-1'], { encoding: 'utf8' }).trim(),
    load: 'serial; no warmup; all planned attempts retained',
    qualityPolicy: 'Lexical screening plus optional answer-hash-bound reference review; no additional judge API calls'
  };
}
export function enrichFromLogs(run) {
  const text = execFileSync('docker', ['compose', 'logs', '--no-log-prefix', '--since', run.startedAt, 'backend'], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 15000 });
  const byQuestion = new Map(run.rows.filter(row => row.questionId).map(row => [row.questionId, row]));
  for (const line of text.split('\n')) {
    const index = line.indexOf('{');
    if (index < 0) continue;
    let event;
    try { event = JSON.parse(stripVTControlCharacters(line.slice(index))); } catch { continue; }
    const row = byQuestion.get(event.questionId);
    if (!row) continue;
    if (event.event === 'llm.first_token') row.metrics.providerFirstTokenMs = event.providerFirstTokenMs;
    if (event.event === 'answer.context_ready') row.metrics.answerPreparationMs = event.answerPreparationMs;
    if (event.event === 'answer.completed') row.metrics.providerTotalMs = event.providerTotalMs;
    if (event.event === 'stt.completed') row.metrics.sttMs = event.sttLatencyMs;
    if (event.event === 'answer.plan') row.classification = { category: event.category, responseMode: event.responseMode, level: event.level, promptVersion: event.promptVersion };
    if (event.event === 'answer.quality_warning') row.backendQualityWarnings = event.warnings;
  }
}
export class Runner {
  constructor(run, directory, base) { this.run = run; this.directory = directory; this.base = base; this.sessions = new Map(); }
  async save() { await saveReport(this.directory, this.run); }
  async request(path, options = {}, signal = AbortSignal.timeout(15000)) {
    if (this.run.budget.apiRequests >= LIMITS.apiRequests) throw new Error('API_REQUEST_BUDGET');
    this.run.budget.apiRequests++;
    const response = await fetch(this.base + path, { ...options, signal });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error = new Error(`HTTP_${response.status}`);
      error.code = /^[A-Z0-9_]{1,80}$/.test(body.code) ? body.code : `HTTP_${response.status}`;
      throw error;
    }
    return response;
  }
  async session(fixture, repetition) {
    const parentKey = `${fixture.parentId ?? fixture.id}-${repetition}`;
    if (fixture.parentId) {
      const parent = this.run.rows.find(row => row.mode === this.mode && row.caseId === fixture.parentId && row.repetition === repetition);
      if (parent?.status !== 'completed' || !this.sessions.has(parentKey)) throw new Error('PARENT_NOT_COMPLETED');
      return this.sessions.get(parentKey);
    }
    const response = await this.request('/interviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'devops' }) });
    const session = await response.json();
    this.sessions.set(parentKey, session);
    if (fixture.profile) {
      const form = new FormData();
      form.append('document', new Blob([fixture.profile], { type: 'text/plain' }), 'synthetic-profile.txt');
      await this.request(`/interviews/${session.id}/context/profile`, { method: 'POST', headers: { Authorization: `Bearer ${session.accessToken}` }, body: form });
    }
    return session;
  }
  async closeSessions() {
    for (const session of this.sessions.values()) {
      await this.request(`/interviews/${session.id}/end`, { method: 'POST', headers: { Authorization: `Bearer ${session.accessToken}` } }).catch(() => undefined);
    }
    this.sessions.clear();
  }
  async trial(row, fixture, coordinator) {
    const controller = new AbortController();
    let timer;
    let audioFailureTimer;
    let session;
    try {
      session = await this.session(fixture, row.repetition);
      const headers = { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' };
      // SSE is subscribed before sending a question. Tokens may precede POST completion.
      const response = await this.request(`/interviews/${session.id}/events`, { headers }, controller.signal);
      const reader = response.body.getReader();
      if (coordinator) await coordinator.prepare(row, fixture, session);
      if (this.run.budget.turnSubmissions >= LIMITS.totalTurns) throw new Error('TURN_BUDGET');
      row.status = 'running'; row.startedAt = new Date().toISOString();
      this.run.budget.turnSubmissions++;
      await this.save(); // consume the slot durably before a request that could incur cost
      const started = performance.now();
      timer = setTimeout(() => controller.abort(), LIMITS.timeoutMs);
      if (coordinator) audioFailureTimer = setInterval(() => { if (row.audioErrorCode) controller.abort(); }, 100);
      if (!coordinator) {
        const accepted = await this.request(`/interviews/${session.id}/questions`, {
          method: 'POST', headers, body: JSON.stringify({ question: fixture.question, language: fixture.language })
        }, controller.signal);
        row.questionId = (await accepted.json()).questionId;
      } else coordinator.release();
      let buffer = '';
      const decoder = new TextDecoder();
      const previousIds = new Set(this.run.rows.filter(item => item !== row && item.questionId).map(item => item.questionId));
      let completed = false;
      while (!completed) {
        const chunk = await reader.read();
        if (chunk.done) throw new Error('SSE_DISCONNECTED');
        const parsed = splitFrames(buffer + decoder.decode(chunk.value, { stream: true }));
        buffer = parsed.rest;
        for (const event of parsed.frames) {
          const data = event.data;
          if (coordinator && event.type === 'question.transcribed' && !previousIds.has(data.questionId) && (!row.questionId || row.questionId === data.questionId)) {
            row.questionId = data.questionId; row.transcript = data.text;
            row.wer = wordErrorRate(fixture.question, data.text);
          }
          if (!row.questionId || data.questionId !== row.questionId) continue;
          if (event.type === 'answer.token' && typeof data.text === 'string' && data.text.length) {
            row.metrics.requestToFirstTokenMs ??= coordinator && row.uploadStartedAtMs ? Date.now() - row.uploadStartedAtMs : Math.round(performance.now() - started);
            row.answer += data.text;
          }
          if (event.type === 'answer.completed') { row.status = 'completed'; completed = true; }
          if (event.type === 'answer.error') {
            row.status = 'error'; row.error = { code: /^[A-Z0-9_]{1,80}$/.test(data.code) ? data.code : 'ANSWER_FAILED' }; completed = true;
          }
        }
      }
      row.metrics.requestToCompletedMs = coordinator && row.uploadStartedAtMs ? Date.now() - row.uploadStartedAtMs : Math.round(performance.now() - started);
      if (coordinator && row.referenceSpeechEndedAtMs) row.metrics.speechEndToCompletedMs = Math.round(Date.now() - row.referenceSpeechEndedAtMs);
      if (coordinator) await coordinator.finish(row);
    } catch (error) {
      const timeout = !row.audioErrorCode && (controller.signal.aborted || error.name === 'TimeoutError');
      row.status = error.message === 'PARENT_NOT_COMPLETED' ? 'blocked' : timeout ? 'timeout' : 'error';
      row.error = { code: row.audioErrorCode ?? (timeout ? 'TRIAL_TIMEOUT' : error.code ?? (/^[A-Z0-9_]+$/.test(error.message) ? error.message : 'BENCHMARK_REQUEST_FAILED')) };
      if (row.questionId && session) await this.request(`/interviews/${session.id}/questions/${row.questionId}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${session.accessToken}` } }).catch(() => undefined);
    } finally {
      clearTimeout(timer); clearInterval(audioFailureTimer); controller.abort();
      row.finishedAt = new Date().toISOString();
      row.elapsedMs = row.startedAt ? Date.now() - Date.parse(row.startedAt) : null;
      row.screening = screen(row.answer, fixture);
      if (coordinator) coordinator.clear(row);
      enrichFromLogs(this.run);
      await this.save();
      console.log(`${row.trialId} ${row.status} first=${row.metrics.requestToFirstTokenMs ?? 'n/a'}ms screen=${row.screening.score}`);
    }
  }
  async execute(mode, coordinator) {
    this.mode = mode;
    try {
      for (let repetition = 1; repetition <= 3; repetition++) {
        for (const fixture of cases) {
          const row = this.run.rows.find(item => item.mode === mode && item.caseId === fixture.id && item.repetition === repetition);
          if (row.status !== 'not_run') continue; // no paid automatic retry or replay on resume
          await this.trial(row, fixture, coordinator);
        }
        await this.closeSessions();
      }
    } finally { await this.closeSessions(); }
  }
}

async function main() {
  validateCases();
  const mode = process.argv[2];
  if (!['text', 'audio', 'report'].includes(mode)) throw new Error('Usage: node benchmarks/run.mjs text|audio|report --run-dir reports/NAME [--audio-dir /tmp/fixtures]');
  const option = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback;
  const directory = resolve(option('--run-dir', 'reports/devops-baseline'));
  await mkdir(directory, { recursive: true });
  const lockPath = join(directory, '.lock');
  const lock = await open(lockPath, 'wx');
  try {
    let run;
    try { run = JSON.parse(await readFile(join(directory, 'results.json'), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (!run) {
      const origin = await provenance();
      const ceiling = providerCeiling(origin.settings);
      run = { schemaVersion: 1, id: directory.split('/').pop(), startedAt: new Date().toISOString(), provenance: origin, providerBudget: ceiling, providerRequestCeiling: ceiling.total,
        budget: { turnSubmissions: 0, apiRequests: 0 }, rows: plannedRows(cases) };
    }
    // A crashed request stays in the dataset and consumes its reserved budget.
    for (const row of run.rows) if (row.status === 'running') { row.status = 'interrupted'; row.error = { code: 'RUN_INTERRUPTED' }; }
    if (mode !== 'report' && JSON.stringify(runtimeSnapshot()) !== JSON.stringify(run.provenance.settings)) throw new Error('Runtime configuration changed; baseline must remain fixed');
    const runner = new Runner(run, directory, option('--base-url', 'http://localhost:3000/api/v1'));
    await runner.save();
    if (mode === 'text') await runner.execute('text');
    if (mode === 'audio') {
      if (run.rows.some(row => row.mode === 'text' && row.status === 'not_run')) throw new Error('Finish text phase before audio');
      const { AudioCoordinator } = await import('./audio-server.mjs');
      const coordinator = new AudioCoordinator(option('--audio-dir', ''), option('--extension-id', 'aklgafpohgdkpgkelafhekggpgmimgie'));
      await coordinator.listen();
      try { await runner.execute('audio', coordinator); } finally { await coordinator.close(); }
    }
    if (mode === 'report') {
      try {
        const reviews = JSON.parse(await readFile(join(directory, 'reviews.json'), 'utf8'));
        for (const row of run.rows) if (reviews[row.trialId]) {
          const review = reviews[row.trialId];
          if (review.answerHash !== digest(row.answer) || !Number.isFinite(review.score) || review.score < 0 || review.score > 100 || !review.method || !review.notes) throw new Error('Invalid or stale review');
          row.review = review;
        }
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    enrichFromLogs(run);
    await runner.save();
  } finally { await lock.close(); await unlink(lockPath); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
