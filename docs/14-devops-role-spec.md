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
- 60-120 words
- 20-30 seconds spoken
- 3-5 keywords
- candidate-ready: confident but accurate, using plain spoken English
- state a recommendation before supporting detail
- mention a trade-off or verification step where it improves the answer
- do not use empty filler, excessive caveats, or textbook-style headings in the final answer
- connect the core principle to a concrete operational example, then state how
  to verify it or evaluate the trade-off

## Interview-answer rules

Answers must be calibrated to the requested level:

- junior: explain core concepts accurately and describe safe, supervised operational steps
- middle: add operational trade-offs, debugging order, and ownership of a bounded service or change
- senior: add system-wide trade-offs, reliability/security/cost impact, rollout strategy, and measurable validation

This calibration changes the depth of technical reasoning, not the truthfulness policy. Do not invent production experience at any level.

## Definition example structure

1. What it is
2. Why it is used
3. one real configuration, check, metric, or operational caveat
4. how to validate that it works

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

A technically correct definition alone is not interview-ready. Except for a
clarifying question, each technical answer should demonstrate how the concept
changes an operational decision. Prefer one concrete implementation detail and
one verification signal over a long list of product features.

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
