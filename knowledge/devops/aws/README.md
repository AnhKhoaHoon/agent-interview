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
- ECR is a container image registry. Treat a production image digest as the
  deployable identity; use scan results and lifecycle rules deliberately rather
  than relying on mutable tags or accumulating unbounded image storage.
- ECS task roles and EKS workload identity (for example, IAM roles for service
  accounts) scope AWS permissions to an application workload. They are distinct
  from the permissions the platform needs to launch a task or operate a cluster.

## AWS services commonly expected in a DevOps interview

| Need | Typical AWS service or control | Practical decision |
| --- | --- | --- |
| Identity and automation | IAM roles, STS, IAM Identity Center, OIDC federation | Prefer short-lived role credentials and least-privilege conditions over embedding access keys in CI or workloads. |
| Network boundary | VPC, public/private subnets, route tables, security groups, NACLs, NAT, VPC endpoints | Derive exposure from routes and security controls; use private workloads and only the required ingress/egress path. |
| Object/data protection | S3, versioning, lifecycle rules, KMS, replication/Object Lock where required | Versioning helps recover from overwrite/delete; lifecycle controls retention cost and must include noncurrent versions where needed. |
| Container delivery | ECR, ECS/Fargate or EKS, ALB, Auto Scaling | Build once, scan and promote an immutable digest; give each task/Pod only its required AWS permissions. |
| Managed data | RDS/Aurora, backups, Multi-AZ, read replicas | Match RTO/RPO and read/write pattern; Multi-AZ is availability, not automatically read scaling. |
| Observability and audit | CloudWatch, CloudTrail, VPC Flow Logs | Alert on a user-impacting signal and retain sufficient audit evidence to investigate access or deployment changes. |

## Automation answer pattern

For an AWS automation answer, distinguish three identities: the CI identity
that proposes infrastructure/deployment changes, the platform identity that
operates a service, and the application workload identity. Use short-lived,
scoped roles for each; log the change; make the operation idempotent where
possible; and verify both the AWS control-plane result and the user-facing SLI.
Do not put a long-lived AWS access key in Git, a container image, or a browser
extension.

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

### An EKS workload receives AccessDenied from S3

- **Inspect:** identify the Pod, Kubernetes service account, assumed AWS role,
  IAM policy/resource/condition, role trust relationship, and the exact denied
  action from application and CloudTrail evidence. Confirm the Pod is not
  falling back to an overly broad node credential.
- **Act:** correct the workload identity mapping or add the smallest missing
  S3 action/resource condition to the workload role. Do not solve it by giving
  the node role or cluster role broad S3 access.
- **Verify:** retry from the same workload, confirm the intended request works,
  a disallowed object/action remains denied, and audit logs show the expected
  role session.

### A new container version fails to start in ECS or EKS

- **Inspect:** compare the requested image digest with the registry manifest,
  repository permissions, image scan policy, task/Pod events, runtime logs,
  health checks, and any private-network path to ECR endpoints.
- **Act:** stop promotion if the digest or image is wrong; fix the specific
  registry/workload permission, image, or network path. Promote a known-good
  digest instead of retagging an unknown image as a rollback.
- **Verify:** confirm the expected digest is running, health checks and
  application SLI are normal, and the pipeline's artifact-to-deployment record
  matches the approved commit.

### An S3 bucket costs grow after enabling versioning

- **Inspect:** break down current/noncurrent versions, delete markers, object
  age/size, storage class, access pattern, retention requirements, and any
  legal hold or recovery objective before deleting data.
- **Act:** define and preview lifecycle rules that fit the retention policy,
  including the treatment of noncurrent versions. Keep versioning where recovery
  is required; do not disable it merely to hide a cost symptom.
- **Verify:** review lifecycle execution, recovered-object tests, storage cost
  trend, and that required versions remain recoverable through the agreed window.

## Senior production lens

- Start with workload isolation and account boundaries: separate production
  access, use scoped roles, centralize audit evidence, and do not use one broad
  administrator role as the delivery identity.
- Multi-AZ addresses many in-region failures; it is not automatically regional
  disaster recovery. Define RTO/RPO, data replication/failover behavior, DNS or
  traffic switching, and regularly exercise the recovery path.
- Make capacity and cost decisions from measured demand: autoscaling limits,
  quotas, connection pools, retry behavior, NAT/data-transfer costs, log
  retention, and unused resources can all affect the production outcome.
- For a senior incident answer, state blast radius, use CloudTrail/CloudWatch
  plus service evidence to distinguish hypotheses, choose a reversible
  mitigation, and verify user-facing SLI before closing.

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
- [IAM security best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [S3 Versioning](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html)
- [S3 data protection](https://docs.aws.amazon.com/AmazonS3/latest/userguide/DataDurability.html)
- [Amazon ECR features](https://docs.aws.amazon.com/AmazonECR/latest/userguide/)
- [ECS task IAM role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)
- [EKS IAM roles for service accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
