# Db2 LUW DBA: production interview knowledge

This card covers IBM Db2 for Linux, UNIX, and Windows (Db2 LUW) for a senior
DBA interview. Start an applied answer with the affected service, integrity
risk, and recovery/availability objective. Diagnose before changing a database
configuration, restarting an instance, killing an application, or failing over.

## Scope and vocabulary

Db2 LUW runs on Linux, UNIX, and Windows. An **instance** is the Db2 runtime
and administration boundary owned by an instance owner; a **database** is a
separate data and configuration unit within that runtime. Do not use those
terms interchangeably. On Linux/UNIX, the instance owner's profile makes the
Db2 command environment available. Use a dedicated instance owner and fenced
user where the installation requires one; do not run routine database work as
`root`.

Db2 uses SQL and its own procedural language, **SQL PL**. Some Db2 editions
have Oracle PL/SQL compatibility features, but a DBA should not assume that
every Oracle PL/SQL package, syntax construct, or migration behavior works
unchanged. Inventory and test the actual application SQL, routines, drivers,
data types, character sets, and transaction semantics.

## Instance and database provisioning

Provisioning is more than executing `CREATE DATABASE`. Establish the approved
Db2 release/fix-pack, operating-system support, storage layout and latency,
filesystem ownership/mount options, service accounts, network/TLS policy,
backup/log locations, monitoring, capacity alarms, and restore test before
handing a database to an application team.

On Linux/UNIX, an authorized installer can create an instance with `db2icrt`.
The instance owner then uses the Db2 profile and creates a database with an
explicit code set, territory/collation, page-size and storage decision that
have been reviewed for the workload. An illustrative sequence is:

```bash
# Run the instance creation only through the approved install procedure.
<DB2DIR>/instance/db2icrt -u <fenced_user> <instance_owner>

# Log in as the instance owner, then initialise this shell's Db2 environment.
. ~<instance_owner>/sqllib/db2profile
db2start
db2 create database APPDB automatic storage yes \
  using codeset UTF-8 territory US collate using system
```

The command is not a universal production recipe. Validate the required page
size before creating objects, confirm storage groups and log placement, and
record the chosen code page/collation because changing them later is a
migration. On Windows, instance creation and service identities follow the
installed Db2 copy and Windows administrator model; do not apply Linux paths or
shell-profile assumptions.

Useful non-mutating first checks on a Linux host are `db2level`, `db2ilist`,
`db2pd -inst`, `db2 get dbm cfg`, and, after connecting to the intended
database, `db2 get db cfg for <database>`. Confirm the instance and database
name before every action; a correctly formed command on the wrong environment
is still an incident.

## Linux and Red Hat operational discipline

For RHEL, verify OS/kernel support against the Db2 version, filesystem space
and inode usage, memory pressure/swap, CPU steal or saturation, network/DNS,
ulimits, time synchronization, permissions, and the Db2 diagnostic log before
changing Db2 parameters. Shell scripts and `cron` are appropriate for bounded,
auditable housekeeping such as backup verification or capacity collection, not
for silently fixing production incidents.

A production script should use an explicit `PATH`, source the correct instance
profile, set a restrictive `umask`, avoid passwords on its command line, write
timestamped logs with a correlation/change ID, check each exit status, prevent
overlap with a lock, and alert on failure. Test it under the same service
account and schedule as production. `vi` is an editing tool, not a substitute
for version control, peer review, or controlled deployment of scripts.

For an outage, inspect the application symptom, `db2diag.log`, database
directory/log filesystem, active applications and waits, and host resource
signals. Preserve evidence before `db2stop`, `db2start`, or process-level
intervention. A restart may clear the symptom while losing the lock, error, or
resource evidence needed to establish root cause.

## Backup, logs, restore, and recovery

Design recovery from the business RPO/RTO, data volume, log rate, retention,
restore bandwidth, encryption/key access, and an isolated restore-drill
result. A completed backup job proves that an image was written; it does not
prove that the application can recover.

