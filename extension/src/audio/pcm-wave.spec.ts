import { describe, expect, it } from 'vitest';
import { encodeMonoPcm16Wave } from './pcm-wave';

describe('encodeMonoPcm16Wave', () => {
  it('creates a self-contained mono PCM WAV file for every utterance', async () => {
    const audio = encodeMonoPcm16Wave([new Float32Array([-1, 0, 1])], 48_000);
    const bytes = new Uint8Array(await audio.arrayBuffer());

    expect(audio.type).toBe('audio/wav');
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('RIFF');
    expect(new TextDecoder().decode(bytes.slice(8, 12))).toBe('WAVE');
    expect(new DataView(bytes.buffer).getUint32(24, true)).toBe(48_000);
    expect(new DataView(bytes.buffer).getUint32(40, true)).toBe(6);
    expect(bytes).toHaveLength(50);
  });
});
