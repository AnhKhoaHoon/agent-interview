#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_DIR:?BACKUP_DIR must be an explicit writable directory}"

mkdir -p "$BACKUP_DIR"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
backup_path="$BACKUP_DIR/agent-interview-$timestamp.dump"
pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-privileges --file="$backup_path"
pg_restore --list "$backup_path" >/dev/null
sha256sum "$backup_path" > "$backup_path.sha256"
printf '%s\n' "$backup_path"
