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

## Tool roles: do not compare unlike responsibilities

- **GitHub Actions, GitLab CI/CD, and Jenkins** orchestrate CI jobs such as
  checkout, test, build, scan, publish, and sometimes deployment. Jobs execute
  on hosted or self-managed runners/agents.
- **Argo CD** is a Kubernetes GitOps continuous-delivery controller. It compares
  desired state stored in Git with live cluster state and reconciles through a
  sync operation. It does not replace compilation, unit tests, or image builds.
- A common design is therefore `GitHub Actions/GitLab/Jenkins for CI -> immutable
  registry artifact -> reviewed GitOps manifest change -> Argo CD for CD`.
- The tool is not the design. Artifact immutability, isolation, least privilege,
  approvals, promotion, observability, rollback, and auditability still need to
  be designed in every platform.

## Tool comparison

| Tool | Pipeline definition and executor | Strong fit | Important trade-offs |
| --- | --- | --- | --- |
| GitHub Actions | Workflow YAML under `.github/workflows`; jobs run on GitHub-hosted or self-hosted runners | Repositories already on GitHub, pull-request checks, marketplace/reusable workflows | Hosted service is simple; self-hosted runners require patching, isolation, scaling, and protection from untrusted code |
| GitLab CI/CD | `.gitlab-ci.yml`; jobs run on GitLab-hosted or self-managed GitLab Runners | Integrated source, merge request, registry, security, environment, and deployment workflow | An all-in-one platform reduces integration work but can increase platform coupling; runner security still belongs to the operator |
| Jenkins | `Jenkinsfile`; controller schedules Pipeline work and agents execute it | Existing/on-premises systems, custom integrations, heterogeneous or legacy build requirements | Highly flexible, but controller availability, agents, plugins, upgrades, credentials, and shared-library governance create maintenance cost |
| Argo CD | `Application` resources point to Git sources and Kubernetes destinations; controllers compare and sync desired/live state | Declarative Kubernetes delivery, drift visibility, multi-cluster GitOps | Kubernetes-focused; Git/repository and cluster RBAC design, secret handling, sync policy, controller operations, and GitOps promotion must be owned |

Selection should follow repository location, target platform, compliance and
network constraints, team operating capacity, workload isolation, required
integrations, and migration cost—not popularity alone.

## GitHub Actions

### Concepts to explain

- A repository event, schedule, or manual dispatch triggers a workflow. A
  workflow contains jobs; each job runs steps on a runner. Independent jobs can
  run concurrently, while `needs` defines dependencies.
- GitHub-hosted runners reduce infrastructure operations. Self-hosted runners
  provide custom hardware/private-network access but the organization owns
  hardening, updates, capacity, cleanup, and job isolation.
- Reusable workflows centralize organization policy and pipeline behavior.
  Composite or marketplace actions provide reusable steps, but third-party
  actions are supply-chain dependencies and should be reviewed and pinned to an
  immutable full commit SHA.
- Set workflow/job `permissions` explicitly to the minimum needed. Prefer OIDC
  federation to obtain short-lived cloud credentials instead of storing a
  long-lived cloud access key.
- Use protected environments for production approval, allowed branches/tags,
  and environment-scoped secrets where the plan supports the required rule.

### Practical flow

1. A pull request runs lint, unit tests, policy/security checks, and a build that
   does not receive production secrets.
2. A protected merge builds the release once, tags it with an immutable digest,
   produces provenance/SBOM, scans it, and publishes it.
3. The workflow opens or commits a reviewed GitOps change containing that exact
   digest; Argo CD performs cluster reconciliation.
4. Production access uses an environment gate and/or Git approval. Cloud access
   is short-lived and constrained by repository, branch/environment, audience,
   and role policy.

### Interview checks

- For a stuck job, inspect event filters, job `if` conditions, `needs`, approval
  gates, runner labels/capacity, concurrency groups, and service status.
- For an untrusted pull request, do not expose privileged self-hosted runners or
  secrets merely to make the workflow pass. Separate trusted deployment
  workflows from untrusted code execution.
