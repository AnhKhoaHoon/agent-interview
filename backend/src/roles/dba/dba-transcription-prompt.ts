const DBA_KEYWORDS = [
  'PostgreSQL', 'MySQL', 'SQL Server', 'Oracle', 'MariaDB', 'MongoDB', 'Redis',
  'WAL', 'VACUUM', 'autovacuum', 'pg_stat_activity', 'pg_dump', 'pg_restore',
  'EXPLAIN ANALYZE', 'InnoDB', 'binlog', 'GTID', 'slow query log', 'Query Store',
  'Always On Availability Groups', 'RMAN', 'Data Guard', 'backup', 'restore',
  'replication', 'failover', 'RPO', 'RTO', 'point-in-time recovery', 'PITR',
  'index', 'locking', 'deadlock', 'connection pool', 'transaction isolation'
];

export const DBA_TRANSCRIPTION_KEYWORDS = DBA_KEYWORDS;

export function dbaTranscriptionPrompt(language: 'vi' | 'en'): string {
  const languageContext = language === 'vi'
    ? 'cuộc phỏng vấn Database Administrator bằng tiếng Việt'
    : 'English Database Administrator technical interview';
  return `This is a ${languageContext}. Preserve database product names, SQL, acronyms, and technical terms exactly. Do not translate technical names. Relevant terms include: ${DBA_KEYWORDS.join(', ')}.`;
}
