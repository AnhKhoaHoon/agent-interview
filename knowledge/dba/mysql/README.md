# MySQL DBA: senior production and SQL interview knowledge

This card is for MySQL/InnoDB DBA interviews. A senior answer distinguishes an
application/query defect from an engine, capacity, replication or recovery
failure. Start with user impact, data-integrity risk and the SLO/RPO/RTO; then
use the smallest reversible action and prove the outcome.

## Core model: InnoDB, transactions, and binary logs

InnoDB provides transactions, row-level locking and crash recovery. Redo logs
support crash recovery; undo records support MVCC/consistent reads and rollback.
Binary logs record data/DDL changes for replication and, with a usable full
backup, point-in-time recovery (PITR). These solve different problems: a
healthy replica is not a backup, and a successful backup job is not proof that
the application can recover.

Choose isolation level, transaction scope, indexes and retry behavior together.
Long transactions retain undo history, hold locks and can cause purge/rollback
pressure. A timeout does not make a write safe to retry unless the operation is
idempotent or protected by a correct deduplication key.

## Senior DBA capability map

A senior MySQL DBA should own or partner on:

- **Reliability:** SLI/SLOs, capacity forecasts, connection budgets, on-call
  runbooks and escalation; distinguish user impact from a noisy symptom.
- **Data protection:** backup/binlog retention, PITR, encryption/key access and
  restore drills that demonstrate RPO/RTO.
- **HA/DR:** source/replica, semi-synchronous trade-offs, Group
  Replication/InnoDB Cluster where appropriate, writer routing, split-brain
  prevention, failover and failback.
- **Performance:** query digest/latency, `EXPLAIN`, lock waits, buffer pool and
  disk evidence before tuning; understand each index's write/storage cost.
- **Change safety:** schema/data migration lock and replication risk,
  expand/contract delivery, tested online schema change prerequisites.
- **Security/governance:** least privilege, separated app/migration/backup
  identities, secret rotation, TLS, protected backups and audited break-glass.
- **Delivery/communication:** make RPO/RTO/maintenance decisions explicit,
  coordinate app/platform owners and communicate trade-offs honestly.

Do not invent personal production ownership, scale or outage outcomes. For an
experience question, use an adaptable outline: scope, evidence, decision, safe
rollout, verification and prevention.

## Health baseline and connection pressure

Start outside the database: successful requests, p95/p99 latency, error rate,
queue depth and pool wait time. Correlate MySQL evidence: connections/running
threads, disk space/latency, CPU, buffer-pool pressure, temporary-table I/O,
redo/checkpoint activity, active/blocked transactions, replica lag, binary-log
growth, backup freshness and restore-drill results.

Raising `max_connections` is not a universal fix. A connection storm consumes
resources and worsens memory pressure and recovery time. Prefer bounded app
pools, timeouts, backpressure, one reserved administrative connection and an
explicit load-shedding decision. Before killing a session, identify its owner,
transaction state, lock impact and client retry behavior.

## Slow query: evidence before an index

Identify a normalized query fingerprint, user impact, latency percentile, call
rate, rows examined/returned, selectivity, concurrency and onset. Inspect
query-digest/slow-log evidence, the execution plan, statistics, temporary
tables/filesort, locks and storage behavior. `EXPLAIN ANALYZE` executes the
statement, so use it only for a safe representative read query or controlled
reproduction—not an unbounded or mutating production statement.

```sql
-- Read-only path inspection.
EXPLAIN FORMAT=tree
SELECT id, status, created_at
FROM orders
WHERE customer_id = ? AND created_at >= ?
ORDER BY created_at DESC
LIMIT 50;

-- MySQL 8+: this executes the SELECT; use only after confirming it is safe.
EXPLAIN ANALYZE
SELECT id, status, created_at
FROM orders
WHERE customer_id = 12345 AND created_at >= '2026-01-01'
ORDER BY created_at DESC
LIMIT 50;
```

An index can improve a selective read while adding write amplification, disk
use, buffer-pool competition, replication work and migration risk. Validate the
plan and p95/p99 under realistic read/write load. Avoid accidental full scans,
non-sargable predicates and large offset pagination when a range/keyset approach
fits the business behavior.

## Locks, deadlocks, and metadata-lock incidents

Deadlocks are expected under concurrency: InnoDB chooses a victim, rolls it
back and returns an error. Applications need a bounded retry only for operations
designed to be safe to retry. Investigate transaction order, index access path,
batch size and lock scope; a larger timeout may hide the lock-order problem.

For a live incident, identify waiter, blocker, object, lock mode, transaction
age and application owner before intervening. Performance Schema and `sys` can
show lock waits when enabled:

```sql
SELECT object_schema, object_name,
       waiting_pid, waiting_query,
       blocking_pid, blocking_query
FROM sys.schema_table_lock_waits
ORDER BY waiting_query_secs DESC;

SELECT * FROM performance_schema.data_lock_waits;
```

