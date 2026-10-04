import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { CandidateContextModule } from '../candidate-context/candidate-context.module';

@Module({ imports: [AiModule, CandidateContextModule, KnowledgeModule, PersistenceModule], controllers: [InterviewController], providers: [InterviewService], exports: [InterviewService] })
export class InterviewModule {}
