# Infrastructure as Code (IaC)

## Core concepts

- Infrastructure as Code defines desired infrastructure in version-controlled,
  reviewable configuration instead of relying on undocumented console changes.
  It makes a change reproducible only when the code, provider/module versions,
  inputs, identity, and state strategy are controlled as well.
- Provisioning tools such as Terraform or CloudFormation create and manage cloud
  resources. Configuration management tools such as Ansible configure software
  and operating-system state. They can be combined, but one should not be
  described as a direct replacement for the other without considering the
  target and lifecycle.
- A plan is an intended change, not proof of a safe deployment. Review creates,
  deletes, and replacements; apply the approved plan with the expected backend,
  workspace, identity, and concurrency lock.
- State maps configuration to managed real objects. It may contain sensitive
  metadata, so protect remote state, backups/version history, access control,
  encryption, and locking. Never commit it to source control.

## Practical automation workflow

1. A pull request runs formatting, syntax/configuration validation, static
   policy/security checks, module tests, and a non-mutating plan.
2. The review records the target account/environment, change set, provider and
   module lock-file diff, and every delete/replacement. The automation identity
   uses a short-lived, least-privilege role rather than a long-lived key.
3. An approved deployment applies the exact saved plan or a freshly reviewed
   final plan under a backend lock. It does not rerun an unreviewed local plan
   against production.
4. Post-apply automation verifies the required outputs and user-facing service
   checks, then records the version, plan, approver, and result. A clean
   subsequent plan is useful evidence, but it does not replace a service check.

## Design and interview points

- **Idempotency:** repeated execution should converge toward the declared state
  without unintended duplicate resources. APIs, provisioners, and imperative
  scripts may weaken that property, so make retry behavior explicit.
- **Modules:** publish small interfaces with documented inputs/outputs, pinned
  versions, validation, examples, and tests. A module is not reusable if every
  caller must know its internal resource layout.
- **Policy as code:** enforce measurable guardrails before a change when
  possible, such as approved regions, required encryption/tags, no public
  exposure, or allowed instance families. Policies need versioning, tests,
  exception ownership, and an enforcement level; they are not a substitute for
  reviewing blast radius.
- **Secrets:** use references to a secret manager or runtime identity where
  appropriate. Do not put plaintext secrets into variables, plans, logs, or
  state merely because the file is encrypted in Git.

## Tool selection

| Constraint | Appropriate direction | Trade-off to state in an interview |
| --- | --- | --- |
| Multi-provider or reusable platform modules | Terraform with a controlled remote state backend | Provider/module supply chain, state operations, and execution identity still require ownership. |
| AWS-native resource lifecycle and organization controls | CloudFormation/CDK-based workflow where it fits the platform | AWS coupling may be intentional; use change sets and drift detection rather than assuming a template is the live truth. |
| OS/package/service configuration after infrastructure exists | Ansible or another configuration-management workflow | Keep inventory, credentials, idempotency, rollback, and convergence checks explicit. |

## Practical interview scenarios

### A production IaC plan unexpectedly replaces a database

- **Inspect:** stop the apply and read the exact replacement reason, resource
  address, input/module/provider change, state, and dependency chain. Confirm
  whether the database must survive the intended change.
- **Act:** redesign the migration for compatibility, use an address move/import
  only when it models the real object correctly, and test the plan in a lower
  environment. Do not approve a replacement because the plan is syntactically
  valid.
- **Verify:** the saved production plan shows the intended non-destructive path;
  after deployment, verify application behavior, backup/restore expectations,
  and a clean follow-up plan.

### The same IaC code works locally but fails in CI

- **Inspect:** compare the exact tool, provider/module lock file, backend and
  workspace, input variables, target account/region, execution identity, and
  network access. Never print secret values while comparing inputs.
- **Act:** pin tool/provider versions, make CI use an explicit environment and
  short-lived role, and remove hidden local defaults. Treat a missing permission
  as an authorization design issue, not a reason to give CI administrator access.
- **Verify:** reproduce through the controlled pipeline, inspect the saved plan,
  and confirm the role can perform only the required actions.

### A policy blocks an urgent infrastructure change

- **Inspect:** identify the policy rule, target resource, risk it protects, and
  whether the request is an incident mitigation or an attempt to bypass a
  normal guardrail.
- **Act:** use the documented, time-bounded exception path with accountable
  approval when justified; otherwise change the configuration safely. Record a
  follow-up to remove the exception or improve the policy signal.
- **Verify:** confirm the minimal change resolved impact, the exception did not
  widen unrelated access, and policy enforcement is restored.

## Concise interview delivery

“IaC makes infrastructure reviewable and reproducible, but code alone is not
enough. I version and test modules, protect and lock state, review the exact
plan, apply with a short-lived scoped identity, and verify the service after
the change. For destructive replacements, I stop and redesign the migration
rather than treating a successful apply as success.”

## Common pitfalls

- Running `apply -auto-approve` against production from an unreviewed branch.
- Treating a speculative pull-request plan as the final plan after other
  infrastructure changes may have happened.
- Using `-lock=false` to work around normal shared-state contention.
- Storing secrets in state, plan output, CI logs, or module defaults.

## Official references

- [Terraform workflow and saved plans](https://developer.hashicorp.com/terraform/cli/run)
- [Terraform plan](https://developer.hashicorp.com/terraform/cli/commands/plan)
- [Terraform validation](https://developer.hashicorp.com/terraform/language/validate)
- [Terraform tests](https://developer.hashicorp.com/terraform/language/tests)
- [Terraform policy](https://developer.hashicorp.com/terraform/policy)
- [CloudFormation change sets](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-change-sets.html)
- [CloudFormation drift detection](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-stack-drift.html)
