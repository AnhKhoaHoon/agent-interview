import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RateLimitService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RateLimitService.name);
  private client?: RedisClientType;

  enabled(): boolean {
    return process.env.RATE_LIMIT_ENABLED === 'true';
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled()) return;
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL is required when RATE_LIMIT_ENABLED=true');
    this.client = createClient({ url });
    this.client.on('error', (error: Error) => this.logger.error(JSON.stringify({
      event: 'rate_limit.redis_error', errorName: error.name, errorMessage: error.message
    })));
    await this.client.connect();
  }

  async consume(key: string, windowMs: number): Promise<{ count: number; retryAfterMs: number }> {
    if (!this.client) return { count: 0, retryAfterMs: 0 };
    const result = await this.client.eval(
      `local count = redis.call('INCR', KEYS[1])
       if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
       return {count, redis.call('PTTL', KEYS[1])}`,
      { keys: [key], arguments: [String(windowMs)] }
    ) as [number, number];
    return { count: Number(result[0]), retryAfterMs: Math.max(0, Number(result[1])) };
  }

  async ping(): Promise<'ok' | 'disabled'> {
    if (!this.client) return 'disabled';
    await this.client.ping();
    return 'ok';
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client?.isOpen) await this.client.quit();
  }
}
