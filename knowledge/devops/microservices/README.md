# Microservices

## Core concepts

- Microservices are independently deployable services organized around bounded
  business capabilities. They are not simply a monolith split by technical
  layers or a requirement to create many repositories.
- A service should own its data and contract where independent change,
  deployment, scaling, and reliability decisions justify the distributed-system
  cost. A shared database can create hidden coupling even if the application
  code is separated.
- Distributed calls introduce partial failure, latency, retry amplification,
  version compatibility, asynchronous delivery, and observability challenges.
  Network success is not business success.
- Synchronous calls fit request/response needs with bounded latency. Events and
  queues decouple work, but require idempotency, ordering assumptions,
  backpressure, replay handling, and eventual-consistency design.

## Senior design decisions

| Decision | Senior consideration | Evidence |
| --- | --- | --- |
| Service boundary | Split around ownership and change cadence, not fashionable technology. Keep a modular monolith when the domain and team do not justify distributed overhead. | Teams can change a capability without coordinated schema/release changes across unrelated services. |
| API contract | Version or evolve contracts compatibly, define timeouts/error semantics, and publish ownership/deprecation policy. | Contract tests and consumer telemetry show compatible rollout and safe removal. |
| Data consistency | Define the invariant, source of truth, compensation, idempotency key, and reconciliation process before selecting a saga or event flow. | Duplicate, delayed, reordered, and failed deliveries preserve the required business invariant. |
| Resilience | Use bounded timeouts, retry budget, circuit breaking/backpressure, bulkheads, and graceful degradation according to user impact. | Dependency failure tests do not exhaust threads, connections, queues, or the error budget of unrelated requests. |
| Operations | Propagate trace context, correlate version and dependency calls, and define SLO ownership at the user journey and service boundary. | An on-call engineer can identify the first failing dependency and the owning team from one representative request. |

## Production patterns

### Safe synchronous dependency call

Use a deadline derived from the caller's remaining request budget, a bounded
retry policy only for known transient/idempotent operations, and a circuit or
load-shed decision when the dependency is unhealthy. Do not retry every
non-success response or set a timeout longer than the caller can tolerate.
Measure dependency latency/error/saturation separately from the caller's SLI.

### Event-driven workflow and the outbox pattern

When a service changes local state and must publish an event, avoid pretending
that database write plus message publish is a distributed transaction by
default. Persist an outbound event with the local change, publish it
asynchronously, make consumers idempotent, and provide replay/reconciliation.
The exact implementation depends on database and broker capabilities; the
senior answer is the invariant, delivery semantics, and recovery plan, not a
claim of exactly-once delivery.

### Trace context propagation

Propagate trace context at HTTP, gRPC, and message boundaries so a root request
can be followed through gateway, services, queues, and dependencies. Keep
privacy-sensitive business data out of trace baggage and define sampling that
retains useful failure evidence without unbounded cost.

## Practical interview scenarios

### A checkout service times out because an inventory dependency is slow

- **Inspect:** compare checkout latency/error SLI with inventory latency,
  timeout/retry rate, connection-pool/thread saturation, queue depth, and a
  trace from a failing request. Determine whether the release, load, or
  dependency is causal.
- **Act:** protect checkout with a bounded timeout and appropriate degradation
  or admission control, pause a harmful rollout, and fix the dependency or
  caller behavior. Do not increase all timeouts and retries; that can broaden
  queueing and failure.
- **Verify:** test representative load and dependency slowness; confirm error
  budget burn, saturation, and recovery of both services.

### Duplicate events create duplicate customer actions

- **Inspect:** identify the producer event ID, consumer idempotency key,
  delivery/retry history, side-effect record, and the business invariant.
- **Act:** make the consumer side effect idempotent, reconcile affected records,
  and correct producer/outbox/retry behavior. Do not silently discard messages
  without proving they are duplicates.
- **Verify:** replay a controlled duplicate and out-of-order fixture, confirm
  one intended business result, and monitor duplicate/reconciliation metrics.

### A shared database blocks independent deployments

- **Inspect:** map table ownership, cross-service queries, migration coupling,
  release order, and operational access paths. Determine whether the boundary
  is genuinely separate or an artificial split.
- **Act:** establish a source-of-truth owner and migrate consumers through a
  compatible API/event/read model in stages. Use expand/contract schema changes
  and a rollback plan; do not copy data indefinitely without reconciliation.
- **Verify:** remove one dependency at a time, test independent deployment and
  restore behavior, then measure latency, data freshness, and ownership
  incidents.

## Candidate-ready answer

“I use microservices only when independent ownership and delivery outweigh the
distributed-system cost. I define service and data boundaries, compatible
contracts, timeout and retry budgets, and an explicit consistency model. In
production I rely on trace context and SLOs to locate failures across services,
then use progressive delivery and reversible migrations. I verify resilience
with dependency-failure, duplicate-event, and rollback exercises rather than
assuming that service separation creates reliability.”

## Common pitfalls

- Splitting a monolith without clear ownership, operational maturity, or a
  reason to accept distributed failure modes.
- Claiming exactly-once delivery without explaining end-to-end side effects and
  idempotency.
- Retries without a budget, idempotency, timeout, or backpressure strategy.
- Putting user IDs, tokens, or full payloads in metrics/traces to compensate
  for missing correlation design.

## Official references

- [OpenTelemetry observability primer](https://opentelemetry.io/docs/concepts/observability-primer/)
- [OpenTelemetry context](https://opentelemetry.io/docs/specs/otel/context/)
- [OpenTelemetry propagators](https://opentelemetry.io/docs/specs/otel/context/api-propagators/)
- [Google Cloud reliability and observability guidance](https://cloud.google.com/architecture/framework/reliability/slo-and-alerts)
