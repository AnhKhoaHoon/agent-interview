import { Module } from '@nestjs/common';
import { InterviewModule } from '../interview/interview.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { TranscriptionController } from './transcription.controller';
import { SttProviderFactory } from './providers/stt-provider.factory';
import { OpenAiSttProvider } from './providers/openai-stt.provider';
import { TranscriptionService } from './transcription.service';

@Module({
  imports: [InterviewModule, PersistenceModule],
  controllers: [TranscriptionController],
  providers: [OpenAiSttProvider, SttProviderFactory, TranscriptionService]
})
export class TranscriptionModule {}
