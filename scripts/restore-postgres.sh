#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_FILE:?BACKUP_FILE must identify one reviewed dump file}"
: "${CONFIRM_RESTORE:?Set CONFIRM_RESTORE=yes after verifying the target database}"

if [ "$CONFIRM_RESTORE" != "yes" ]; then
  printf '%s\n' 'Restore cancelled: CONFIRM_RESTORE must equal yes.' >&2
  exit 1
fi
if [ ! -f "$BACKUP_FILE" ]; then
  printf '%s\n' 'Restore cancelled: BACKUP_FILE does not exist.' >&2
  exit 1
fi
if [ ! -f "$BACKUP_FILE.sha256" ]; then
  printf '%s\n' 'Restore cancelled: backup checksum file is missing.' >&2
  exit 1
fi

sha256sum --check "$BACKUP_FILE.sha256"
pg_restore --dbname="$DATABASE_URL" --clean --if-exists --no-owner --no-privileges --exit-on-error "$BACKUP_FILE"
