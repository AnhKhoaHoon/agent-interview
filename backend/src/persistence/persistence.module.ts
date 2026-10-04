import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { InterviewRepository } from './interview.repository';
import { PostgresInterviewRepository } from './postgres-interview.repository';

@Module({
  providers: [
    DatabaseService,
    PostgresInterviewRepository,
    { provide: InterviewRepository, useExisting: PostgresInterviewRepository }
  ],
  exports: [DatabaseService, InterviewRepository]
})
export class PersistenceModule {}
