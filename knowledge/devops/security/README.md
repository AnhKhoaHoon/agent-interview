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

## Common pitfalls

- Base64 encoding is not secret protection.
- Disabling TLS verification or widening firewall rules for convenience creates
  long-lived exposure.
- Do not paste credentials, production logs, or customer data into tickets,
  shell history, CI output, or AI prompts.
