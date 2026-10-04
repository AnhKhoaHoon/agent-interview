import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { LlmProvider } from '../contracts';
import { OpenAiLlmProvider } from './openai-llm.provider';

@Injectable()
export class LlmProviderFactory {
  constructor(private readonly openAiProvider: OpenAiLlmProvider) {}

  getConfiguredProvider(): LlmProvider {
    const provider = process.env.LLM_PROVIDER ?? 'openai';
    if (provider === 'openai') return this.openAiProvider;
    throw new ServiceUnavailableException(`Unsupported LLM_PROVIDER: ${provider}`);
  }
}
