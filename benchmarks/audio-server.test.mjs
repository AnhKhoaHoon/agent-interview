import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AudioCoordinator } from './audio-server.mjs';

test('coordinator isolates session credentials and permits only one audio upload', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'devops-coordinator-test-'));
  await writeFile(join(directory, 'manifest.json'), '{}');
  const coordinator = new AudioCoordinator(directory, 'test-extension');
  await coordinator.listen(0);
  const base = `http://127.0.0.1:${coordinator.port}`;
  const origin = 'chrome-extension://test-extension';
  const row = { trialId: 'audio-devops-01-1', caseId: 'devops-01', question: 'Docker là gì?', language: 'vi', metrics: {} };
  coordinator.active = { row, session: { id: 'test-session', accessToken: 'test-token-not-a-provider-key' }, ready: true, released: true, uploadPermitted: false };
  const post = (path, body, source = origin) => fetch(base + path, { method: 'POST', headers: { Origin: source, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.equal((await fetch(base + '/trial', { headers: { Origin: 'https://untrusted.example' } })).status, 403);
    assert.equal((await fetch(base + '/trial')).status, 403);
    const trial = await (await fetch(base + '/trial', { headers: { Origin: origin } })).json();
    assert.equal(trial.session.accessToken, 'test-token-not-a-provider-key');
    const playback = await (await fetch(base + '/playback')).json();
    assert.equal('session' in playback, false);
    assert.equal(JSON.stringify(playback).includes('test-token'), false);
    const request = { trialId: row.trialId };
    assert.equal((await (await post('/permit', request)).json()).accepted, true);
    assert.equal((await (await post('/permit', request)).json()).accepted, false);
    assert.equal((await (await post('/permit', { trialId: 'stale' })).json()).accepted, false);
    await post('/events', { trialId: row.trialId, kind: 'playback-start', speechEndedAtMs: 1000 });
    await post('/events', { trialId: row.trialId, kind: 'transcribed', questionId: 'q1' });
    await post('/events', { trialId: row.trialId, kind: 'visible', visible: true, questionId: 'other', atMs: 2000 });
    assert.equal(row.metrics.speechEndToFirstVisibleMs, undefined);
    await post('/events', { trialId: row.trialId, kind: 'visible', visible: true, questionId: 'q1', atMs: 2500 });
    assert.equal(row.metrics.speechEndToFirstVisibleMs, 1500);
    assert.equal((await post('/events', { trialId: row.trialId, kind: 'ready' }, 'http://localhost:4318')).status, 403);
  } finally {
    await coordinator.close();
    await rm(directory, { recursive: true, force: true });
  }
});
