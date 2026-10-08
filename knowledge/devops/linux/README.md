# Linux

## Core concepts

- A Linux process has a PID, owner, environment, open files, limits, and a
  lifecycle managed directly or by a supervisor such as systemd.
- CPU saturation, memory pressure/OOM kills, disk exhaustion, inode exhaustion,
  and file-descriptor limits are independent failure modes.
- systemd units define startup order, restart behavior, environment, and logs;
  `journalctl` is usually the first log source for a managed service.

## Safe troubleshooting order

1. Confirm scope and impact with service health, latency, and error rate.
2. Inspect process and host pressure: `ps`, `top`/`htop`, `free -m`, `uptime`,
   `df -h`, `df -i`, and `ss -lntp`.
3. Read service and kernel evidence: `systemctl status`, `journalctl -u NAME`,
   `dmesg`, and application logs.
4. Check configuration, permissions, mounts, DNS, dependencies, and recent
   deployments before restarting anything.
5. Apply the smallest safe fix, then verify recovery with the original symptom.

## Interview answer points

- Explain that load average must be compared with CPU count and runnable/I/O
  waiting tasks; it is not CPU utilization by itself.
- For a full disk, identify the filesystem and growth source before deleting
  files. A deleted-but-open file may still consume space until its process exits.
- For an OOM event, distinguish a host OOM kill from an application limit and
  use kernel logs plus container/service limits to confirm it.

## Practical interview scenarios

### Service latency rises while host load is high

- **Frame the problem:** high load average is a symptom, not proof of CPU
  saturation. First establish which service and requests are affected.
- **Inspect:** correlate `uptime`, `vmstat 1`, `pidstat 1`, `iostat -xz 1`,
  `free -m`, application latency/error metrics, and the deployment timeline.
  Runnable tasks suggest CPU pressure; blocked tasks and high I/O wait point
  toward storage; reclaim, swap, or OOM evidence points toward memory pressure.
- **Act:** stop or limit the verified offender, restore capacity, or roll back a
  regression using the smallest reversible change. Preserve logs and process
  evidence before restart when impact permits.
- **Verify:** confirm user-facing latency/error rate, queue depth, CPU/I/O
  pressure, and recurrence over a representative traffic window.

### `df` reports a full filesystem but `du` cannot find the bytes

- **Inspect:** confirm the exact mount with `df -hT`, check inodes using
  `df -i`, mount boundaries, and deleted files still held open with `lsof +L1`.
- **Act:** rotate/truncate only the identified log through its owning service,
  or restart the specific process holding a deleted file after evaluating
  impact. Fix retention/rotation or unbounded application output afterward.
- **Verify:** confirm free blocks and inodes, application health, and that disk
  growth has returned to an expected rate. Do not use broad deletion commands.

### A systemd service fails immediately after deployment

- **Inspect:** use `systemctl status SERVICE` and
  `journalctl -u SERVICE --since ...`; compare the unit, environment, service
  user, permissions, executable, port, mounts, and dependency availability with
  the last known-good release.
- **Act:** correct the verified configuration or roll back the release. Use
  `systemd-analyze verify` for a changed unit before reloading it.
- **Verify:** check the active process, expected listener with `ss -lntp`, local
  health endpoint, external SLI, and stable restart count.

## Senior production lens

- Manage hosts as a fleet: immutable or consistently configured images,
  patch/kernel lifecycle, capacity headroom, time synchronization, central
  logging, backups, and configuration drift detection are more reliable than
  manual SSH remediation.
- Define host-level signals in relation to service impact. Load average,
  memory pressure, disk latency, file descriptors, and network errors require
  correlation with latency/error SLOs and recent deploy or traffic changes.
- During an incident, protect evidence and blast radius first: stop unsafe
  automation, snapshot or preserve needed logs where policy permits, mitigate
  on a small ring, then apply the declarative fix across the fleet.
- A reboot, failover, or scale-out is a mitigation, not root-cause proof.
  Verify recovery under representative load and add the narrowest alert,
  capacity guardrail, or runbook step that would detect recurrence.

## Concise interview delivery

“I first confirm impact and recent changes, then separate CPU, memory, disk,
I/O, and dependency failure using host and service evidence. I preserve useful
logs, make the smallest reversible mitigation, and only call it recovered when
the original latency/error signal and resource pressure return to baseline.”

## Common pitfalls

- Restarting first destroys useful evidence and can hide a recurring cause.
- `chmod 777` is not a permission fix; identify the owning user, group, ACL,
  mount option, or service account instead.
- Killing a process does not repair a full filesystem, bad dependency, or
  incorrect systemd unit.

## Official references

- [journalctl manual](https://www.freedesktop.org/software/systemd/man/latest/journalctl.html)
- [systemd service manual](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html)
- [Linux kernel virtual-memory documentation](https://docs.kernel.org/admin-guide/sysctl/vm.html)
