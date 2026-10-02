import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { HealthModule } from './health/health.module';
import { InterviewModule } from './interview/interview.module';
import { StreamModule } from './stream/stream.module';
import { TranscriptionModule } from './transcription/transcription.module';

@Module({ imports: [AiModule, HealthModule, InterviewModule, StreamModule, TranscriptionModule] })
export class AppModule {}
