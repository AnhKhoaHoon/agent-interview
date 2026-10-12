import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingProviderFactory } from './embedding-provider.factory';
import { KnowledgeRepository, RetrievedKnowledgeChunk } from './knowledge.repository';
import { InterviewRole } from '../roles/interview-role';

export interface KnowledgeContext { chunks: RetrievedKnowledgeChunk[]; }

const RELATED_KNOWLEDGE_CATEGORIES: Record<InterviewRole, Record<string, string[]>> = {
  devops: {
    'docker-compose': ['docker'],
    iac: ['terraform', 'ansible', 'aws', 'azure'],
    azure: ['kubernetes', 'networking', 'observability', 'security', 'iac', 'cicd'],
    gcp: ['kubernetes', 'networking', 'observability', 'security', 'iac', 'cicd', 'microservices', 'devsecops'],
    microservices: ['networking', 'observability', 'security', 'cicd', 'kubernetes'],
    devsecops: ['security', 'cicd', 'git', 'docker', 'iac', 'kubernetes', 'gcp', 'aws', 'azure'],
    jenkins: ['cicd'], 'gitlab-ci': ['cicd'], argocd: ['cicd'], prometheus: ['observability'],
    grafana: ['observability'], logging: ['observability'], observability: ['microservices', 'gcp'],
    security: ['devsecops'], cicd: ['devsecops'],
    'system-design': ['aws', 'azure', 'gcp', 'kubernetes', 'microservices', 'networking', 'observability'],
    troubleshooting: ['linux', 'networking', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'cicd', 'observability', 'microservices', 'devsecops', 'security']
  },
  dba: {
    'db2-luw': ['backup-recovery', 'replication-ha', 'performance', 'database-security', 'troubleshooting'],
    postgresql: ['backup-recovery', 'replication-ha', 'performance', 'database-security'],
    mysql: ['backup-recovery', 'replication-ha', 'performance', 'database-security'],
    'sql-server': ['backup-recovery', 'replication-ha', 'performance', 'database-security'],
    oracle: ['backup-recovery', 'replication-ha', 'performance', 'database-security'],
    'backup-recovery': ['db2-luw', 'postgresql', 'mysql', 'sql-server', 'oracle', 'replication-ha'],
    'replication-ha': ['db2-luw', 'postgresql', 'mysql', 'sql-server', 'oracle', 'backup-recovery'],
    performance: ['db2-luw', 'postgresql', 'mysql', 'sql-server', 'oracle', 'troubleshooting'],
    'database-security': ['db2-luw', 'postgresql', 'mysql', 'sql-server', 'oracle'],
    troubleshooting: ['db2-luw', 'postgresql', 'mysql', 'sql-server', 'oracle', 'performance', 'replication-ha', 'backup-recovery']
  }
};

const KEYWORD_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'between', 'by', 'can', 'do', 'does', 'for', 'from', 'how', 'i', 'in', 'is', 'it', 'me', 'of', 'on', 'or', 'the', 'to', 'what', 'when', 'where', 'why', 'with', 'would', 'you',
  'các', 'cái', 'cần', 'cho', 'có', 'của', 'để', 'được', 'gì', 'giữa', 'hãy', 'khác', 'là', 'làm', 'một', 'nào', 'như', 'sao', 'sự', 'thế', 'tôi', 'trong', 'và', 'về', 'với'
]);

interface RankedCandidate extends RetrievedKnowledgeChunk {
  semanticScore?: number;
  keywordScore?: number;
}

@Injectable()
export class KnowledgeRetrievalService {
  private readonly logger = new Logger(KnowledgeRetrievalService.name);
  constructor(private readonly embeddings: EmbeddingProviderFactory, private readonly repository: KnowledgeRepository) {}

  async retrieve(question: string, role: InterviewRole, category: string): Promise<KnowledgeContext | undefined> {
    if (process.env.RAG_ENABLED === 'false') return undefined;
    try {
      const [embedding] = await this.embeddings.getConfiguredProvider().embed([question]);
      if (!embedding) return undefined;
      const acceptedCategories = [...new Set([category, ...(RELATED_KNOWLEDGE_CATEGORIES[role][category] ?? [])])];
      const maxChunks = Number(process.env.RAG_MAX_CHUNKS ?? 4);
      const candidateLimit = Math.max(maxChunks * 3, maxChunks);
      const terms = retrievalTerms(question);
      const [semanticCandidates, keywordCandidates] = await Promise.all([
        this.repository.semanticSearch(role, embedding, acceptedCategories, candidateLimit),
        this.repository.keywordSearch(role, terms, acceptedCategories, candidateLimit)
      ]);
      const minimum = Number(process.env.RAG_MIN_SIMILARITY ?? 0.72);
      const minimumKeywordCoverage = Number(process.env.RAG_MIN_KEYWORD_COVERAGE ?? 0.35);
      const candidates = new Map<string, RankedCandidate>();
      const key = (chunk: RetrievedKnowledgeChunk): string => `${chunk.sourcePath}:${chunk.text}`;

      for (const chunk of semanticCandidates) {
        if (!acceptedCategories.includes(chunk.category)) continue;
        candidates.set(key(chunk), { ...chunk, semanticScore: chunk.score });
      }
      for (const chunk of keywordCandidates) {
        if (!acceptedCategories.includes(chunk.category)) continue;
        const existing = candidates.get(key(chunk));
        candidates.set(key(chunk), { ...(existing ?? chunk), keywordScore: chunk.keywordScore });
      }

      const chunks = [...candidates.values()]
        .filter((chunk) => (chunk.semanticScore ?? 0) >= minimum || (chunk.keywordScore ?? 0) >= minimumKeywordCoverage)
        .map((chunk) => ({
          ...chunk,
          score: hybridScore(chunk.semanticScore, chunk.keywordScore)
        }))
        .sort((left, right) => right.score - left.score)
        .slice(0, maxChunks)
        .map(({ sourcePath, category: chunkCategory, text, score }) => ({ sourcePath, category: chunkCategory, text, score }));

      if (!chunks.length) {
        this.logger.log(JSON.stringify({
          event: 'rag.fallback', role, category, acceptedCategories, semanticCandidateCount: semanticCandidates.length,
          keywordCandidateCount: keywordCandidates.length, reason: 'below_threshold_or_topic_mismatch'
        }));
        return undefined;
      }
      this.logger.log(JSON.stringify({
        event: 'rag.retrieved', role, category, retrieval: 'hybrid', chunkCount: chunks.length, topScore: chunks[0]?.score,
        semanticCandidateCount: semanticCandidates.length, keywordCandidateCount: keywordCandidates.length
      }));
      return { chunks };
    } catch (error) {
      this.logger.warn(JSON.stringify({ event: 'rag.fallback', role, category, reason: 'unavailable', error: error instanceof Error ? error.message : 'unknown' }));
      return undefined;
    }
  }
}

function hybridScore(semanticScore?: number, keywordScore?: number): number {
  if (semanticScore !== undefined && keywordScore !== undefined) return semanticScore * 0.72 + keywordScore * 0.28;
  if (semanticScore !== undefined) return semanticScore;
  return keywordScore ?? 0;
}

export function retrievalTerms(question: string): string[] {
  const tokens = question.toLocaleLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}+.#/-]*/gu) ?? [];
  const useful = tokens.filter((token) => token.length >= 3 && !KEYWORD_STOP_WORDS.has(token)).slice(0, 10);
  const terms = new Set(useful);
  for (let index = 0; index < useful.length - 1; index += 1) terms.add(`${useful[index]} ${useful[index + 1]}`);
  return [...terms].slice(0, 16);
}
