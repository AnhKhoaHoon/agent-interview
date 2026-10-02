import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { LlmProvider } from '../contracts';
import { MockLlmProvider } from './mock-llm.provider';
import { OpenAiLlmProvider } from './openai-llm.provider';

@Injectable()
export class LlmProviderFactory {
  constructor(
    private readonly mockProvider: MockLlmProvider,
    private readonly openAiProvider: OpenAiLlmProvider
  ) {}

  getConfiguredProvider(): LlmProvider {
    const provider = process.env.LLM_PROVIDER ?? 'mock';
    if (provider === 'mock') return this.mockProvider;
    if (provider === 'openai') return this.openAiProvider;
    throw new ServiceUnavailableException(`Unsupported LLM_PROVIDER: ${provider}`);
  }
}
