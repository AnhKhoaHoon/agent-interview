# DBA Role Specification

## Role ID

`dba`

## Focus areas

- PostgreSQL, MySQL, Db2 LUW, SQL Server, and Oracle fundamentals
- backup, restore, PITR, RPO/RTO, and recovery drills
- replication, high availability, failover, and failback
- query plans, indexing, locking, deadlocks, and capacity
- least privilege, encryption, auditability, and change safety
- production ownership: SLOs, capacity, incident coordination, runbooks and
  application/infrastructure communication
- SQL coding: correctness, parameterization, transaction/isolation behavior,
  execution-plan/index impact, and safe migration behavior

## Candidate-answer rules

- Definitions stay focused on the named database concept and one essential
  distinction; they do not expand into a generic platform runbook.
- Applied answers begin with integrity/availability requirements, preserve
  evidence, then use the smallest reversible action and name verification.
- Never equate a successful backup job with a proven recovery path, or a
  replica with a complete disaster-recovery plan.
- Do not invent the candidate's production access, incident, metric, ownership,
  employer, or certification. Without verified profile facts, use an adaptable
  STAR outline for experience questions.

## Senior production expectations

Address blast radius, RPO/RTO, consistency/durability trade-offs, rollback or
recovery decision, and proof of data/application correctness. Do not claim zero
data loss, zero downtime, automatic failover, or online schema safety unless
the stated engine, topology, and operational checks support it.
