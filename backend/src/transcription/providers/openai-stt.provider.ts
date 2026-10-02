import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import OpenAI, { toFile } from 'openai';
import { SttProvider, TranscriptionOptions, TranscriptionResult } from '../stt-provider';

@Injectable()
export class OpenAiSttProvider implements SttProvider {
  readonly name = 'openai';

  async transcribe(audio: Buffer, options: TranscriptionOptions): Promise<TranscriptionResult> {
    const apiKey = process.env.STT_API_KEY;
    if (!apiKey) throw new ServiceUnavailableException({ code: 'STT_UNAVAILABLE', message: 'OpenAI requires STT_API_KEY', retryable: true });

    const client = new OpenAI({ apiKey, timeout: Number(process.env.STT_TIMEOUT_MS ?? 20_000) });
    const file = await toFile(audio, options.filename, { type: options.mimeType });
    const response = await client.audio.transcriptions.create({
      file,
      model: process.env.STT_MODEL ?? 'gpt-transcribe'
    });
    const languageResponse = response as { languages?: Array<{ code?: string }> };
    const language = languageResponse.languages?.[0]?.code ?? 'unknown';
    return { text: response.text, language, provider: this.name };
  }
}
