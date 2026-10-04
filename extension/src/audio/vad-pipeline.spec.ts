import { describe, expect, it } from 'vitest';
import { adaptiveSpeechThreshold } from './vad-pipeline';
import { DEFAULT_VAD_CONFIGURATION } from './vad-config';

describe('adaptiveSpeechThreshold', () => {
  it('remains sensitive to quiet tab speech while adapting above tab noise', () => {
    expect(adaptiveSpeechThreshold(0.001, DEFAULT_VAD_CONFIGURATION)).toBe(0.004);
    expect(adaptiveSpeechThreshold(0.006, DEFAULT_VAD_CONFIGURATION)).toBeCloseTo(0.0144);
  });

  it('caps the threshold in a noisy tab so speech can still be detected', () => {
    expect(adaptiveSpeechThreshold(0.1, DEFAULT_VAD_CONFIGURATION)).toBe(0.03);
  });
});
