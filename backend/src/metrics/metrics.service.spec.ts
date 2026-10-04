import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('exports bounded route-template labels and request latency', async () => {
    const metrics = new MetricsService();
    metrics.observeHttp('GET', '/api/v1/interviews/:id', 200, 0.125);
    const output = await metrics.render();

    expect(output).toContain('agent_interview_http_requests_total');
    expect(output).toContain('route="/api/v1/interviews/:id"');
    expect(output).toContain('agent_interview_http_request_duration_seconds');
  });
});
