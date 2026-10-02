import { Module } from '@nestjs/common';
import { InterviewModule } from '../interview/interview.module';
import { TranscriptionController } from './transcription.controller';
import { SttProviderFactory } from './providers/stt-provider.factory';
import { MockSttProvider } from './providers/mock-stt.provider';
import { OpenAiSttProvider } from './providers/openai-stt.provider';
import { TranscriptionService } from './transcription.service';

@Module({
  imports: [InterviewModule],
  controllers: [TranscriptionController],
  providers: [MockSttProvider, OpenAiSttProvider, SttProviderFactory, TranscriptionService]
})
export class TranscriptionModule {}
