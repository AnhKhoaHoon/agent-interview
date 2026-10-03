export const DEFAULT_RECORDED_AUDIO_MIME_TYPE = 'audio/webm';

export function normalizeRecordedAudioMimeType(contentType: string): string {
  const baseType = contentType.split(';', 1)[0]?.trim().toLowerCase();
  return baseType || DEFAULT_RECORDED_AUDIO_MIME_TYPE;
}
