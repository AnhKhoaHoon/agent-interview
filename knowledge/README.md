# DevOps Knowledge Base

Curated V1 material for DevOps interview answers. Each topic is written as a
compact knowledge card: core concepts, safe operational checks, trade-offs, and
common interview pitfalls. Content supports the DevOps role only.

This directory is a source for future Phase 10 retrieval work. It is not
currently indexed, uploaded, or automatically sent to an LLM.

## Interview answer standard

Use four layers and stop when the interviewer has enough detail:

1. **Direct answer:** state the principle and the decision in one or two
   sentences.
2. **Mechanism:** explain why it works and name the relevant component or
   failure mode.
3. **Practical execution:** give the checks, commands, configuration, or rollout
   sequence you would use.
4. **Verification and trade-off:** define the success signal, rollback point,
   security/reliability risk, and cost or complexity introduced.

For troubleshooting questions, use this repeatable flow:

`impact and scope -> recent changes -> evidence -> hypotheses -> smallest safe
mitigation -> root-cause fix -> verification and prevention`

Do not jump directly to restarting, scaling, increasing a timeout, or widening
permissions. Those actions can hide evidence or increase impact.

## Accuracy and experience rules

- Technical facts should agree with the official references linked in each
  topic. Tool versions and provider behavior must be rechecked before using
  version-specific details.
- Operational recommendations are engineering judgment, not universal rules.
  State the assumptions and trade-offs that make a recommendation appropriate.
- Never present an invented outage, company, metric, scale, or personal action
  as real experience. If the facts are not supplied, answer with “I would…”,
  then describe the investigation and decision process.
- Do not invent a root cause from one symptom. Give likely hypotheses, the
  evidence that distinguishes them, and how recovery will be verified.
- Commands in these cards are diagnostic examples. Confirm environment,
  identity, namespace/account, and blast radius before a mutating command.

## Real-scenario answer template

- **Situation:** clarify user impact, affected scope, onset, and recent change.
- **Evidence:** name the metrics, logs, traces, events, or commands to inspect.
- **Decision:** prioritize hypotheses and choose a reversible mitigation.
- **Execution:** describe ownership, rollout/rollback, and safety controls.
- **Verification:** compare the original SLI and error symptom with baseline.
- **Prevention:** add the smallest useful test, alert, guardrail, or runbook
  improvement.

## Topics

- [Linux](devops/linux/README.md)
- [Networking](devops/networking/README.md)
- [Docker](devops/docker/README.md)
- [Kubernetes](devops/kubernetes/README.md)
- [AWS](devops/aws/README.md)
- [Terraform](devops/terraform/README.md)
- [CI/CD](devops/cicd/README.md)
- [Ansible](devops/ansible/README.md)
- [Observability](devops/observability/README.md)
- [Security](devops/security/README.md)
