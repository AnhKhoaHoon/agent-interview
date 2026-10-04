# Security

## Core concepts

- Defense in depth combines identity, network controls, secure configuration,
  encryption, monitoring, patching, backups, and incident response.
- Least privilege grants only needed actions on needed resources under defined
  conditions. Prefer short-lived workload identities over static credentials.
- Secrets need lifecycle control: generation, storage, access, rotation,
  revocation, auditing, and prevention of accidental disclosure in source or
  logs.

## Practical controls

1. Authenticate humans/workloads strongly and enforce MFA/role-based access.
2. Store secrets in a secret manager; inject them at runtime and rotate them.
3. Restrict network paths with security groups/firewalls, Kubernetes
   NetworkPolicies, private endpoints, and TLS.
4. Scan dependencies, images, infrastructure code, and repositories; prioritize
   exploitable findings by exposure and business impact.
5. Centralize audit/security events and maintain tested incident and recovery
   procedures.

## Interview answer points

- Image scanning reduces known-vulnerability risk but must be paired with base
  image updates, signing/provenance, runtime controls, and an exception policy.
- Encrypt data in transit and at rest, then control key access and rotation;
  encryption alone does not solve excessive permissions.
- During an incident: contain safely, preserve evidence, rotate exposed
  credentials, identify scope/root cause, recover, and document prevention.

## Practical interview scenarios

### An access key is committed to a repository

- **Contain:** disable/revoke the exposed credential immediately using a
  trusted administrative path; do not wait for repository history cleanup.
- **Investigate:** preserve evidence and use identity/audit logs to establish
  creation time, exposure window, actions, resources, source, and persistence.
  Escalate according to the incident plan when production or customer data may
  be affected.
- **Recover:** rotate dependent credentials, remove the secret from current and
  historical artifacts where feasible, replace static keys with short-lived
  workload identity, and add secret scanning/pre-commit controls.
- **Verify:** the old key is unusable, no unauthorized resources/sessions remain,
  affected systems are healthy, and monitoring covers follow-on activity.

### A scanner reports a critical vulnerability in a production image

- **Triage:** confirm package/version, fix availability, exploit preconditions,
  runtime reachability, privileges, network exposure, and compensating controls.
  Severity alone does not establish actual exposure, but a plausible critical
  path deserves rapid containment.
- **Act:** update the dependency/base image and rebuild the immutable artifact;
  scan/sign it, test it, and deploy progressively. If no fix exists, document a
  time-limited exception and reduce exposure with concrete controls.
- **Verify:** rescan the deployed digest, check runtime health and SLOs, and
  confirm the old digest can no longer be promoted.

### An IAM role is broader than the workload requires

- **Inspect:** use audit/access evidence to distinguish needed actions and
  resources, then evaluate explicit denies, trust policy, permission boundaries,
  conditions, and cross-account paths.
- **Act:** create a scoped policy with specific actions/resources/conditions,
  canary it on the workload, and retain a controlled rollback path. Prefer
  temporary credentials issued to the workload identity.
- **Verify:** required operations pass, negative tests fail, and audit logs show
  no unexpected access. Remove the old broad policy after observation.

### Ransomware or destructive activity is suspected

- **Act:** invoke the incident plan and isolate affected identities/systems in a
  way that preserves evidence and avoids spreading impact. Protect clean backup
  copies and rotate compromised access through trusted systems.
- **Recover:** establish scope and initial access, eradicate persistence, restore
  from tested clean backups in priority order, and monitor carefully during
  reintroduction.
- **Verify:** integrity and business services are restored, compromised paths
  are closed, and recovery objectives are measured. Do not improvise destructive
  cleanup before incident leadership/evidence requirements are understood.

## Concise interview delivery

“I prioritize identity and blast radius: contain the verified path, preserve
evidence, determine scope from audit data, eradicate persistence, and recover
from known-good artifacts or backups. I verify both service recovery and that
the old access path is denied, then add the narrowest preventive control.”

## Common pitfalls

- Base64 encoding is not secret protection.
- Disabling TLS verification or widening firewall rules for convenience creates
  long-lived exposure.
- Do not paste credentials, production logs, or customer data into tickets,
  shell history, CI output, or AI prompts.

## Official references

- [NIST incident response recommendations (SP 800-61 Rev. 3)](https://csrc.nist.gov/pubs/sp/800/61/r3/final)
- [CISA ransomware response checklist](https://www.cisa.gov/stopransomware/ransomware-guide)
- [AWS IAM security best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [SLSA build provenance](https://slsa.dev/spec/v1.2/build-provenance)
