import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { CandidateContextController } from './candidate-context.controller';
import { CandidateContextService } from './candidate-context.service';

@Module({ imports: [PersistenceModule], controllers: [CandidateContextController], providers: [CandidateContextService], exports: [CandidateContextService] })
export class CandidateContextModule {}
