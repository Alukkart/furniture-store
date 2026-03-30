#!/usr/bin/env sh
set -eu

if [ "${1:-}" = "" ]; then
  echo "Usage: $0 <backup-file.sql>"
  exit 1
fi

BACKUP_FILE="$1"
cat "${BACKUP_FILE}" | docker compose exec -T furniture_db psql -U user -d furniture
echo "Restore completed from ${BACKUP_FILE}"
