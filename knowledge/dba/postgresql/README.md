# PostgreSQL DBA: production interview knowledge

This card is for PostgreSQL DBA interviews at a production/senior level. A
good answer starts with user impact and data-integrity risk, then explains the
smallest safe action, the evidence behind it, and the verification signal. Do
not present a diagnostic query below as permission to run a destructive command
on production.

## Core model: WAL, MVCC, checkpoints, and durability

PostgreSQL records a change in write-ahead logs (WAL) before the changed data
page is considered durable. WAL supports crash recovery, physical replication,
and—when combined with a base backup and retained archive—point-in-time
recovery (PITR). A checkpoint writes dirty buffers and establishes a recovery
point; an overly aggressive checkpoint configuration can create I/O spikes,
while an overly relaxed one can lengthen crash recovery. Tune from observed
WAL rate, write latency, recovery target, and storage capacity, not folklore.

MVCC lets readers and writers often proceed without directly blocking each
other, but updates and deletes leave obsolete tuple versions until vacuuming.
Long transactions can retain old row versions, delay cleanup, increase bloat,
and complicate recovery. In an interview, distinguish database concurrency
(MVCC), transaction isolation, locks, and durability (WAL/fsync); they solve
different problems.

## Production health baseline

Monitor the service from the outside first: successful requests, latency,
error rate, connection-pool wait time, and business backlog. Then correlate
database evidence: CPU, memory, storage latency/space, WAL generation,
connections, active/blocked sessions, transaction age, autovacuum progress,
replica lag, backup freshness, and restore-drill RPO/RTO. Alert ownership and a
runbook matter as much as a threshold; a high CPU alert alone does not identify
the failing query, lock, or storage path.

Set connection-pool limits deliberately. PostgreSQL uses a backend process per
connection, so raising `max_connections` can consume memory and worsen a
connection storm. Prefer bounded application pools, timeouts, and reserved
administrative capacity. Before terminating sessions, identify the application
owner, transaction state, lock impact, and whether cancellation is reversible.

## Incident: the application is slow or timing out

Start with impact, scope, onset, and a recent deploy, migration, traffic spike,
or dependency event. Check pool exhaustion, active versus idle-in-transaction
sessions, waits, blocked queries, disk latency, CPU, cache behavior, and the
top normalized queries. Do not immediately restart PostgreSQL: it can discard
diagnostic state and does not fix a bad plan, lock chain, or overloaded pool.

Use a bounded mitigation first: stop the runaway job, shed non-critical load,
route reads only when replica consistency permits it, or cancel one verified
query. Then correct the root cause—query/index/schema, transaction boundary,
pool limit, or infrastructure—and validate user latency, error rate, queue
depth, and database waits against the pre-incident baseline.

### Safe first look at active sessions

```sql
SELECT pid, usename, application_name, state, wait_event_type, wait_event,
       now() - query_start AS running_for, left(query, 500) AS query
FROM pg_stat_activity
WHERE datname = current_database() AND state <> 'idle'
ORDER BY query_start;
```

This is an observation, not proof that the oldest query caused the incident.
Check the query's plan, caller, transaction state, and blockers before acting.
For an agreed, isolated runaway query, try `pg_cancel_backend(pid)` before the
more disruptive `pg_terminate_backend(pid)`. Both require the right privilege;
record the reason and validate application retry behavior.

## Locks, blocking, and long transactions

An apparent "database hang" is often lock contention or a transaction left
open by an application. PostgreSQL exposes outstanding locks in `pg_locks` and
the blocking relationship through `pg_blocking_pids`. The DBA should identify
the waiting session, blocker, object, transaction age, and business owner;
never kill the first PID seen merely because it is old.

```sql
SELECT a.pid AS waiting_pid, a.usename, a.application_name,
       now() - a.query_start AS waiting_for,
       pg_blocking_pids(a.pid) AS blocking_pids,
       left(a.query, 300) AS waiting_query
FROM pg_stat_activity AS a
WHERE cardinality(pg_blocking_pids(a.pid)) > 0
ORDER BY a.query_start;

SELECT pid, usename, application_name, state,
       now() - xact_start AS transaction_age,
       left(query, 300) AS query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start;
```

Production prevention is usually an application change: short transactions,
consistent lock ordering, statement/lock/idle-in-transaction timeouts suited to
the workload, and migration tooling that controls lock duration. Treat timeout
changes as a trade-off: a timeout can protect capacity but requires correct,
idempotent retry behavior.

## Query performance: evidence before an index

