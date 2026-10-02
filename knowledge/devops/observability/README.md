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

## Common pitfalls

- More dashboards do not equal observability without defined questions and
  ownership.
- A CPU alert alone does not establish impact; correlate it with saturation,
  latency, errors, and workload behavior.
- Logging secrets, tokens, full audio, or unnecessary personal data is a
  security incident waiting to happen.
