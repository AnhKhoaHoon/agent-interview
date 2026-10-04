import { Controller, Get, Req, Res, UnauthorizedException } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Request, Response } from 'express';
import { PublicEndpoint } from '../security/public-endpoint.decorator';
import { MetricsService } from './metrics.service';

@Controller('metrics')
@PublicEndpoint()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  async get(@Req() request: Request, @Res() response: Response): Promise<void> {
    const expected = process.env.METRICS_BEARER_TOKEN;
    const supplied = request.header('authorization')?.match(/^Bearer (.+)$/)?.[1];
    if (process.env.METRICS_ENABLED !== 'true' || !expected || !supplied || !this.matches(supplied, expected)) {
      throw new UnauthorizedException({ code: 'METRICS_UNAUTHORIZED', message: 'Valid metrics credential required', retryable: false });
    }
    response.type(this.metrics.contentType()).send(await this.metrics.render());
  }

  private matches(left: string, right: string): boolean {
    const leftHash = createHash('sha256').update(left).digest();
    const rightHash = createHash('sha256').update(right).digest();
    return timingSafeEqual(leftHash, rightHash);
  }
}
