import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PersistenceModule } from '../persistence/persistence.module';
import { InterviewAccessGuard } from './interview-access.guard';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from './rate-limit.service';

@Module({
  imports: [PersistenceModule],
  providers: [
    RateLimitService,
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: InterviewAccessGuard }
  ],
  exports: [RateLimitService]
})
export class SecurityModule {}
