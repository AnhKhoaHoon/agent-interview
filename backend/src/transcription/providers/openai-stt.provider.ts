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
    const language = configuredSttLanguage(options.language ?? process.env.STT_LANGUAGE);
    const startedAt = Date.now();
    this.logger.log(JSON.stringify({
      event: 'stt.openai.request.started',
      provider: this.name,
      model,
      audioBytes: audio.length,
      mimeType: options.mimeType,
      durationMs: options.durationMs,
      ...(language ? { language } : {})
    }));
    const client = new OpenAI({
      apiKey,
      timeout: Number(process.env.STT_TIMEOUT_MS ?? 20_000),
      maxRetries: Number(process.env.STT_MAX_RETRIES ?? 2)
    });
    try {
      const file = await toFile(audio, options.filename, { type: options.mimeType });
      const response = await client.audio.transcriptions.create({
        file,
        model,
        ...(language ? { language } : {}),
        ...(options.prompt ? { prompt: options.prompt } : {})
      });
      const languageResponse = response as { languages?: Array<{ code?: string }> };
      const detectedLanguage = languageResponse.languages?.[0]?.code ?? language ?? 'unknown';
      this.logger.log(JSON.stringify({
        event: 'stt.openai.request.completed',
        provider: this.name,
        model,
        sttLatencyMs: Date.now() - startedAt,
        transcriptCharacterCount: response.text.trim().length
      }));
      return { text: response.text, language: detectedLanguage, provider: this.name };
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

export function configuredSttLanguage(value = process.env.STT_LANGUAGE ?? 'vi'): 'vi' | 'en' {
  const language = value.trim().toLowerCase();
  if (language !== 'vi' && language !== 'en') {
    throw new ServiceUnavailableException({
      code: 'STT_UNAVAILABLE',
      message: 'STT_LANGUAGE must be vi or en',
      retryable: false
    });
  }
  return language;
}
