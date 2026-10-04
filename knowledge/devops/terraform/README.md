# Terraform

## Core concepts

- Terraform state maps declared resources to real infrastructure. It lets the
  plan calculate creates, updates, and deletes safely.
- A remote backend with locking protects shared state. State is sensitive and
  requires access control, encryption, versioning, and recovery procedures.
- Modules provide reusable interfaces; variables and outputs define their
  contract. Keep environment-specific values outside module implementation.

### Terraform backends: a precise interview answer

- Terraform uses the `local` backend by default, and supports several built-in
  backends. It is incorrect to say Terraform has only two backend types.
- A `remote` backend is one particular backend; teams commonly choose a remote,
  shared backend for collaboration because it can provide controlled state
  access and, where supported, locking/version recovery.
- A root module configures one backend at a time. The choice should follow state
  sensitivity, team concurrency, access control, recovery needs, and the
  platform's locking behavior rather than a product name alone.

## Safe workflow

1. Format and validate code: `terraform fmt -check` and `terraform validate`.
2. Run `terraform plan` against the intended workspace/backend and review every
   destructive or replacement action.
3. Apply an approved, reviewed plan through controlled CI with a state lock.
4. Verify the resulting service and record the change; avoid manual console
   edits, or import/reconcile them deliberately.

## Interview answer points

- Drift is a difference between state/configuration and real infrastructure.
  Detect it with plans, investigate ownership, then reconcile through code.
- `count` is position-based and can cause resource churn when a list changes;
  `for_each` with stable keys is often safer for named resources.
- Use lifecycle rules sparingly. `prevent_destroy` protects critical resources,
  but it also makes intentional replacement a planned operational task.

## Practical interview scenarios

### A plan shows drift after a manual production change

- **Inspect:** save and review the plan to identify whether reality, state, or
  configuration differs. Determine who owns the resource and whether the manual
  change was an approved emergency action or an unmanaged change.
- **Act:** either encode the desired real change in configuration, or let an
  reviewed apply restore the declared state. Import an existing resource when
  bringing it under management; do not edit state JSON manually.
- **Verify:** run a fresh plan expecting no unexplained change, then verify the
  affected service. Record the ownership/process gap that allowed drift.

### Two CI jobs contend for the same state

- **Inspect:** identify the backend, lock owner/operation, job status, and
  whether the lock is active or stale.
- **Act:** serialize applies per state and keep backend locking enabled. Only
  force-unlock a confirmed stale lock using its exact lock ID after proving the
  owning operation is no longer running; never use `-lock=false` for a normal
  shared-state apply.
- **Verify:** confirm one writer, backend version/recovery state, successful
  plan/apply, and no concurrent infrastructure mutation.

### A resource/module rename appears as destroy and recreate

- **Inspect:** read the provider-specific replacement reasons and compare old
  and new resource addresses. Confirm the real resource should remain
  unchanged.
- **Act:** use a reviewed `moved` block for configuration refactoring (or a
  carefully controlled state move for the applicable workflow). Use import when
  adopting an existing object. Back up/version remote state and test in a lower
  environment.
- **Verify:** the saved plan must show the intended address move with no
  destructive replacement, followed by service checks and a clean next plan.

### A provider upgrade changes many resources

- **Inspect:** review the provider changelog/schema behavior, lock-file diff,
  every replacement, and environment-specific impact.
- **Act:** pin compatible versions, upgrade deliberately with
  `terraform init -upgrade`, test lower environments, and split risky
  migrations when possible.
- **Verify:** review a saved production plan and post-apply service/state health;
  do not merge a lock-file update whose plan was not examined.

## Concise interview delivery

“Terraform state maps configuration to real objects, so I protect it with a
remote backend, access control, encryption, versioning, and locking. Every
change gets a saved, reviewed plan; destructive actions need explanation; and I
verify both the service and a clean follow-up plan after apply.”

## Common pitfalls

- Never commit state files containing credentials or resource metadata to Git.
- Do not apply automatically from an unreviewed plan in a shared environment.
- Provider/module upgrades can change plans; pin compatible versions and test
  upgrades in lower environments.

## Official references

- [Terraform state purpose](https://developer.hashicorp.com/terraform/language/state/purpose)
- [Terraform state locking](https://developer.hashicorp.com/terraform/language/state/locking)
- [Terraform backend configuration](https://developer.hashicorp.com/terraform/language/backend)
- [Manage resource drift](https://developer.hashicorp.com/terraform/tutorials/state/resource-drift)
- [Refactor modules with `moved` blocks](https://developer.hashicorp.com/terraform/language/modules/develop/refactoring)
