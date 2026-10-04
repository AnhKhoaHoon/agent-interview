import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '../persistence/database.service';
import { PublicEndpoint } from '../security/public-endpoint.decorator';
import { RateLimitService } from '../security/rate-limit.service';

@ApiTags('health')
@Controller('health')
@PublicEndpoint()
export class HealthController {
  constructor(private readonly database: DatabaseService, private readonly rateLimit: RateLimitService) {}

  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready(): Promise<{ status: 'ok'; checks: { application: 'ok'; database: 'ok'; rateLimit: 'ok' | 'disabled' } }> {
    try {
      await this.database.ping();
      const rateLimit = await this.rateLimit.ping();
      return { status: 'ok', checks: { application: 'ok', database: 'ok', rateLimit } };
    } catch {
      throw new ServiceUnavailableException({
        code: 'DEPENDENCY_UNAVAILABLE',
        message: 'Database readiness check failed',
        retryable: true,
        checks: { application: 'ok', database: 'unavailable' }
      });
    }
  }
}
