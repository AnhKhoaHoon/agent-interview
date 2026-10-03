import { normalizeAudioContentType, SUPPORTED_AUDIO_TYPES } from './transcription.config';

describe('transcription content types', () => {
  it('accepts a supported MediaRecorder type with codec parameters after normalization', () => {
    expect(SUPPORTED_AUDIO_TYPES.has(normalizeAudioContentType('audio/webm;codecs=opus'))).toBe(true);
  });

  it('normalizes casing and whitespace without widening the allowlist', () => {
    expect(normalizeAudioContentType(' Audio/WebM ; codecs=opus')).toBe('audio/webm');
    expect(SUPPORTED_AUDIO_TYPES.has(normalizeAudioContentType('video/webm;codecs=vp8,opus'))).toBe(false);
  });
});
