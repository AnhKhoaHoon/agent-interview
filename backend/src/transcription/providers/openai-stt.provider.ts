import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import OpenAI, { toFile } from 'openai';
import { SttProvider, TranscriptionOptions, TranscriptionResult } from '../stt-provider';

@Injectable()
export class OpenAiSttProvider implements SttProvider {
  readonly name = 'openai';
  private readonly logger = new Logger(OpenAiSttProvider.name);

  async transcribe(audio: Buffer, options: TranscriptionOptions): Promise<TranscriptionResult> {
    const apiKey = process.env.STT_API_KEY;
    if (!apiKey) throw new ServiceUnavailableException({ code: 'STT_UNAVAILABLE', message: 'OpenAI requires STT_API_KEY', retryable: true });

    const model = process.env.STT_MODEL ?? 'gpt-transcribe';
    const startedAt = Date.now();
    this.logger.log(JSON.stringify({
      event: 'stt.openai.request.started',
      provider: this.name,
      model,
      audioBytes: audio.length,
      mimeType: options.mimeType,
      durationMs: options.durationMs
    }));
    const client = new OpenAI({ apiKey, timeout: Number(process.env.STT_TIMEOUT_MS ?? 20_000) });
    try {
      const file = await toFile(audio, options.filename, { type: options.mimeType });
      const response = await client.audio.transcriptions.create({ file, model });
      const languageResponse = response as { languages?: Array<{ code?: string }> };
      const language = languageResponse.languages?.[0]?.code ?? 'unknown';
      this.logger.log(JSON.stringify({
        event: 'stt.openai.request.completed',
        provider: this.name,
        model,
        sttLatencyMs: Date.now() - startedAt,
        transcriptCharacterCount: response.text.trim().length
      }));
      return { text: response.text, language, provider: this.name };
    } catch (error) {
      const providerError = error as { status?: unknown; code?: unknown; type?: unknown };
      this.logger.error(JSON.stringify({
        event: 'stt.openai.request.failed',
        provider: this.name,
        model,
        sttLatencyMs: Date.now() - startedAt,
        errorName: error instanceof Error ? error.name : 'UnknownError',
        errorMessage: error instanceof Error ? error.message : 'OpenAI transcription request failed',
        ...(typeof providerError.status === 'number' ? { providerStatus: providerError.status } : {}),
        ...(typeof providerError.code === 'string' ? { providerCode: providerError.code } : {}),
        ...(typeof providerError.type === 'string' ? { providerType: providerError.type } : {})
      }));
      throw error;
    }
  }
}