Availability and columns depend on version/instrumentation. These queries are
observations, not permission to execute `KILL`. Prefer pausing an agreed job or
cancelling the verified caller; if a session must end, document rollback impact
and validate application recovery. Metadata locks can make small DDL wait behind
an open transaction and then block subsequent work. Set a lock-time budget,
check transaction age and retain an expand/contract rollback path. Never call
DDL "online" without checking exact version, operation, algorithm/lock level
and workload.

## Replication, GTID, HA, and failover

Traditional replication streams source binary-log events. GTID-based replication
identifies transactions consistently across a topology and simplifies correct
positioning/failover, but it does not remove the need to inspect lag, errors,
binary-log retention and the approved RPO. Do not infer health from one lag
number; interpret it with workload rate, errors and GTID/topology state.

Never run `RESET BINARY LOGS AND GTIDS`, purge logs, or skip/inject a transaction
as an incident reflex: those actions can destroy recovery history or hide data
divergence. For source failure: fence the old writer; inspect candidate freshness
and disclose RPO exposure; promote through a tested runbook; update one writer
endpoint; then verify commits, routing, business invariants and rebuild/rejoin
the former source deliberately.

Semi-synchronous replication changes the durability/latency/availability
trade-off; it is not a zero-data-loss guarantee. Group Replication/InnoDB
Cluster adds orchestration but still requires designed quorum, network-partition,
write-mode, routing and recovery procedures.

## Backup, restore, and point-in-time recovery

Select logical, physical or managed backups from data size, portability,
restore time, encryption, retention and restore bandwidth. PITR starts with a
verified full backup and applies retained binary logs to the required point; the
complete log chain and credentials/keys must remain available. Restore an
accidental-delete incident to isolation, replay to just before the bad change,
validate rows plus business/referential consistency, then make a reviewed repair
or cutover. Do not overwrite the primary before the recovered data is useful.

## Schema/data migration and SQL coding questions

Assess table size, write rate, foreign keys/triggers, metadata-lock risk,
replica lag, disk/log headroom and old/new application compatibility. Use
expand/contract: add compatible structure, deploy tolerant code, backfill in
small resumable batches, validate, switch reads/writes, then remove old paths in
a later approved change. A rollback can be an app rollback or forward data
repair; it is not always reverse DDL.

For a coding question, clarify schema, uniqueness, null semantics, transaction
and isolation needs, cardinality and index strategy. Return parameterized SQL,
not string-concatenated user input. Example: latest completed order per customer
in MySQL 8+:

```sql
WITH ranked_orders AS (
  SELECT o.customer_id, o.id, o.created_at, o.total_amount,
         ROW_NUMBER() OVER (
           PARTITION BY o.customer_id
           ORDER BY o.created_at DESC, o.id DESC
         ) AS row_number
  FROM orders AS o
  WHERE o.status = 'completed'
)
SELECT customer_id, id, created_at, total_amount
FROM ranked_orders
WHERE row_number = 1;
```

For a large table, discuss an index aligned with predicate/order only after
checking selectivity and actual plans; there is no universal index order. For an
idempotent money-like write, use a transaction and unique business idempotency
key; on duplicate key, retrieve the established result rather than charge/mutate
again. Senior credit comes from naming integrity and concurrency constraints,
not merely writing valid syntax.

## Security and managed MySQL

Use separate application, migration, backup, replication and emergency
identities. Grant minimum privileges, rotate secrets, use TLS where required,
protect backup/binlog access and audit privileged changes. Do not solve access
failure with `GRANT ALL` or an application account that can administer MySQL.

For Amazon RDS/Aurora MySQL, distinguish AWS's host-management responsibility
from DBA responsibility. The team still owns schema safety, query performance,
pooling, network/TLS/IAM choices, RPO/RTO validation and application failover.
Confirm exact engine/version/Region and feature limits before promising a
maintenance, replication or privilege model.

## Interview-ready scenarios

### "CPU is high and the API is slow. What do you do?"

Confirm endpoint impact and write risk; compare onset with deploys, traffic and
batch jobs. Check pool saturation, top query fingerprints, waits/locks, plans,
CPU, disk latency, buffer-pool/temp I/O and replica state. Use a reversible
mitigation—pause a noncritical report, rate-limit a route or roll back a
verified release—rather than restarting MySQL. Verify API p95/p99, errors,
database waits and resource trend; add a query/load regression guardrail.

### "Write SQL to find duplicate emails before adding a unique constraint."

```sql
SELECT email, COUNT(*) AS duplicate_count
FROM users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, email;
```

Agree how case/whitespace and historical records are normalized, repair
duplicates through an auditable migration, check active writes, then validate
the constraint rollout under realistic load. The current column collation must
match the business definition of duplicate.

## Primary references

- [MySQL: replication with GTIDs](https://dev.mysql.com/doc/refman/8.4/en/replication-gtids-howto.html)
- [MySQL: point-in-time recovery](https://dev.mysql.com/doc/refman/8.4/en/point-in-time-recovery.html)
- [MySQL: lock and lock-wait information](https://dev.mysql.com/doc/refman/8.4/en/innodb-information-schema-understanding-innodb-locking.html)
- [MySQL: metadata-lock wait view](https://dev.mysql.com/doc/refman/8.4/en/sys-schema-table-lock-waits.html)
