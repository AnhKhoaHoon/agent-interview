import { describe, expect, it } from 'vitest';
import { adaptiveSpeechThreshold, nextNoiseFloor, shouldUpdateNoiseFloor } from './vad-pipeline';
import { DEFAULT_VAD_CONFIGURATION } from './vad-config';

describe('adaptiveSpeechThreshold', () => {
  it('uses a small minimum threshold for quiet tab speech', () => {
    expect(adaptiveSpeechThreshold(0.001, DEFAULT_VAD_CONFIGURATION)).toBe(0.004);
    expect(adaptiveSpeechThreshold(0.006, DEFAULT_VAD_CONFIGURATION)).toBeCloseTo(0.0144);
  });

  it('caps the threshold in a noisy tab so speech can still be detected', () => {
    expect(adaptiveSpeechThreshold(0.1, DEFAULT_VAD_CONFIGURATION)).toBe(0.03);
  });

  it('does not treat a detected quiet voice as a new noise-floor sample', () => {
    const noiseFloor = 0.001;
    const threshold = adaptiveSpeechThreshold(noiseFloor, DEFAULT_VAD_CONFIGURATION);
    const quietVoice = 0.006;

    expect(quietVoice).toBeGreaterThan(threshold);
    expect(shouldUpdateNoiseFloor(quietVoice, threshold)).toBe(false);
    expect(shouldUpdateNoiseFloor(0.002, threshold)).toBe(true);
  });

  it('continues adapting from confirmed quiet samples', () => {
    expect(nextNoiseFloor(0.01, 0.002, DEFAULT_VAD_CONFIGURATION)).toBeCloseTo(0.00936);
  });
});
