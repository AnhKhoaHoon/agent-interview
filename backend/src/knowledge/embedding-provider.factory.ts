import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { OpenAiEmbeddingProvider } from './openai-embedding.provider';
import { EmbeddingProvider } from './embedding-provider';

@Injectable()
export class EmbeddingProviderFactory {
  constructor(private readonly openai: OpenAiEmbeddingProvider) {}

  getConfiguredProvider(): EmbeddingProvider {
    const provider = process.env.EMBEDDING_PROVIDER ?? 'openai';
    if (provider === 'openai') return this.openai;
    throw new ServiceUnavailableException({ code: 'RAG_UNAVAILABLE', message: `Unsupported EMBEDDING_PROVIDER: ${provider}`, retryable: false });
  }
}
