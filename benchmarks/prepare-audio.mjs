import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { cases } from './cases.mjs';
import { digest } from './core.mjs';

// Explicit synthetic fixtures, not real human recordings or a substitute for noisy-call validation.
const directory = resolve(process.argv[2] ?? '/tmp/agent-interview-benchmark-audio');
if (directory.includes('/reports/')) throw new Error('Keep audio outside reports');
await mkdir(directory, { recursive: true });
const manifest = {};
for (const fixture of cases) {
  const path = join(directory, `${fixture.id}.wav`);
  const voice = fixture.language === 'vi' ? 'Linh' : 'Samantha';
  execFileSync('say', ['-v', voice, '-r', '165', '--file-format=WAVE', '--data-format=LEI16@16000', '-o', path, fixture.question], { timeout: 60000 });
  const bytes = await readFile(path);
  let offset = 12, data, sampleRate, channels, bits;
  while (offset + 8 <= bytes.length) {
    const name = bytes.toString('ascii', offset, offset + 4), length = bytes.readUInt32LE(offset + 4);
    if (name === 'fmt ') { channels = bytes.readUInt16LE(offset + 10); sampleRate = bytes.readUInt32LE(offset + 12); bits = bytes.readUInt16LE(offset + 22); }
    if (name === 'data') data = bytes.subarray(offset + 8, offset + 8 + length);
    offset += 8 + length + length % 2;
  }
  if (!data || bits !== 16 || channels !== 1 || !sampleRate) throw new Error('Expected mono PCM16 WAV from say');
  if (data.length / 2 / sampleRate < .3) throw new Error('Speech synthesis produced no usable audio; check macOS speech-service permissions');
  let last = data.length / 2 - 1;
  while (last > 0 && Math.abs(data.readInt16LE(last * 2)) < 100) last--;
  manifest[fixture.id] = { sha256: digest(bytes), voice, source: 'synthetic-macos-say', durationMs: Math.round(data.length / 2 / sampleRate * 1000), speechEndOffsetMs: Math.round((last + 1) / sampleRate * 1000) };
  if (manifest[fixture.id].durationMs > 30000) throw new Error('Audio exceeds VAD maximum');
  console.log(`${fixture.id}: ${manifest[fixture.id].durationMs}ms`);
}
await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Synthetic WAV fixtures prepared outside the repository and reports.');