Begin with a real query fingerprint and observed p95/p99 latency, calls, rows,
parameters where safe, and load period. `pg_stat_statements` is useful when it
is intentionally enabled; it aggregates normalized query statistics, so it is
better for prioritization than copying one slow log line. Compare estimated and
actual rows in `EXPLAIN (ANALYZE, BUFFERS)` on a safe representative workload.
Large estimate error often points to stale statistics, skew, correlations, or a
query shape issue—not automatically a missing index.

`EXPLAIN ANALYZE` actually executes the statement. Do not use it against a
mutating or unbounded production query merely to diagnose it. Use a transaction
that is rolled back where appropriate, a replica with known consistency limits,
or a production-safe reproduced query. A new index may improve reads while
adding write amplification, storage, vacuum work, and deployment risk.

```sql
-- Requires pg_stat_statements to be enabled and accessible.
SELECT queryid, calls, total_exec_time, mean_exec_time, rows,
       left(query, 500) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, status, created_at
FROM orders
WHERE customer_id = $1 AND created_at >= $2
ORDER BY created_at DESC
LIMIT 50;
```

## Index and schema changes without avoidable outages

For a large, busy table, assess table size, write rate, query plan, replication
lag, free storage, maintenance window, rollback, and lock behavior before a
change. `CREATE INDEX CONCURRENTLY` avoids blocking concurrent inserts, updates,
and deletes, but takes longer, cannot run inside a transaction block, and can
leave an invalid index after a failed build. Monitor the operation and inspect
the result; do not make it a blanket rule for every index.

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS orders_customer_created_idx
  ON orders (customer_id, created_at DESC);

SELECT phase, lockers_total, lockers_done, blocks_total, blocks_done,
       tuples_total, tuples_done
FROM pg_stat_progress_create_index;
```

For destructive migrations, use expand/contract: add compatible schema first,
deploy readers/writers that tolerate both forms, backfill in bounded batches,
validate, then remove old paths in a separate approved change. A rollback may
be an application rollback, a forward data repair, or restore/PITR; dropping a
column is not reliably reversible after new writes.

## Autovacuum, bloat, and transaction-ID safety

Autovacuum runs `VACUUM` and `ANALYZE` to reclaim reusable space, update planner
statistics, advance visibility information, and prevent transaction-ID and
multixact wraparound. It is a safety mechanism, not optional housekeeping.
High-churn tables commonly need per-table settings based on their rate of
updates/deletes and the acceptable I/O budget; changing global scale factors
without measuring can starve other tables or saturate storage.

Standard `VACUUM` normally coexists with production reads and writes. `VACUUM
FULL` rewrites the table and takes an `ACCESS EXCLUSIVE` lock, so it is not an
incident reflex. First find long transactions, bloat/space pressure, dead
tuples, autovacuum progress, worker capacity, and I/O constraints. Plan any
table rewrite with an outage or a proven online approach.

```sql
SELECT relname, n_live_tup, n_dead_tup,
       last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;

SELECT datname, age(datfrozenxid) AS xid_age
FROM pg_database
ORDER BY xid_age DESC;
```

The tuple counters are statistics, not exact bloat measurements. If XID or
multixact wraparound is at risk, treat it as a data-availability incident:
preserve capacity, resolve transactions that prevent cleanup, and follow the
engine's recovery guidance. Do not disable autovacuum or run `VACUUM FULL` as a
shortcut.

## Backup, restore, and PITR

Choose backup design from required RPO/RTO, data size, restore bandwidth,
retention, encryption, access control, and independent failure domains. A
logical `pg_dump`/`pg_restore` is valuable for portable object-level recovery;
a physical base backup plus archived WAL supports cluster recovery and PITR.
Neither a successful backup job nor a replica proves recovery.

A production restore drill uses an isolated target, the same access controls
needed during an incident, checksums/integrity validation, an explicit recovery
target time or transaction boundary, application-level correctness checks, and
measured RPO/RTO. Keep evidence, owners, escalation, and a decision for how
application writes are fenced. Confirm the backup includes the required roles,
globals, extensions, and encryption-key dependencies.

For the common interview question "How would you recover an accidental delete?":
freeze or fence writes if the RPO decision requires it; identify the time and
scope; restore a copy to an isolated environment to the target point; validate
the rows and referential/business consistency; then use a reviewed repair or
controlled cutover. Do not restore over the primary before proving the target.

## Replication, HA, and failover

Physical streaming replication is asynchronous by default. It can serve
read-only traffic and reduce failover time, but an asynchronous replica can lose
acknowledged primary transactions if the primary is lost before replay.
Synchronous replication reduces that exposure at the cost of commit latency and
availability when the required standby is unavailable. State the chosen RPO,
write-path latency budget, and failover authority rather than claiming "zero
data loss".

Monitor WAL send/receive/replay position, lag trend, slot retention, network,
disk, long-running transactions, recovery conflicts, and client routing. A
standby's replay timestamp alone is not a universal lag metric during an idle
primary. Replication slots protect required WAL from being removed but a stale
slot can retain WAL until disks fill; alert on retained WAL and ownership.

```sql
-- Run on the primary; interpret LSN difference with workload rate and trend.
SELECT application_name, state, sync_state,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn)) AS replay_gap,
       write_lag, flush_lag, replay_lag
