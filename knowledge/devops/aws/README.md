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

## Common pitfalls

- Security groups are stateful; NACLs are stateless. Do not assume one replaces
  the other.
- An ALB in public subnets does not require application instances to be public.
- Multi-AZ improves availability, while read replicas primarily address read
  scale and can introduce replication lag.
