# DBA interview knowledge

This role-specific knowledge is for Database Administrator interviews. It is
separate from `knowledge/devops/`: retrieval is filtered by the interview role
before category matching, so DBA answers do not borrow unrelated DevOps cards.

## Topics

- [PostgreSQL](postgresql/README.md): WAL/MVCC, connection and lock incidents,
  query plans, safe index/schema changes, autovacuum, replication/failover,
  backup/PITR, capacity, security, and production SQL diagnostics.
- [MySQL](mysql/README.md): InnoDB/MVCC, locks and deadlocks, execution plans,
  index/change safety, binary logs and PITR, GTID replication/failover,
  managed MySQL, production incidents, and senior SQL coding exercises.
- [Db2 LUW](db2-luw/README.md): instances, databases, SQL PL, Linux/RHEL
  operations, backup/rollforward, HADR, pureScale/DPF/federation, query
  performance, Amazon RDS for Db2, and cloud-migration scenarios.
- [Operations](operations/README.md): recovery drills, HA/failover, performance, and security.

## Senior-answer standard

For production questions, start with data integrity and the stated RPO/RTO or
availability requirement. Separate a backup from a tested recovery, and a
replica from a complete failover design. Use a scoped, reversible action,
preserve evidence, and name the verification signal before making broad changes.

## Senior DBA interview coverage

The role is broader than running SQL. Senior questions may test reliability and
recovery ownership, HA/DR trade-offs, performance/capacity, safe schema and
data changes, security/audit, automation/runbooks, managed-cloud limitations,
and communication during a data-risk incident. For coding questions, state the
schema assumptions, concurrency/integrity constraint, parameterization and
index/plan implication in addition to giving SQL.
