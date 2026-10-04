export interface TranscriptionOptions {
  durationMs: number;
  mimeType: string;
  filename: string;
  /** Optional per-segment V1 hint: vi for Vietnamese or en for English. */
  language?: string;
  /** Optional domain context supplied by backend orchestration only. */
  prompt?: string;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  provider: string;
}

export interface STTProvider {
  readonly name: string;
  transcribe(audio: Buffer, options: TranscriptionOptions): Promise<TranscriptionResult>;
}

export type SttProvider = STTProvider;
