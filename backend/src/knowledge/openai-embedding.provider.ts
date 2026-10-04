import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';
import { EmbeddingProvider } from './embedding-provider';

export const EMBEDDING_DIMENSIONS = 1536;

@Injectable()
export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'openai';

  async embed(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];
    const apiKey = process.env.EMBEDDING_API_KEY ?? process.env.LLM_API_KEY;
    if (!apiKey) throw new ServiceUnavailableException({ code: 'RAG_UNAVAILABLE', message: 'Embedding provider requires EMBEDDING_API_KEY or LLM_API_KEY', retryable: true });
    const client = new OpenAI({ apiKey, timeout: Number(process.env.EMBEDDING_TIMEOUT_MS ?? 10_000), maxRetries: Number(process.env.EMBEDDING_MAX_RETRIES ?? 2) });
    const response = await client.embeddings.create({ input: texts, model: process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small', dimensions: EMBEDDING_DIMENSIONS });
    return response.data.sort((left, right) => left.index - right.index).map((item) => item.embedding);
  }
}
