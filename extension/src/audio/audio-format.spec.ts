import { describe, expect, it } from 'vitest';
import { normalizeRecordedAudioMimeType } from './audio-format';

describe('normalizeRecordedAudioMimeType', () => {
  it('removes MediaRecorder codec parameters before multipart upload', () => {
    expect(normalizeRecordedAudioMimeType('audio/webm;codecs=opus')).toBe('audio/webm');
  });

  it('falls back to the configured WebM recording format', () => {
    expect(normalizeRecordedAudioMimeType('')).toBe('audio/webm');
  });
});
