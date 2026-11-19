import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export class AudioCoordinator {
  constructor(audioDirectory, extensionId) {
    if (!audioDirectory) throw new Error('--audio-dir is required; audio stays outside reports');
    this.audioDirectory = resolve(audioDirectory);
    this.extensionOrigin = `chrome-extension://${extensionId}`;
    this.events = [];
  }
  async listen(port = 4318) {
    this.manifest = JSON.parse(await readFile(join(this.audioDirectory, 'manifest.json'), 'utf8'));
    this.server = createServer((req, res) => void this.handle(req, res).catch(() => {
      if (!res.headersSent) res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end('{"error":"INVALID_COORDINATOR_REQUEST"}');
    }));
    await new Promise((resolve, reject) => { this.server.once('error', reject); this.server.listen(port, '127.0.0.1', resolve); });
    this.port = this.server.address().port;
    console.log(`Audio coordinator: http://localhost:${this.port} — open player, join from benchmark extension, share this tab, then Listen.`);
  }
  async handle(req, res) {
    const origin = req.headers.origin;
    if (![ `localhost:${this.port}`, `127.0.0.1:${this.port}` ].includes(req.headers.host)) { res.writeHead(403); return res.end(); }
    if (origin && origin !== this.extensionOrigin && !['http://localhost:4318', 'http://127.0.0.1:4318'].includes(origin)) { res.writeHead(403); return res.end(); }
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin'); res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    const path = new URL(req.url, 'http://localhost:4318').pathname;
    const json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
    if (req.method === 'GET' && path === '/') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end(await readFile(join(here, 'player.html'))); }
    if (req.method === 'GET' && path === '/trial') {
      // Per-interview token is only given to the exact extension origin; never to the playback website.
      if (origin !== this.extensionOrigin) { res.writeHead(403); return res.end(); }
      return json(this.active ? { trialId: this.active.row.trialId, language: this.active.row.language, question: this.active.row.question, session: this.active.session } : null);
    }
    if (req.method === 'GET' && path === '/playback') return json(this.active?.released && this.active.ready ? {
      trialId: this.active.row.trialId, question: this.active.row.question, language: this.active.row.language,
      url: `/audio/${this.active.row.caseId}.wav`, ...this.manifest[this.active.row.caseId]
    } : null);
    if (req.method === 'GET' && /^\/audio\/devops-\d\d\.wav$/.test(path)) {
      res.setHeader('Content-Type', 'audio/wav');
      return res.end(await readFile(join(this.audioDirectory, path.split('/').pop())));
    }
    if (req.method === 'POST' && ['/events', '/permit'].includes(path)) {
      let data = '';
      for await (const chunk of req) { data += chunk; if (data.length > 32768) throw new Error('BODY_TOO_LARGE'); }
      const event = JSON.parse(data);
      const active = this.active;
      if (!active || event.trialId !== active.row.trialId) return json({ accepted: false });
      if (path === '/permit') {
        if (origin !== this.extensionOrigin || !active.released || active.uploadPermitted) return json({ accepted: false });
        active.uploadPermitted = true;
        return json({ accepted: true });
      }
      const extensionKinds = ['ready', 'visible', 'segment', 'transcribed', 'transcription-error', 'sse-open'];
      if (extensionKinds.includes(event.kind) && origin !== this.extensionOrigin) { res.writeHead(403); return res.end(); }
      if (event.kind === 'ready') active.ready = true;
      if (event.kind === 'playback-start' && Number.isFinite(event.speechEndedAtMs)) active.row.referenceSpeechEndedAtMs = event.speechEndedAtMs;
      if (event.kind === 'segment' && Number.isFinite(event.speechEndedAtMs)) {
        active.row.vadSpeechEndedAtMs = event.speechEndedAtMs;
        active.row.uploadStartedAtMs = event.uploadStartedAtMs;
      }
      if (event.kind === 'transcribed' && typeof event.questionId === 'string') active.row.questionId ??= event.questionId;
      if (event.kind === 'transcription-error') active.row.audioErrorCode = /^[A-Z0-9_]+$/.test(event.code) ? event.code : 'TRANSCRIPTION_FAILED';
      if (event.kind === 'visible' && event.visible === true && event.questionId === active.row.questionId && Number.isFinite(event.atMs)) {
        active.row.firstVisibleAtMs ??= event.atMs;
        if (Number.isFinite(active.row.referenceSpeechEndedAtMs)) active.row.metrics.speechEndToFirstVisibleMs = Math.round(active.row.firstVisibleAtMs - active.row.referenceSpeechEndedAtMs);
      }
      return json({ accepted: true });
    }
    res.writeHead(404); res.end();
  }
  async prepare(row, fixture, session) {
    const audio = this.manifest[fixture.id];
    if (!audio || !Number.isFinite(audio.speechEndOffsetMs) || audio.durationMs > 30000) throw new Error('INVALID_AUDIO_FIXTURE');
    row.audioFixture = { sha256: audio.sha256, source: audio.source, voice: audio.voice ?? null, speechEndOffsetMs: audio.speechEndOffsetMs, durationMs: audio.durationMs };
    this.active = { row, fixture, session, ready: false, released: false, uploadPermitted: false };
    // Human permission/picker time is deliberately excluded from trial latency.
    while (!this.active.ready) await sleep(200);
  }
  release() { this.active.released = true; }
  async finish(row) {
    const deadline = Date.now() + 3000;
    while (!row.firstVisibleAtMs && Date.now() < deadline && !row.audioErrorCode) await sleep(100);
  }
  clear(row) { if (this.active?.row === row) this.active = undefined; }
  async close() { this.server.closeAllConnections(); await new Promise(resolve => this.server.close(resolve)); }
}