- Cache dependencies using lockfile/toolchain keys; use artifacts for outputs
  that must pass between jobs. Neither should become an unverified release.

## GitLab CI/CD

### Concepts to explain

- Pipelines are defined in `.gitlab-ci.yml`. Jobs execute on runners; stages
  provide ordered groups, while `needs` creates a dependency graph so a job can
  start when its actual prerequisites finish.
- Use `rules` to define when jobs are included for merge requests, branches,
  tags, schedules, or other pipeline sources. Poorly combined rules can create
  duplicate or unexpectedly skipped pipelines.
- Runners can be hosted or self-managed and scoped to a project, group, or
  instance. Tags select suitable runners; executor/isolation and whether
  protected jobs may use a runner are security decisions.
- Artifacts carry job outputs/reports; caches accelerate reusable dependencies.
  Treat them differently and define retention and integrity deliberately.
- Environments record deployment targets/history. Protected environments,
  protected variables, approval policy, and environment-scoped variables help
  constrain production deployment.

### Practical flow

1. Merge-request pipelines run fast verification and publish reports into the
   review flow.
2. The default-branch pipeline builds and scans one immutable artifact.
3. A deployment job updates the GitOps repository or promotes the same artifact
   after the required environment control; it does not rebuild production.
4. Parent-child pipelines can partition a monorepo, and multi-project pipelines
   can coordinate separately owned components when that coupling is intentional.

### Interview checks

- For a Pending job, inspect matching runner availability, tags, protected
  status, executor capacity, and project/group/instance runner scope.
- For a variable missing in a job, inspect protected branch/tag status,
  environment scope, pipeline source, and variable precedence without printing
  the secret.
- For a slow stage-based pipeline, measure the dependency graph and use `needs`
  where jobs are truly independent rather than putting every job into an early
  stage.

## Jenkins

### Concepts to explain

- The controller stores configuration, schedules work, and coordinates Pipeline
  execution; build work should run on appropriately isolated agents rather than
  consuming controller resources.
- A `Jenkinsfile` keeps Pipeline as code. Declarative Pipeline is more
  constrained and easier to standardize; Scripted Pipeline offers flexibility
  but can become application code that is difficult to govern.
- Labels select agents. Ephemeral agents/containers reduce state leakage and
  configuration drift, but their provisioning, image patching, startup time,
  logs, and failed-agent cleanup must be operated.
- Shared Libraries reduce copy/paste, but changes can affect many repositories.
  Version, test, review, and release them like production code.
- Use scoped credential IDs and credential-binding steps. Masking reduces
  accidental display but does not make a secret safe from a malicious Pipeline
  or another process on a poorly isolated agent.

### Practical flow

1. A webhook triggers a multibranch Pipeline for the commit/branch.
2. An ephemeral agent checks out code, verifies dependencies, runs tests/scans,
   builds one artifact, and publishes it with commit/digest traceability.
3. A later controlled stage updates the GitOps repository or deploys the same
   artifact. It uses narrowly scoped credentials only inside that stage.
4. Pipeline logs, artifacts, test results, agent usage, queue time, controller
   health, and plugin/security updates are monitored with defined retention.

### Interview checks

- For a growing queue, separate lack of matching labels/capacity from slow agent
  provisioning, offline agents, executor limits, or a blocked downstream stage.
- For intermittent builds, compare clean and reused workspaces, tool versions,
  undeclared dependencies, network/package repositories, time/order coupling,
  and test flakiness before adding retries.
- For upgrades, back up and test controller configuration, Pipeline/shared
  libraries, authentication, agents, and plugin compatibility in a staging
  controller. Installing more plugins is not a neutral decision.

## Argo CD and GitOps delivery

### Concepts to explain

- An Argo CD `Application` describes a source, destination, and group of
  Kubernetes resources. `AppProject` can constrain allowed repositories,
  destinations, and resource kinds.