FROM pg_stat_replication;

SELECT slot_name, slot_type, active,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_wal
FROM pg_replication_slots;
```

For failover: declare the incident commander and data-loss decision; fence or
prove the old primary unavailable to avoid split brain; promote the intended
standby through the tested orchestration; redirect clients; verify writes,
replication topology, application health, and backups; then rebuild/rejoin the
old primary deliberately. Planned switchover and unplanned failover have
different data-consistency guarantees and should be rehearsed separately.

## Capacity and WAL/disk exhaustion

Database disk incidents can arise from table/index growth, WAL accumulation,
archiving failure, a stalled replication slot, temporary files from sorts/hashes,
logs, or backups. Determine the growing path before deleting anything. Removing
WAL manually can corrupt recovery and replication; deleting a slot can break a
consumer. A safe first mitigation may be to stop a nonessential bulk writer,
free verified non-database space, repair archive/consumer connectivity, or add
capacity under change control.

After recovery, identify the growth rate and owner, set capacity forecasts and
alerts, bound batch jobs, and test the corresponding failure path. For example,
an inactive logical slot must have a documented consumer, retention threshold,
and escalation—not an automatic drop rule.

## Security, access, and operational discipline

Use separate least-privilege application, migration, backup, replication, and
emergency roles. Restrict network access with `pg_hba.conf` and transport
security, rotate secrets, protect backup/archive locations, and audit privileged
access. `pg_hba.conf` is authentication policy, not a substitute for object
privileges; use roles and grants for authorization. Avoid application
superusers, shared administrator accounts, and long-lived plaintext credentials.

Every production change should identify the owner, affected schema/database,
lock and replication risk, observability, approval/maintenance window when
needed, rollback or recovery decision, and post-change validation. For a senior
answer, include the data-integrity boundary, not only uptime.

## Interview-ready production scenarios

### "A deployment caused database errors. What do you do?"

Establish user impact and whether writes are at risk; pause further rollout.
Compare the deploy/migration with the previous version, inspect application and
database errors, active waits/locks, failed migration state, and replica/backup
health. Use the smallest reversible mitigation—application rollback, feature
disable, or a reviewed forward repair—rather than an unexamined schema rollback.
Verify error rate, latency, data invariants, and migration state; then add a
pre-deploy compatibility check, lock budget, and rollback/runbook improvement.

### "How do you handle a slow report on a large table?"

Confirm the report's business deadline and isolate its query fingerprint. Check
the plan, row-estimate accuracy, statistics, index selectivity, memory/temp I/O,
and concurrency impact. Prefer a query/index/materialized-summary design that
fits freshness needs; build large indexes with the appropriate online process,
measure regression on writes, and verify report and workload p95/p99 after the
change. Do not tune random memory settings before establishing the bottleneck.

### "How do you prepare for a regional database failure?"

Start with the allowed RPO/RTO and legal/data-residency constraints. Design
independent backups plus cross-site replication appropriate to those objectives,
define who can declare and execute failover, fence the old writer, test DNS or
connection routing and credentials, and rehearse a restore/failover. Verify the
actual recovery time and data point in a drill; HA topology without a tested
promotion and client reconnection path is incomplete.

## Primary references

- [PostgreSQL monitoring database activity and locks](https://www.postgresql.org/docs/current/monitoring.html)
- [PostgreSQL routine vacuuming and autovacuum](https://www.postgresql.org/docs/current/routine-vacuuming.html)
- [PostgreSQL `VACUUM` reference](https://www.postgresql.org/docs/current/sql-vacuum.html)
- [PostgreSQL `EXPLAIN` and query plans](https://www.postgresql.org/docs/current/using-explain.html)
- [PostgreSQL `CREATE INDEX` reference](https://www.postgresql.org/docs/current/sql-createindex.html)
- [PostgreSQL streaming replication and warm standby](https://www.postgresql.org/docs/current/warm-standby.html)
- [PostgreSQL backup and restore](https://www.postgresql.org/docs/current/backup.html)
- [PostgreSQL continuous archiving and PITR](https://www.postgresql.org/docs/current/continuous-archiving.html)
