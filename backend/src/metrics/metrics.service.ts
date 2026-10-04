import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry, collectDefaultMetrics } from '@prometheus-io/client';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  private readonly httpRequests = new Counter({
    name: 'agent_interview_http_requests_total',
    help: 'Completed HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [this.registry]
  });
  private readonly httpDuration = new Histogram({
    name: 'agent_interview_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 15, 30],
    registers: [this.registry]
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry, prefix: 'agent_interview_' });
  }

  observeHttp(method: string, route: string, status: number, durationSeconds: number): void {
    const labels = { method, route, status: String(status) };
    this.httpRequests.inc(labels);
    this.httpDuration.observe(labels, durationSeconds);
  }

  contentType(): string {
    return this.registry.contentType;
  }

  render(): Promise<string> {
    return this.registry.metrics();
  }
}
