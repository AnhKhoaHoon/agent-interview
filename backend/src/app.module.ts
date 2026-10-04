import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { HealthModule } from './health/health.module';
import { InterviewModule } from './interview/interview.module';
import { StreamModule } from './stream/stream.module';
import { TranscriptionModule } from './transcription/transcription.module';
import { SecurityModule } from './security/security.module';
import { MetricsModule } from './metrics/metrics.module';
import { KnowledgeModule } from './knowledge/knowledge.module';

@Module({ imports: [AiModule, HealthModule, InterviewModule, KnowledgeModule, MetricsModule, SecurityModule, StreamModule, TranscriptionModule] })
export class AppModule {}