An offline backup is consistent when it completes. An online backup allows the
database to remain available, but it must be followed by rollforward recovery
using the required log chain to make a restored database consistent. Therefore
log archiving, retention, immutable/off-site protection where required, and a
tested `RESTORE` plus `ROLLFORWARD` procedure are part of the design, not
optional afterthoughts.

For an accidental delete, first identify the affected scope and the recovery
point, decide whether to fence writes, and protect the existing evidence and
logs. Restore to an isolated database or host, roll forward to the approved
point in time, validate rows plus referential/business consistency, then perform
a reviewed data repair or controlled cutover. Do not immediately restore over a
healthy primary merely because a backup exists.

Example commands belong in a rehearsed runbook, with the database name,
backup location, log source, target time, and authorization reviewed:

```text
BACKUP DATABASE APPDB ONLINE TO <approved_backup_path> INCLUDE LOGS
RESTORE DATABASE APPDB FROM <approved_backup_path> INTO APPDB_RECOVERED
ROLLFORWARD DATABASE APPDB_RECOVERED TO <target_timestamp> USING LOCAL TIME
ROLLFORWARD DATABASE APPDB_RECOVERED COMPLETE
```

Whether `INCLUDE LOGS`, local logs, an archive location, and an online backup
are appropriate depends on the recovery design. Measure the resulting RPO/RTO
in an isolated drill and verify application reads, required writes, object
counts/checksums, and backup status.

## HADR, pureScale, partitioning, and federation

HADR is Db2's primary/standby disaster-recovery capability. The DBA must state
the replication mode, the acceptable data-loss exposure, latency budget,
failover authority, client rerouting approach, and a tested procedure for
fencing the old primary. A standby is not a backup; asynchronous behavior can
lose transactions not replicated before a primary loss, while stronger
durability modes can add write latency or reduce availability when the standby
is unavailable.

For a suspected HADR issue, verify role/state, log shipping/replay position,
network, storage and diagnostic events before triggering a takeover. The
standard evidence is obtained from the documented HADR monitoring views or
`db2pd -db <database> -hadr`, interpreted alongside workload rate and trend.
After a controlled takeover, verify the writer endpoint, application commit
behavior, old-primary fencing, backup job health, and the deliberate rejoin or
rebuild of the former primary.

Db2 pureScale is a shared-disk clustering architecture with multiple members
and cluster caching facilities. It targets continuous availability and scale,
but increases storage, network, quorum and operational complexity. Db2
partitioned databases (DPF) distribute data across database partitions for
parallelism; distribution-key skew, partition availability and coordinated
backup/restore are central operational concerns. Do not describe pureScale and
DPF as interchangeable solutions.

Federation exposes remote data sources through Db2 nicknames/wrappers. Treat
remote credentials, pushdown behavior, source availability, network latency,
transaction semantics and query plans as part of the design. A federated query
can be convenient while still being an unsuitable path for a high-volume
transactional request.

## Query performance, locks, and data modeling

For a slow workload, begin with the user-visible SLI and query fingerprint:
when it became slow, execution count, rows processed, resource/wait profile,
parameter selectivity, concurrent load, and recent statistics/schema/release
changes. Inspect a representative execution plan and actual runtime evidence.
Do not create an index only because a query is slow: it can add write cost,
space use, logging, maintenance work and deployment risk.

Db2 explain information is useful only when it corresponds to the relevant
statement and current statistics. An estimate mismatch can indicate stale
statistics, data skew, correlation, an unsuitable access path, or a query
shape issue. Refreshing statistics or adding an index is a controlled change:
measure a realistic workload, assess locking/log/storage impact, define rollback
and validate both the target query and write-path regression.

For blocking, identify the waiter, holder, lock object/mode, transaction age,
application owner and business impact. `db2pd -db <database> -locks
showlocks` is an observation aid, not permission to force applications off the
database. Prefer a scoped, agreed action such as pausing the job or cancelling
the verified statement; only force a connection after considering rollback cost,
client retry behavior and ownership. Prevent recurrence through short
transactions, consistent access order, bounded batch sizes, appropriate timeouts
and migration lock budgets.

