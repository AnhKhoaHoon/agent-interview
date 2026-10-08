# DevOps Role Specification

## Role ID

`devops`

## Level support

- junior
- middle
- senior

V1 default:
`middle`

## Topic taxonomy

- Linux
- Networking
- Git
- Docker
- Docker Compose
- Kubernetes
- AWS
- Azure
- GCP
- Microservices
- DevSecOps
- Infrastructure as Code
- Terraform
- Ansible
- CI/CD
- Jenkins
- GitLab CI
- ArgoCD
- Prometheus
- Grafana
- Logging
- Observability
- Security
- Redis
- Kafka
- PostgreSQL
- MySQL
- Troubleshooting
- System Design

## Answer style

Default:
- direct
- practical
- definition: 18-55 words, roughly 8-15 seconds spoken
- other technical modes: use the mode-specific word range and depth
- candidate-ready: confident but accurate, using plain spoken English
- state a recommendation before supporting detail
- mention a trade-off or verification step where it improves the answer
- do not use empty filler, excessive caveats, or textbook-style headings in the final answer
- for applied questions, connect the core principle to a concrete operational
  example, then state how to verify it or evaluate the trade-off

## Interview-answer rules

Answers must be calibrated to the requested level:

- junior: explain core concepts accurately and describe safe, supervised operational steps
- middle: add operational trade-offs, debugging order, and ownership of a bounded service or change
- senior: add system-wide trade-offs, reliability/security/cost impact, rollout strategy, and measurable validation

This calibration changes the depth of technical reasoning, not the truthfulness policy. Do not invent production experience at any level.

For a senior applied answer, begin from the relevant production constraint
(availability/SLO, RTO/RPO, security boundary, capacity, or cost), identify
blast radius, choose a reversible mitigation before a broad change, and name a
material trade-off. Tie delivery answers to an immutable version and a rollback
or recovery decision. Do not claim zero downtime, active-active, or zero data
loss unless the stated design and data-consistency trade-off support it.

## Definition example structure

1. What it is
2. one essential distinction or relevance sentence, if it clarifies the term
3. stop and wait for a follow-up

Do not append an unrelated deployment, observability, or troubleshooting
checklist to a definition answer. For Docker, distinguish an image from a
running container; image tags are mutable references even when a release uses
an immutable digest. If the interviewer asks only “Docker là gì?”, do not
introduce CI/CD, registries, Kubernetes, or deployment workflows.

For a direct Azure definition, keep the answer on the named Azure service or
concept. For an Azure CI/CD scenario, distinguish the Azure Pipeline deployment
identity, AKS/ACR image-pull identity, and runtime workload identity when those
boundaries are relevant; use the same immutable artifact across environments
and name one meaningful post-deployment verification signal.

## Comparison structure

1. key difference
2. trade-offs
3. when to use each

## Troubleshooting structure

1. inspect symptoms
2. check logs/events/metrics
3. verify configuration/resources/dependencies
4. isolate root cause
5. fix and verify

## Theory-to-practice rule

A direct definition is interview-ready when it answers the exact question
accurately and concisely. Do not add implementation detail or verification just
to make it longer. Applied questions should demonstrate how the concept changes
an operational decision; prefer one concrete implementation detail and one
verification signal over a long list of product features.

## Experience questions

Never fabricate.

Use only verified candidate profile data.

When no verified profile is available, return an answer labelled `Adaptable answer` that uses a STAR outline with placeholders the candidate must replace. Example: `Situation: [relevant service or project] ...`. Do not present the outline as a personal experience.

## Quality rubric

Before an answer is completed, it should satisfy all of the following:

1. It directly addresses the interviewer’s current question.
2. It is technically accurate and appropriate for a DevOps interview.
3. It can be spoken naturally in roughly 20-30 seconds.
4. It contains a concrete operational detail, trade-off, or validation step where relevant.
5. It makes no unverified personal claim.