- **Target state** is rendered from Git; **live state** is observed in the
  cluster. `Synced` describes their comparison, while `Healthy` describes
  resource health. An application can be Synced but unhealthy.
- Manual sync requires an operator/API action. Automated sync lets Argo CD
  reconcile new Git state. `prune` deletes resources absent from desired state;
  `selfHeal` can correct live drift. These controls should be enabled explicitly
  after deletion risk, ownership, and recovery have been designed.
- Sync waves, phases, and hooks can order resources or migrations, but they do
  not make an incompatible database migration safe.
- With automated sync, the clean rollback model is normally a reviewed Git
  revert or a new commit that restores a known-good image/configuration. This
  keeps Git consistent with the state Argo CD will continue to reconcile.

### Recommended CI-to-Argo CD flow

1. CI builds, tests, scans, signs, and publishes an image once.
2. CI or a promotion process proposes the immutable image digest in the GitOps
   repository. A separate repository can provide stronger application/delivery
   ownership boundaries, but it also adds coordination.
3. Review/policy checks approve the desired-state change.
4. Argo CD detects the new revision, renders manifests, shows the diff, and
   synchronizes according to policy.
5. Deployment success requires both Argo resource health and external service
   SLO/smoke validation. Rollout controllers may be added for canary analysis;
   ordinary sync alone is not automated canary evaluation.

### Operational scenarios

#### An application is OutOfSync

- Compare desired and live manifests and identify whether Git changed, a human
  changed the cluster, a mutating controller created expected differences, or
  rendering/configuration is nondeterministic.
- Revert the unauthorized live change or correct Git. Add a narrowly scoped
  diff customization only for a well-understood controller-owned field; broad
  ignores can hide real drift.
- Verify the expected Git revision is Synced and Healthy and that the external
  service SLI is normal.

#### Sync succeeds but the application is unhealthy

- Inspect Argo resource health, Kubernetes events, rollout status, previous
  container logs, probes, image/configuration, dependencies, and SLO signals.
- Stop further promotion and revert the GitOps commit or restore the known-good
  digest when the new desired state is causal. Do not repeatedly press Sync;
  Argo has already applied the declared state.
- Verify Ready endpoints and user-facing errors/latency, then add the missing
  pre-deployment or post-sync check.

#### Argo CD can deploy more than the team should control

- Restrict repository and destination scope with AppProjects, use SSO plus
  least-privilege RBAC, separate administrative and application responsibilities,
  and constrain cluster credentials/service accounts.
- Keep plaintext secrets out of Git. Use an approved secret-management pattern
  and define who can change the reference and who can read the resulting secret.
- Audit both Git changes and Argo/Kubernetes actions, then test positive and
  negative authorization paths.

## A strong tool-selection answer

“If source is already on GitHub and we want low platform operations, I would
start with GitHub Actions. If the organization wants an integrated self-managed
source-to-deployment platform, GitLab CI/CD may fit. Jenkins is justified when
existing integrations or specialized/on-premises agents outweigh its operating
and plugin-governance cost. For Kubernetes CD, I would pair the selected CI
engine with Argo CD so CI publishes an immutable artifact and Git remains the
auditable desired state. I would validate the decision against security,
network, compliance, scale, skills, and migration constraints.”

## Practical interview scenarios

### A pipeline has become too slow

- **Inspect:** measure queue time and each stage on the critical path; compare
  recent changes, dependency download, cache hit rate, test duration/flakiness,
  build duplication, runner capacity, and artifact upload time.
- **Act:** cache immutable dependency inputs with safe keys, parallelize
  independent tests, shard only after measuring balance, reuse the single built
  artifact, and run fast deterministic checks early. Keep required correctness
  and security gates.
- **Verify:** compare median/tail pipeline time, failure detection time, cache
  correctness, flake rate, cost, and escaped defects over multiple runs.

### A new release causes production errors

- **Act first:** halt promotion and route away from the failing canary or roll
  back to the known-good immutable artifact when the rollback path is safe.
  Preserve deployment, logs, and metric evidence.
