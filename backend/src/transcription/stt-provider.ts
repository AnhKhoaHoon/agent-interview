export interface TranscriptionOptions {
  durationMs: number;
  mimeType: string;
  filename: string;
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
