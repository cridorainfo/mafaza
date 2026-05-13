#!/bin/bash
set -euo pipefail

# Exits after one dump + upload (required for Railway Cron jobs).
# Secrets: DATABASE_URL (from linked Railway Postgres), RCLONE_CONFIG_B64 or RCLONE_CONFIG.

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "backup.sh: DATABASE_URL is required" >&2
  exit 1
fi

if [[ -z "${RCLONE_CONFIG_B64:-}" && -z "${RCLONE_CONFIG:-}" ]]; then
  echo "backup.sh: set RCLONE_CONFIG_B64 (base64 of rclone.conf) or RCLONE_CONFIG" >&2
  exit 1
fi

RCLONE_CFG="${RCLONE_CONFIG_FILE:-/tmp/rclone.conf}"
mkdir -p "$(dirname "$RCLONE_CFG")"

if [[ -n "${RCLONE_CONFIG_B64:-}" ]]; then
  printf '%s' "$RCLONE_CONFIG_B64" | base64 -d >"$RCLONE_CFG"
else
  printf '%s' "$RCLONE_CONFIG" >"$RCLONE_CFG"
fi

REMOTE="${RCLONE_REMOTE:-gdrive:}"
STAMP="$(date -u +%Y%m%d_%H%M%SZ)"
DUMP="/tmp/mafaza-db-${STAMP}.sql.gz"

echo "backup.sh: pg_dump -> ${DUMP}"
set +e
pg_dump --no-owner --no-acl "$DATABASE_URL" | gzip -9c >"$DUMP"
PG_DUMP_STATUS="${PIPESTATUS[0]}"
set -e
if [[ "$PG_DUMP_STATUS" -ne 0 ]]; then
  echo "backup.sh: pg_dump failed with exit ${PG_DUMP_STATUS}" >&2
  rm -f "$DUMP"
  exit "$PG_DUMP_STATUS"
fi

if [[ ! -s "$DUMP" ]]; then
  echo "backup.sh: dump file is empty" >&2
  rm -f "$DUMP"
  exit 1
fi

echo "backup.sh: rclone copy -> ${REMOTE}"
rclone --config "$RCLONE_CFG" copy "$DUMP" "$REMOTE" \
  --transfers 1 --checkers 2 --retries 5 --low-level-retries 10 -v

rm -f "$DUMP"
echo "backup.sh: done"