Logical modeling defines entities, relationships, business keys and rules;
physical modeling maps them to schemas, tablespaces/storage, partitioning,
indexes, compression and data types for the actual workload. A senior DBA
explains the trade-off: a design that improves one report can increase ingest
cost, contention or recovery time. Keep DDL and data conversion versioned,
reviewed, idempotent where possible, and rehearsed against production-shaped
data.

## AWS and Amazon RDS for Db2

Amazon RDS for Db2 is a managed deployment option, not the same operating model
as self-managed Db2 on EC2. AWS manages infrastructure and exposes managed
backups, snapshots and point-in-time restores, but it intentionally restricts
some Db2 authority. The RDS master user has `DBADM` with limitations and does
not receive instance-level `SYSADM`, `SYSCTRL`, `SYSMAINT` or database-level
`SECADM`. Check the documented engine version, edition, Region/instance-class
support and feature limitations before promising an implementation.

For RDS for Db2, design VPC/subnets/security groups, private connectivity,
TLS, IAM/operator access, KMS/encryption requirements, parameter/option-group
changes, maintenance windows, CloudWatch/RDS event monitoring, backup retention
and restore drills. Managed service reduces host administration; it does not
remove ownership of schema changes, connection limits, SQL performance,
application retry behavior, RPO/RTO or incident communication.

For a migration to AWS, start with discovery: source version/edition,
unsupported features, code pages, object inventory, SQL PL/compatibility,
data volume/change rate, downtime allowance, network path and success criteria.
Separate schema/object conversion from data movement and ongoing change
replication. AWS DMS can support Db2 LUW in supported source/target paths, but
its endpoint/version and task limitations must be checked for the exact route.
Reconcile row counts and business totals, validate critical reads/writes and
performance, freeze or coordinate the final write window, then keep the source
available for the agreed rollback period. Do not call a migration complete just
because a replication task reports success.

## Interview-ready scenarios

### "A Db2 application is timing out after a release. What do you do?"

Establish affected transactions, whether writes are at risk, scope, start time
and the exact release/database. Pause further rollout if needed and preserve
application errors, Db2 diagnostics, active applications, lock/wait evidence,
resource and log-space signals. Compare the changed SQL/schema/configuration;
use the smallest reversible mitigation, such as disabling the feature or
rolling back application code, rather than an unreviewed database restart or
schema reversal. Verify error rate, commit behavior, latency, lock/wait profile
and data invariants; then add a release gate for plan/lock/compatibility checks.

### "How would you migrate on-prem Db2 LUW to Amazon RDS for Db2?"

First confirm that the exact Db2 edition/version, extensions, authority needs,
topology and RPO/RTO fit RDS limitations; otherwise choose a self-managed Db2
design. Inventory and test objects/data types/routines, size the network and
load window, create an encrypted private RDS environment, and rehearse schema
deployment plus initial load/change replication. During cutover, control writes,
wait for an agreed replication/reconciliation point, redirect through a tested
endpoint plan, and verify key business transactions, counts, latency, backups
and monitoring. Retain a time-bounded rollback plan rather than assuming a
reverse migration is instant.

### "A backup succeeded but restore failed. What does that prove?"

It proves only that the backup workflow produced an image; it does not meet the
recovery objective. Preserve the backup/log evidence, determine whether the
failure is media, encryption/credentials, missing log chain, version/path or
capacity related, and restore into an isolated target. Correct the runbook and
automate a periodic restore drill that measures RPO/RTO and validates
application-level consistency. Alert on drill failure, not just backup-job
failure.

## Primary references

- [IBM: db2icrt create-instance command](https://www.ibm.com/docs/en/db2/12.1.x?topic=commands-db2icrt-create-instance)
- [IBM: Db2 pureScale backup, restore, and rollforward](https://www.ibm.com/docs/en/db2/12.1.x?topic=mdpf-backup-restore-rollforward-operations-within-db2-purescale-feature)
- [IBM: backup and restore in a partitioned database environment](https://www.ibm.com/docs/en/db2/11.5.x?topic=backup-restore-in-db2-partitioned-database-environment)
- [AWS: Amazon RDS for Db2](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Db2.html)
- [AWS DMS: Db2 LUW source](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Source.DB2.html)
- [AWS DMS: Db2 LUW target](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Target.DB2.html)
