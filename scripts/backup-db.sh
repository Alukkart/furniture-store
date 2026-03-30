#!/usr/bin/env sh
set -eu

OUT_DIR="${1:-./backups}"
STAMP="$(date +"%Y%m%d-%H%M%S")"
OUT_FILE="${OUT_DIR}/furniture-${STAMP}.sql"

mkdir -p "${OUT_DIR}"
docker compose exec -T furniture_db pg_dump -U user -d furniture > "${OUT_FILE}"
echo "Backup saved to ${OUT_FILE}"
