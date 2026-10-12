# DBA production operations

## Backup and recovery

A successful backup job proves only that bytes were produced. A recovery
capability is demonstrated by a scheduled restore drill in an isolated target,
with checksum/integrity checks, the intended recovery point, access controls,
application-level validation, measured RPO/RTO, and evidence retained. Define
who authorizes production recovery and how writes are fenced during recovery.

## High availability and failover

Availability features reduce downtime but do not replace a backup/restore
strategy. In SQL Server Always On Availability Groups, a set of availability
databases can fail over together; backup job preference and failover behavior
still need explicit operational design. For any engine, distinguish synchronous
from asynchronous replication, state the latency/durability trade-off, and
test the client reconnection and failback paths.

## Security and change safety

Use distinct least-privilege application, migration, backup, and emergency
administration identities. Protect connection secrets, encrypt supported data
paths, audit privileged access, and time-box break-glass access. For schema or
index changes, establish lock/replication impact, use an engine-appropriate
online/reversible method where possible, monitor the change, and retain a
rollback or recovery decision.

## Incident questions: good answer order

1. Confirm impact and preserve diagnostic evidence.
2. Identify the affected database, workload, topology, and data-integrity risk.
3. Choose a reversible mitigation with a bounded blast radius.
4. Fix the root cause only after evidence supports it.
5. Verify service, data correctness, replication/backup health, and the alert.

## Primary references

- [SQL Server Always On Availability Groups overview](https://learn.microsoft.com/en-us/sql/database-engine/availability-groups/windows/always-on-availability-groups-sql-server?view=sql-server-ver16)
- [SQL Server business continuity and recovery](https://learn.microsoft.com/sql/sql-server/failover-clusters/high-availability-solutions-sql-server)
