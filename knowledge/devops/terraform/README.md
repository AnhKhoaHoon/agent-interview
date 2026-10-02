# Terraform

## Core concepts

- Terraform state maps declared resources to real infrastructure. It lets the
  plan calculate creates, updates, and deletes safely.
- A remote backend with locking protects shared state. State is sensitive and
  requires access control, encryption, versioning, and recovery procedures.
- Modules provide reusable interfaces; variables and outputs define their
  contract. Keep environment-specific values outside module implementation.

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

## Common pitfalls

- Never commit state files containing credentials or resource metadata to Git.
- Do not apply automatically from an unreviewed plan in a shared environment.
- Provider/module upgrades can change plans; pin compatible versions and test
  upgrades in lower environments.
