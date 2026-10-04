import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingProviderFactory } from './embedding-provider.factory';
import { KnowledgeRepository, RetrievedKnowledgeChunk } from './knowledge.repository';

export interface KnowledgeContext { chunks: RetrievedKnowledgeChunk[]; }

const RELATED_KNOWLEDGE_CATEGORIES: Record<string, string[]> = {
  'docker-compose': ['docker'],
  iac: ['terraform', 'ansible', 'aws'],
  jenkins: ['cicd'],
  'gitlab-ci': ['cicd'],
  argocd: ['cicd'],
  prometheus: ['observability'],
  grafana: ['observability'],
  logging: ['observability'],
  'system-design': ['aws', 'kubernetes', 'networking', 'observability'],
  troubleshooting: ['linux', 'networking', 'docker', 'kubernetes', 'aws', 'terraform', 'cicd', 'observability', 'security']
};

@Injectable()
export class KnowledgeRetrievalService {
  private readonly logger = new Logger(KnowledgeRetrievalService.name);
  constructor(private readonly embeddings: EmbeddingProviderFactory, private readonly repository: KnowledgeRepository) {}

  async retrieve(question: string, category: string): Promise<KnowledgeContext | undefined> {
    if (process.env.RAG_ENABLED === 'false') return undefined;
    try {
      const [embedding] = await this.embeddings.getConfiguredProvider().embed([question]);
      if (!embedding) return undefined;
      const candidates = await this.repository.search(embedding, Number(process.env.RAG_MAX_CHUNKS ?? 4));
      const minimum = Number(process.env.RAG_MIN_SIMILARITY ?? 0.72);
      const chunks = candidates.filter((chunk) => chunk.score >= minimum);
      const acceptedCategories = new Set([category, ...(RELATED_KNOWLEDGE_CATEGORIES[category] ?? [])]);
      const topicMatch = chunks.some((chunk) => acceptedCategories.has(chunk.category));
      if (!chunks.length || !topicMatch) {
        this.logger.log(JSON.stringify({ event: 'rag.fallback', category, candidateCount: candidates.length, reason: !chunks.length ? 'below_threshold' : 'topic_mismatch' }));
        return undefined;
      }
      this.logger.log(JSON.stringify({ event: 'rag.retrieved', category, chunkCount: chunks.length, topScore: chunks[0]?.score }));
      return { chunks };
    } catch (error) {
      this.logger.warn(JSON.stringify({ event: 'rag.fallback', category, reason: 'unavailable', error: error instanceof Error ? error.message : 'unknown' }));
      return undefined;
    }
  }
}
