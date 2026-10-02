import { Global, Module } from '@nestjs/common';
import { InterviewStreamService } from './interview-stream.service';

@Global()
@Module({ providers: [InterviewStreamService], exports: [InterviewStreamService] })
export class StreamModule {}
