import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Request, Response } from 'express';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly limiter: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.limiter.enabled()) return true;
    const request = context.switchToHttp().getRequest<Request>();
    if (request.path.endsWith('/health/live') || request.path.endsWith('/health/ready')) return true;
    const response = context.switchToHttp().getResponse<Response>();
    const { limit, windowMs } = this.policy(request);
    const credential = request.header('authorization') ?? request.ip ?? 'unknown';
    const identity = createHash('sha256').update(credential).digest('hex');
    try {
      const result = await this.limiter.consume(`agent-interview:rate:${identity}:${request.method}:${request.route?.path ?? request.path}`, windowMs);
      response.setHeader('RateLimit-Limit', String(limit));
      response.setHeader('RateLimit-Remaining', String(Math.max(0, limit - result.count)));
      if (result.count <= limit) return true;
      response.setHeader('Retry-After', String(Math.max(1, Math.ceil(result.retryAfterMs / 1_000))));
      throw new HttpException(
        { code: 'RATE_LIMITED', message: 'Request rate limit exceeded', retryable: true },
        HttpStatus.TOO_MANY_REQUESTS
      );
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) throw error;
      throw new ServiceUnavailableException({ code: 'RATE_LIMIT_UNAVAILABLE', message: 'Request protection is temporarily unavailable', retryable: true });
    }
  }

  private policy(request: Request): { limit: number; windowMs: number } {
    const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
    if (request.method === 'POST' && request.path.endsWith('/interviews')) {
      return { limit: Number(process.env.RATE_LIMIT_CREATE_MAX ?? 10), windowMs };
    }
    if (request.method === 'POST' && request.path.endsWith('/transcriptions')) {
      return { limit: Number(process.env.RATE_LIMIT_TRANSCRIPTION_MAX ?? 20), windowMs };
    }
    return { limit: Number(process.env.RATE_LIMIT_DEFAULT_MAX ?? 120), windowMs };
  }
}
