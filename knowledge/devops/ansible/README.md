# Ansible

## Core concepts

- An inventory defines managed hosts and groups. Playbooks apply desired changes
  through modules; roles package reusable tasks, defaults, handlers, templates,
  and variables.
- Idempotence means a repeated run converges to the same intended state without
  unnecessary changes. Prefer purpose-built modules over ad-hoc shell commands.
- Handlers run only when notified by a changed task, which is appropriate for
  actions such as restarting a service after validated configuration changes.

## Safe workflow

1. Validate inventory/group targeting and use least-privilege SSH/become access.
2. Lint and syntax-check playbooks; run `--check --diff` where modules support
   it.
3. Test a small canary host group before broad rollout.
4. Use tags, serial batches, handlers, and clear failure thresholds for
   controlled execution.
5. Verify service health/configuration and capture the run result.

## Interview answer points

- Roles make a service configuration reusable and testable across environments.
- Variables should have a documented precedence strategy; avoid relying on
  unclear overrides that make a host's effective configuration hard to audit.
- Ansible Vault encrypts values at rest in source control, but runtime secrets
  still need controlled decryption, access policy, and log hygiene.

## Common pitfalls

- `shell`/`command` tasks often lose idempotence; add `creates`, `removes`, or
  use an appropriate module.
- Broad `hosts: all` plus unrestricted privilege escalation is risky.
- Do not restart services for every task; notify handlers only after changes.
