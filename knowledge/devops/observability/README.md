# Observability

## Core concepts

- Metrics show aggregated numerical behavior, logs retain event detail, and
  traces follow one request across components. They complement rather than
  replace one another.
- Useful service signals include latency, traffic, errors, and saturation.
  Alerts should represent user impact or imminent risk, not every raw resource
  fluctuation.
- An SLI is a measured indicator; an SLO is its target; an error budget is the
  allowed unreliability that guides release and reliability decisions.

## Investigation order

1. Define scope: affected users, region, endpoint, and start time.
2. Check error rate, latency percentiles, traffic, and saturation against a
   baseline and deployment/change timeline.
3. Use a trace/correlation ID to join gateway, service, dependency, and log
   evidence.
4. Identify the bottleneck or dependency, mitigate safely, then verify SLI
   recovery and watch for recurrence.

## Interview answer points

- Prefer histogram/summary-style latency analysis with relevant percentiles;
  averages can hide tail latency that users experience.
- Alert on sustained symptoms with actionable runbook context. Use dashboards
  for exploration and alerts for urgent human action.
- Add high-cardinality labels carefully; values such as user ID or request ID
  can overload a metrics backend and belong in logs/traces instead.

## Practical interview scenarios

### p95 latency rises immediately after a deployment

- **Scope:** split the SLI by endpoint, version, zone, and dependency without
  creating unbounded metric labels. Correlate the exact deployment annotation.
- **Inspect:** use request rate/errors/duration, saturation, a representative
  slow trace, and correlated logs to locate whether time is spent in queueing,
  compute, database, network, or a downstream call.
- **Act:** halt/roll back the rollout when the new version is causal and impact
  exceeds the agreed threshold. Preserve evidence, then fix the bottleneck.
- **Verify:** p50/p95/p99, error rate, throughput, and saturation return to the
  expected baseline for both synthetic and real traffic.

### The on-call team receives too many non-actionable alerts

- **Inspect:** classify alerts by user impact, action taken, duplicates, duration,
  ownership, and false-positive cause.
- **Act:** alert on sustained symptoms or imminent exhaustion, add a clear owner
  and runbook, group related notifications, inhibit dependents behind a known
  parent failure, and move informational signals to dashboards.
- **Verify:** measure pages per on-call shift, acknowledgement/action rate,
  detection time for real incidents, and missed incidents. Do not simply silence
  noisy alerts without retaining coverage.

### Metrics storage grows rapidly after adding labels

- **Inspect:** identify the metric and label values creating new time series,
  especially request/user/session IDs, raw URLs, or unbounded error strings.
- **Act:** remove/drop the label at instrumentation or ingestion, normalize
  routes, aggregate where useful, and keep per-request identity in logs/traces.
- **Verify:** confirm active-series and ingestion-rate reduction without losing
  the aggregate SLI or diagnostic correlation needed by responders.

### A distributed request fails but no service owns the error

- **Inspect:** propagate trace context across service boundaries and use the
  trace ID to connect spans with structured logs. Find the first failing span,
  not just the final gateway error.
- **Act:** fix missing context propagation/instrumentation and define ownership
  for the failing dependency. Avoid logging full sensitive payloads merely to
  make correlation easier.
- **Verify:** a synthetic request produces a connected trace with service/error
  attributes and can be followed to the responsible log/event.

## Senior production lens

- Begin with service-level objectives and error budgets, not dashboards. Define
  the user journey, SLI numerator/denominator, data-quality assumptions,
  ownership, and the action an alert should cause.
- Instrument deployment version, tenant or route only when cardinality and
  privacy allow it. Bound labels, sampling, retention, and query cost so the
  observability system remains usable during a high-cardinality or incident
  surge.
- Correlate a production event through change/deployment timeline, golden
  signals, traces, dependency health, and logs. A single graph or host metric
  is evidence, not root cause.
- Test alerts, dashboards, runbooks, and paging ownership. Recovery means the
  original SLI is sustained through a defined observation window, not merely
  that an alert is acknowledged or a process restarted.

## Concise interview delivery

“I define the user-facing SLI first, compare it with deployment and dependency
timelines, then move from metrics to a representative trace and correlated
logs. Alerts must demand an action; recovery is confirmed by SLO signals, not
by one host metric returning to normal.”

## Common pitfalls

- More dashboards do not equal observability without defined questions and
  ownership.
- A CPU alert alone does not establish impact; correlate it with saturation,
  latency, errors, and workload behavior.
- Logging secrets, tokens, full audio, or unnecessary personal data is a
  security incident waiting to happen.

## Official references

- [OpenTelemetry signals](https://opentelemetry.io/docs/concepts/signals/)
- [OpenTelemetry context propagation](https://opentelemetry.io/docs/concepts/context-propagation/)
- [Prometheus instrumentation practices](https://prometheus.io/docs/practices/instrumentation/)
- [Prometheus alerting practices](https://prometheus.io/docs/practices/alerting/)
