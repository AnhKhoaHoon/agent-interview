# DevSecOps

## Core concepts

- DevSecOps integrates security decisions, controls, and evidence into delivery
  and operations. It is not a separate scanner stage added at the end of CI.
- The goal is risk reduction with fast feedback: define trust boundaries and
  threat scenarios, prevent high-risk changes early, detect residual risk in
  runtime, and provide a safe exception/remediation process.
- Software supply chain security covers source, dependencies, build runner,
  build configuration, artifact registry, deployment identity, and runtime.
  Compromise of any trusted link can ship an unauthorized artifact.
- A finding is not automatically an incident. Prioritize exploitability,
  exposure, asset criticality, compensating controls, and ownership; preserve
  an auditable risk-acceptance path for exceptions.

## Senior DevSecOps delivery model

| Stage | Control | Production evidence |
| --- | --- | --- |
| Source | Protected branches, review, dependency/secret scanning, narrow repository permissions. | Reviewed change, scanner result, and secret exposure response if needed. |
| Build | Ephemeral isolated runner, pinned/reviewed build inputs, least-privilege identity, tests and policy checks. | Build provenance, runner identity, dependency and policy results. |
| Artifact | Immutable digest, SBOM where applicable, vulnerability analysis, signing/attestation policy where the platform supports it. | Artifact digest, provenance/attestation, vulnerability disposition. |
| Deploy | Scoped short-lived deployment identity, protected environment, policy enforcement, approved exception path. | Deployment record mapping commit, artifact digest, approver/policy outcome, target. |
| Runtime | Workload identity, network/data boundaries, telemetry, detection, patch/remediation ownership. | Access/audit trails, runtime findings, SLO/security signals, tested incident response. |

## Production practices

- Prefer short-lived federated identities for CI and workloads. Do not expose
  cloud keys, registry tokens, or signing credentials in repositories, images,
  browser extensions, or build logs.
- Treat an SBOM, scan, or critical finding as decision input rather than a
  magic safety guarantee. Define severity and exploitability policy, a patch
  SLA, compensating controls, and who may approve a temporary exception.
- Enforce policy close to the deployment boundary, but keep policy code
  reviewable, versioned, tested, and observable. A broad deny without a
  recovery/exception process can become a production outage.
- Security telemetry needs ownership and retention, while respecting privacy.
  Avoid treating logs containing secrets/customer payloads as a debugging
  convenience.

## Practical interview scenarios

### A secret appears in a CI log

- **Contain:** stop sharing the log/artifact, identify every exposure path, and
  revoke or rotate the secret promptly. Masking does not undo exposure.
- **Investigate:** establish whether the value was echoed, passed as a command
  argument, written to an artifact/cache, or available to an untrusted runner;
  review audit evidence for use of the credential.
- **Remediate and verify:** retrieve replacement secrets at runtime from a
  controlled secret system, narrow identity permission, sanitize logs/artifacts,
  rerun safely, and prove the old credential no longer works.

### A critical image vulnerability blocks a production release

- **Inspect:** identify the exact artifact digest, affected package and path,
  exploitability in the running configuration, exposure, existing mitigation,
  and whether the fixed base/dependency is available. Do not assess only the
  image tag.
- **Decide:** patch and rebuild when risk requires it; otherwise use a
  documented, time-bounded exception with compensating controls and an owner.
  Do not disable the scanner to unblock delivery.
- **Verify:** deploy the approved replacement digest through normal controls,
  check runtime behavior and scan/provenance evidence, then close the exception
  only when remediation is confirmed.

### A policy blocks an urgent production mitigation

- **Inspect:** identify the exact policy decision, scope, service impact, and
  whether an approved safe alternative exists.
- **Act:** use a narrow, time-bounded break-glass/exception process with named
  ownership and audit evidence; do not permanently weaken a global policy to
  solve one incident.
- **Verify:** restore the guardrail, reconcile the emergency change into
  reviewed IaC, test the intended policy behavior, and document why the normal
  path was insufficient.

## Candidate-ready answer

“I treat DevSecOps as security controls and evidence integrated into the same
delivery path as quality and reliability. I protect source and build identities,
promote immutable artifacts with provenance and vulnerability context, enforce
least privilege at deployment and runtime, and make exceptions time-bounded and
auditable. In an incident, I contain and rotate first, preserve evidence, then
verify both service recovery and that the original exposure path is closed.”

## Common pitfalls

- Treating a scanner pass as proof that an application is secure.
- Blocking every finding without exploitability, ownership, or an emergency
  exception path.
- Giving CI a broad cloud administrator role or using persistent credentials.
- Logging secrets or sensitive payloads while trying to improve observability.

## Official references

- [Google Cloud software supply chain security](https://docs.cloud.google.com/software-supply-chain-security/docs/overview)
- [Google Cloud shift-left supply chain guidance](https://docs.cloud.google.com/solutions/shifting-left-on-security)
- [SLSA build provenance](https://slsa.dev/spec/v1.2/build-provenance)
- [NIST incident response recommendations](https://csrc.nist.gov/pubs/sp/800/61/r3/final)
