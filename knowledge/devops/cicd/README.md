# CI/CD

## Core concepts

- Continuous integration validates every change with reproducible build, test,
  lint, and security checks. Continuous delivery keeps a releasable artifact;
  deployment is the controlled act of releasing it.
- Build once and promote the same immutable artifact across environments. The
  artifact should be traceable to commit, build, dependencies, and scan result.
- Deployment safety comes from progressive rollout, health/metric validation,
  rollback, approvals where justified, and clear ownership—not from adding
  manual steps everywhere.

## Recommended pipeline stages

1. Checkout and dependency integrity checks.
2. Lint, unit tests, and build.
3. SAST, dependency/container scan, and secret detection.
4. Publish a versioned immutable artifact plus SBOM/provenance where available.
5. Deploy to a lower environment and run integration/smoke tests.
6. Promote with canary/rolling/blue-green strategy, monitor SLO signals, and
   roll back or halt on a verified regression.

## Interview answer points

- A rollback should use a known-good artifact and configuration state. Database
  migrations need forward-compatible, separately tested rollback strategy.
- Feature flags reduce release risk by separating deployment from exposure, but
  they require ownership and cleanup to avoid permanent complexity.
- Protect production credentials with short-lived workload identity or a secret
  manager; do not expose secrets in build logs or repository variables.

## Common pitfalls

- Rebuilding a tag for every environment creates non-reproducible releases.
- A green deployment is not proof of health; validate user-facing errors,
  latency, saturation, and business-critical checks.
- Skipping tests to restore speed trades a visible delay for hidden risk.
