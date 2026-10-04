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

## Practical interview scenarios

### A configuration rollout fails on part of the fleet

- **Inspect:** identify the failed batch/hosts and task result, then compare
  inventory variables, facts, reachability, privilege, package/service state,
  and the rendered configuration. Do not rerun against all hosts blindly.
- **Act:** stop the rollout using controlled `serial` batches and failure
  thresholds. Restore the known-good configuration/version on affected hosts or
  fix the verified host-group difference; run handlers only where notified.
- **Verify:** validate configuration syntax, service health, fleet version, and
  user-facing SLI before continuing the next batch.

### A playbook reports changes on every run

- **Inspect:** run twice in a disposable environment and identify tasks that
  always return `changed`. Common causes are unconditional shell commands,
  nondeterministic templates, timestamps, and incorrect `changed_when` logic.
- **Act:** replace commands with idempotent modules, make inputs deterministic,
  and use `creates`/`removes` or accurate change conditions only when a module
  is not available.
- **Verify:** the second run should report no change for stable desired state,
  while a real input change must still trigger the task and required handler.

### Rotate a service credential without a broad outage

- **Plan:** retrieve the secret from Vault/an external manager at runtime,
  restrict output (`no_log` where appropriate), and use an overlap period or
  staged rotation if the provider supports two valid credentials.
- **Act:** canary the new credential, distribute it in serial batches, validate
  authentication, switch consumers, then revoke the old credential.
- **Verify:** confirm all hosts use the new version, the old credential is
  rejected, logs contain no secret, and the service SLI stayed healthy.

### Check mode reports success but the real run fails

- **Explain:** check mode is a prediction and not every module/command supports
  it fully; it cannot reproduce every external side effect or runtime failure.
- **Act:** combine syntax/lint and `--check --diff` with a disposable integration
  target or canary, then verify the actual service. Treat check mode as one
  control, not proof of safe execution.

## Concise interview delivery

“I make playbooks idempotent with purpose-built modules, validate them in check
mode and a disposable target, then roll out in serial canary batches with clear
failure thresholds. Handlers run only after a real change, and success means the
rendered configuration and service health are verified.”

## Common pitfalls

- `shell`/`command` tasks often lose idempotence; add `creates`, `removes`, or
  use an appropriate module.
- Broad `hosts: all` plus unrestricted privilege escalation is risky.
- Do not restart services for every task; notify handlers only after changes.

## Official references

- [Ansible check and diff modes](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_checkmode.html)
- [Ansible error handling](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_error_handling.html)
- [Ansible playbook strategies](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_strategies.html)
- [Ansible Vault](https://docs.ansible.com/ansible/latest/vault_guide/index.html)
