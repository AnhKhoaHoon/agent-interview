export const SUPPORTED_AUDIO_TYPES = new Set(['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a']);

export function normalizeAudioContentType(contentType: string): string {
  return contentType.split(';', 1)[0]?.trim().toLowerCase() ?? '';
}

export interface TranscriptionConfiguration {
  maxAudioBytes: number;
  maxDurationMs: number;
}

export function transcriptionConfiguration(): TranscriptionConfiguration {
  return {
    maxAudioBytes: Number(process.env.STT_MAX_AUDIO_BYTES ?? 10 * 1024 * 1024),
    maxDurationMs: Number(process.env.STT_MAX_DURATION_MS ?? 31_000)
  };
}