- **Investigate:** correlate SLO signals with version, configuration, feature
  flags, dependency behavior, and database compatibility.
- **Verify:** require error/latency recovery and critical smoke/business checks,
  then repair the pipeline guard that should detect this class of regression.

### A database change must deploy without downtime

- **Plan an expand/contract migration:** first add backward-compatible schema;
  deploy code that can work during mixed versions; backfill in bounded batches;
  switch reads/writes with observation; remove the old schema only after all
  consumers and rollback windows are clear.
- **Controls:** test realistic data volume, lock duration, replication lag,
  retries, and failure/restart behavior. Backups are not a substitute for a
  compatible rollout plan.
- **Verify:** check application SLI, migration progress, database locks/load,
  data correctness, and old-version compatibility at each stage.

### A secret appears in a CI log

- **Act:** restrict log access and revoke/rotate the credential immediately;
  determine exposure from audit evidence; remove it from logs/history where the
  platform supports that; and preserve necessary incident evidence securely.
- **Prevent:** use masked runtime injection or workload identity, disable shell
  tracing around secrets, scan commits/artifacts, and test that redaction works.
- **Verify:** confirm the old credential is unusable and review audit activity
  for unauthorized use rather than assuming deletion removed exposure.

### A pipeline deploys the wrong artifact

- **Inspect:** compare the running image digest, commit SHA, build provenance,
  release metadata, and GitOps manifest with the approved change. A mutable tag
  is not enough evidence that the intended artifact is running.
- **Act:** halt further promotion, restore the known-good immutable digest when
  the release is causal, then fix the promotion boundary so CI promotes one
  verified build rather than rebuilding per environment.
- **Verify:** confirm the expected digest is deployed, the service SLO has
  recovered, and the next release has a traceable commit-to-artifact-to-deploy
  chain.

### A self-hosted runner is suspected of compromise

- **Act first:** take the runner out of service, revoke or rotate credentials
  reachable from it, and preserve appropriate audit evidence. Do not continue
  running trusted deployment jobs on it to save queue time.
- **Investigate:** identify jobs, repositories, tokens, network access, image
  provenance, and workspace persistence that could have been exposed.
- **Recover and prevent:** rebuild from a trusted image, use ephemeral isolated
  runners where practical, scope credentials per job/environment, and keep
  untrusted pull requests away from privileged runners.
- **Verify:** exercise a least-privilege deployment path, confirm revoked
  credentials fail, and review runner and cloud audit logs for follow-on use.

## Concise interview delivery

“My pipeline builds once, proves the artifact with layered tests and security
checks, records provenance, then promotes the same immutable artifact with a
progressive rollout. Deployment success is based on user-facing SLO signals,
and every production path has a tested halt or rollback decision.”

## Common pitfalls

- Rebuilding a tag for every environment creates non-reproducible releases.
- A green deployment is not proof of health; validate user-facing errors,
  latency, saturation, and business-critical checks.
- Skipping tests to restore speed trades a visible delay for hidden risk.

## Official references

- [GitHub Actions workflows](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows)
- [GitHub Actions self-hosted runners](https://docs.github.com/en/actions/concepts/runners/self-hosted-runners)
- [GitHub Actions OpenID Connect](https://docs.github.com/en/actions/reference/security/oidc)
- [GitHub Actions deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- [GitLab CI/CD pipelines](https://docs.gitlab.com/ci/pipelines/)
- [GitLab Runner](https://docs.gitlab.com/ci/runners/)
- [GitLab environments](https://docs.gitlab.com/ci/environments/)
- [Jenkins Pipeline syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Jenkins credentials](https://www.jenkins.io/doc/book/security/credentials/)
- [Argo CD core concepts](https://argo-cd.readthedocs.io/en/stable/core_concepts/)
- [Argo CD automated sync policy](https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/)
- [SLSA build provenance](https://slsa.dev/spec/v1.2/build-provenance)
- [Kubernetes Deployments and rolling updates](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [OWASP CI/CD Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html)
