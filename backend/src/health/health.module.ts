import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PersistenceModule } from '../persistence/persistence.module';
import { SecurityModule } from '../security/security.module';

@Module({ imports: [PersistenceModule, SecurityModule], controllers: [HealthController] })
export class HealthModule {}
