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

## Common pitfalls

- Restarting first destroys useful evidence and can hide a recurring cause.
- `chmod 777` is not a permission fix; identify the owning user, group, ACL,
  mount option, or service account instead.
- Killing a process does not repair a full filesystem, bad dependency, or
  incorrect systemd unit.
