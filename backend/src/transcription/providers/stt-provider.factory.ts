import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { SttProvider } from '../stt-provider';
import { MockSttProvider } from './mock-stt.provider';
import { OpenAiSttProvider } from './openai-stt.provider';

@Injectable()
export class SttProviderFactory {
  constructor(private readonly mockProvider: MockSttProvider, private readonly openAiProvider: OpenAiSttProvider) {}

  getConfiguredProvider(): SttProvider {
    const provider = process.env.STT_PROVIDER ?? 'mock';
    if (provider === 'mock') return this.mockProvider;
    if (provider === 'openai') return this.openAiProvider;
    throw new ServiceUnavailableException({ code: 'STT_UNAVAILABLE', message: `Unsupported STT_PROVIDER: ${provider}`, retryable: true });
  }
}
