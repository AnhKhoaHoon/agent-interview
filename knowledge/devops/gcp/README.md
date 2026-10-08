# Google Cloud Platform (GCP)

## Core concepts

- A GCP organization, folders, projects, and resources form a policy and
  billing hierarchy. A project is an isolation and billing boundary, but it is
  not by itself a complete production security or network boundary.
- IAM answers two distinct questions: who can authenticate and which
  permission is granted on which resource. Prefer workload or federated
  identities with narrow roles over downloaded service-account keys.
- A VPC is global while subnets are regional. Firewall policy, routes, Cloud
  NAT, Private Google Access, private service connectivity, and DNS must be
  considered together when tracing a network path.
- GKE runs Kubernetes workloads; Artifact Registry stores artifacts; Cloud Run
  runs request-driven containers; Cloud Build executes builds. Choose a
  platform from workload operations, scaling, networking, portability, and
  ownership requirements rather than product familiarity alone.
- Cloud Monitoring, Cloud Logging, Cloud Trace, and Error Reporting provide
  complementary evidence. Metrics and logs can support SLIs; a trace follows
  one request across service boundaries.

## Senior production design

| Concern | Production decision | Verification |
| --- | --- | --- |
| Resource hierarchy | Separate environments and sensitive workloads with an organization/folder/project model that supports least privilege, billing visibility, and policy ownership. | A non-production identity cannot change production resources; audit records identify the actor and target. |
| Workload identity | Use short-lived workload or federation credentials and grant the smallest role at the smallest practical scope. | The workload can perform its required action and a negative access test remains denied. |
| Network path | Explicitly design ingress, egress, DNS, private Google API access, service-to-service identity, and data boundaries. | Test from the affected workload and prove the intended path without a broad public/firewall exception. |
| Delivery | Build once, scan and record the immutable artifact identity, deploy with a scoped pipeline identity, and promote the same artifact between environments. | Deployment revision, artifact digest, approval/change evidence, and user-facing SLI align. |
| Reliability | Choose regional/zonal topology, replicas, quotas, capacity, and a recovery design from availability and RTO/RPO objectives. | Exercise instance/zone failure, rollout rollback, and data restore or failover according to the agreed objective. |

## GCP monitoring and observability

Start from the user journey and its SLI: successful request ratio, latency,
freshness, or another business outcome. Use Cloud Monitoring for service and
custom metrics, Cloud Logging for structured events, and Cloud Trace or
OpenTelemetry-compatible tracing for a representative request path. Alerting
must name the owner, user impact, threshold/window, dashboard, and runbook.

Avoid alerting on raw CPU alone or creating labels from user IDs, request IDs,
unbounded URLs, or error strings. Those choices create alert noise, high metric
cardinality, privacy risk, and unplanned observability cost. Record deployment
version and bounded route/service attributes only where they help isolate a
change.

### A GKE service is healthy but users see elevated latency

- **Inspect:** split the SLI by route, version, region/zone, and dependency;
  compare the deployment timeline; inspect representative traces, GKE Pod
  readiness/restarts, autoscaling, CPU/memory throttling, network errors, and
  downstream latency.
- **Act:** halt or roll back a causal release, or apply the smallest reversible
  capacity/dependency mitigation. Do not scale every node pool or extend every
  timeout before identifying the constrained layer.
- **Verify:** sustain p50/p95/p99 latency, error ratio, saturation, and request
  volume through an observation window; retain the trace/log evidence needed
  for the root-cause fix.

### Cloud Monitoring cost and cardinality rise unexpectedly

- **Inspect:** identify the metric/log source, label values, ingestion rate,
  retention, exclusions, and whether a deploy introduced a high-cardinality
  dimension or retry storm.
- **Act:** bound labels at instrumentation, normalize routes, move per-request
  identifiers to logs/traces, and apply an intentional retention/exclusion
  policy without deleting signals required for security or SLOs.
- **Verify:** compare series count, ingestion/cost trend, query latency, and
  preservation of the original aggregate SLI and incident investigation path.

## Practical interview scenarios

### A GKE workload cannot pull an image or access a Google Cloud service

- **Inspect:** separate the artifact pull path from runtime authorization.
  Confirm the exact image digest exists in Artifact Registry, the cluster/node
  image-pull path can reach it, and the workload identity has the required
  resource/action permission. A successful CI push does not prove either
  runtime path works.
- **Act:** correct the specific artifact, network dependency, or least-privilege
  IAM binding. Do not use an owner-level project role or a long-lived key as a
  diagnostic shortcut.
- **Verify:** start a new workload revision with the approved digest, test the
  intended resource action, and confirm an unrelated action remains denied.

### A regional outage exceeds the service objective

- **Inspect:** compare the promised RTO/RPO with the real application, data,
  artifact, DNS/traffic, identity, secret, and secondary-region capacity
  dependencies. Multi-zone capacity in one region is not regional recovery.
- **Act:** use the rehearsed active-passive or active-active recovery plan in
  the order required by data consistency. State the accepted data-loss boundary
  rather than assuming cross-region replication means zero loss.
- **Verify:** perform a controlled failover exercise, measure recovery and data
  freshness against RTO/RPO, then update runbooks and capacity plans from the
  evidence.

## Candidate-ready answer

“For a production GCP workload, I begin with the service objective and place
environment, identity, network, and data boundaries around it. I use scoped
short-lived identities, immutable artifact promotion, and observability built
around user-facing SLIs. For GKE or Cloud Run, I verify both platform health and
the application dependency path. I only call the design reliable after a
rollout rollback and a recovery exercise meet the agreed RTO/RPO and cost
constraints.”

## Common pitfalls

- Treating a project name as proof of least privilege or network isolation.
- Giving a workload broad project roles instead of identifying its exact action
  and target resource.
- Calling a dashboard an observability strategy without defined SLI, ownership,
  alert response, and cost/cardinality controls.
- Claiming a multi-region system has no data loss without a defined consistency
  and replication trade-off.

## Official references

- [GKE best practices](https://docs.cloud.google.com/kubernetes-engine/docs/best-practices)
- [Cloud Monitoring overview](https://docs.cloud.google.com/monitoring/docs/monitoring-overview)
- [Cloud Monitoring alerting overview](https://docs.cloud.google.com/monitoring/alerts)
- [Google Cloud reliability observability guidance](https://cloud.google.com/architecture/framework/reliability/slo-and-alerts)
- [Google Cloud software supply chain security](https://docs.cloud.google.com/software-supply-chain-security/docs/overview)
