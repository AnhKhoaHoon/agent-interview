import { randomUUID } from 'node:crypto';
import { RateLimitService } from './rate-limit.service';

const describeRedis = process.env.RUN_REDIS_TESTS === 'true' ? describe : describe.skip;

describeRedis('RateLimitService integration', () => {
  let service: RateLimitService;

  beforeAll(async () => {
    service = new RateLimitService();
    await service.onModuleInit();
  });

  afterAll(async () => {
    await service.onModuleDestroy();
  });

  it('atomically counts requests inside an expiring Redis window', async () => {
    const key = `agent-interview:test:${randomUUID()}`;
    await expect(service.consume(key, 5_000)).resolves.toEqual(expect.objectContaining({ count: 1 }));
    const second = await service.consume(key, 5_000);
    expect(second.count).toBe(2);
    expect(second.retryAfterMs).toBeGreaterThan(0);
  });
});
