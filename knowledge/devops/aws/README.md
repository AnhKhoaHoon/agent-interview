# AWS

## Core concepts

- A VPC contains subnets, route tables, security controls, and network
  boundaries. Public/private is determined by routing and exposure, not the
  subnet name.
- IAM policies grant actions on resources. Prefer temporary roles and least
  privilege over long-lived user access keys.
- EC2 runs compute, ALB distributes HTTP(S) traffic, Auto Scaling adjusts
  capacity, S3 stores objects, RDS provides managed relational databases, and
  CloudWatch supplies metrics/logs/alarms.

## Architecture answer pattern

1. Start with availability-zone separation and private application/data tiers.
2. Put a load balancer in front of stateless compute with health checks and
   autoscaling driven by a relevant demand metric.
3. Use managed storage/database services with backups, encryption, and tested
   recovery.
4. Apply IAM roles, security groups, audit logs, monitoring, alarms, and a
   deployment/rollback path.
5. State cost and reliability trade-offs, then explain how the design is tested.

## Operational checks

- For an unreachable workload, trace Route 53/DNS, ALB listener and target
  health, security groups, NACLs, route tables, instance/service logs, and
  application readiness.
- For an RDS incident, inspect connection count, CPU, memory, storage, slow
  queries, failover events, and application pool behavior before resizing.
- For S3 access failure, check IAM policy, bucket policy, KMS permission,
  object ownership, block-public-access settings, and the request's principal.

## Practical interview scenarios

### Design a highly available web service on AWS

- **Answer:** terminate HTTPS at an ALB spanning multiple Availability Zones;
  run stateless compute across those zones in private subnets; keep session/state
  in an appropriate managed store; and use a Multi-AZ database where its
  recovery characteristics meet the requirement.
- **Controls:** autoscale on a demand/saturation signal, use health checks and a
  progressive deployment, IAM roles, narrowly scoped security groups,
  encryption, backups, audit logs, and SLO-based alarms.
- **Verify:** test instance/AZ loss, deployment rollback, restore procedure, and
  application behavior when a dependency is slow—not only component uptime.
- **Trade-off:** multiple zones, managed redundancy, and spare capacity improve
  resilience but add cost and operational complexity. State the required RTO,
  RPO, load profile, and budget before selecting a design.

### A private-subnet workload cannot reach an external dependency

- **Inspect:** resolve DNS and trace the subnet route table, NAT gateway/instance
  path, security group, network ACL, return route, proxy, and VPC Flow Logs.
  Confirm whether the dependency is public or available through a VPC endpoint.
- **Act:** repair the exact route/control. Prefer a suitable VPC endpoint for
  supported AWS services when it meets cost/security needs; otherwise provide
  controlled egress through NAT/proxy rather than a public workload address.
- **Verify:** connect from the affected workload, inspect flow evidence, and
  confirm only the intended destination/path is available.

### RDS connections are exhausted during peak traffic

- **Inspect:** correlate database connections, CPU/memory/storage, waits/locks,
  slow queries, failover events, application pool sizes, request concurrency,
  retry storms, and leaked/long-lived connections.
- **Act:** shed or throttle load if required, then fix pool/concurrency/query
  behavior. Consider a managed proxy only after confirming it addresses the
  connection pattern; resizing alone can postpone the same failure.
- **Verify:** replay controlled load and monitor connection headroom, transaction
  latency, errors, waits, and application pool behavior.

### An S3 request returns AccessDenied

- **Inspect:** identify the exact principal and action, then evaluate identity
  policy, bucket/access-point policy, explicit denies, permissions boundary,
  organization policy, KMS key policy/grant, object ownership, and block-public
  access. Use audit records/policy simulation where appropriate.
- **Act:** add only the missing action/resource/condition or correct ownership;
  do not grant broad administrator or public access to diagnose it.
- **Verify:** retry as the same principal and confirm intended access succeeds
  while a negative test remains denied.

## Concise interview delivery

“I start from availability, RTO/RPO, traffic, security, and cost requirements;
then design multi-AZ stateless compute, managed data protection, least-privilege
identity, observability, and safe deployments. I prove the design with failure,
restore, and rollback tests rather than claiming Multi-AZ alone makes it highly
available.”

## Common pitfalls

- Security groups are stateful; NACLs are stateless. Do not assume one replaces
  the other.
- An ALB in public subnets does not require application instances to be public.
- Multi-AZ improves availability, while read replicas primarily address read
  scale and can introduce replication lag.

## Official references

- [AWS Well-Architected Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
- [AWS IAM security best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Amazon VPC route tables](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Route_Tables.html)
- [Amazon RDS metrics reference](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-metrics.html)
