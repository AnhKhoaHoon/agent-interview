import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { EmbeddingProviderFactory } from './embedding-provider.factory';
import { KnowledgeIndexerService } from './knowledge-indexer.service';
import { KnowledgeRepository } from './knowledge.repository';
import { KnowledgeRetrievalService } from './knowledge-retrieval.service';
import { OpenAiEmbeddingProvider } from './openai-embedding.provider';

@Module({ imports: [PersistenceModule], providers: [OpenAiEmbeddingProvider, EmbeddingProviderFactory, KnowledgeRepository, KnowledgeIndexerService, KnowledgeRetrievalService], exports: [KnowledgeIndexerService, KnowledgeRetrievalService] })
export class KnowledgeModule {}
