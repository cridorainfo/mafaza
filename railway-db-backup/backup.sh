#!/bin/bash
set -euo pipefail

# One-shot backup for Railway Cron: Postgres dump (ledgers, users, etc.) + uploads to Google Drive.
# Secrets: DATABASE_URL, RCLONE_CONFIG_B64 or RCLONE_CONFIG, APP_URL (for /uploads files).

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

echo "backup.sh: pg_dump (includes Users, UserLedgers, Projects, Transactions, ...) -> ${DUMP}"
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

echo "backup.sh: rclone copy database -> ${REMOTE}"
rclone --config "$RCLONE_CFG" copy "$DUMP" "$REMOTE" \
  --transfers 1 --checkers 2 --retries 5 --low-level-retries 10 -v
rm -f "$DUMP"

backup_uploads() {
  set +e
  local uploads_tmp="/tmp/mafaza-uploads-${STAMP}"
  local paths_file="/tmp/mafaza-upload-paths.txt"
  mkdir -p "$uploads_tmp"
  local fetched=0
  local upload_errors=0

  if [[ -n "${UPLOADS_DIR:-}" && -d "${UPLOADS_DIR}" ]]; then
    echo "backup.sh: mirroring UPLOADS_DIR=${UPLOADS_DIR}"
    shopt -s nullglob
    for f in "${UPLOADS_DIR}"/*; do
      [[ -f "$f" ]] || continue
      cp -f "$f" "${uploads_tmp}/$(basename "$f")"
      fetched=$((fetched + 1))
    done
    shopt -u nullglob
  fi

  local app_url="${APP_URL:-}"
  app_url="${app_url#APP_URL=}"
  app_url="${app_url#"${app_url%%[![:space:]]*}"}"
  app_url="${app_url%"${app_url##*[![:space:]]}"}"
  app_url="${app_url%/}"

  if [[ -n "$app_url" ]]; then
    if ! command -v curl >/dev/null 2>&1; then
      echo "backup.sh: warning: curl not installed; skipping HTTP upload fetch (rebuild image)" >&2
    else
      echo "backup.sh: fetching /uploads files from ${app_url}"
      psql "$DATABASE_URL" -t -A -c "
        SELECT DISTINCT path FROM (
          SELECT link AS path FROM \"ProjectImages\" WHERE link IS NOT NULL AND trim(link) <> ''
          UNION
          SELECT receipt AS path FROM \"Transactions\" WHERE receipt IS NOT NULL AND trim(receipt) <> ''
          UNION
          SELECT \"adminReceipt\" AS path FROM \"Transactions\" WHERE \"adminReceipt\" IS NOT NULL AND trim(\"adminReceipt\") <> ''
          UNION
          SELECT avatar AS path FROM \"Users\" WHERE avatar IS NOT NULL AND trim(avatar) <> ''
        ) t;
      " >"$paths_file" 2>/dev/null
      if [[ ! -s "$paths_file" ]]; then
        echo "backup.sh: warning: no upload paths from database (empty or query failed)" >&2
      else
        while IFS= read -r path; do
          [[ -z "$path" ]] && continue
          [[ "$path" != /* ]] && path="/${path}"
          local base
          base="$(basename "$path")"
          local dest="${uploads_tmp}/${base}"
          if [[ -f "$dest" ]]; then
            continue
          fi
          if curl -fsSL --max-time 120 -o "$dest" "${app_url}${path}"; then
            fetched=$((fetched + 1))
            echo "backup.sh: saved ${base}"
          else
            upload_errors=$((upload_errors + 1))
            echo "backup.sh: warning: failed to fetch ${app_url}${path}" >&2
          fi
        done <"$paths_file"
      fi
      rm -f "$paths_file"
    fi
  else
    echo "backup.sh: APP_URL not set; skipping HTTP upload fetch (set APP_URL=https://app.mafazainvestment.com)" >&2
  fi

  if [[ "$fetched" -eq 0 ]]; then
    echo "backup.sh: no upload files collected"
    rm -rf "$uploads_tmp"
    set -e
    return 0
  fi

  local remote_dated="${REMOTE}mafaza-uploads/${STAMP}/"
  local remote_latest="${REMOTE}mafaza-uploads/latest/"
  echo "backup.sh: rclone copy ${fetched} file(s) -> ${remote_dated}"
  if ! rclone --config "$RCLONE_CFG" copy "$uploads_tmp" "$remote_dated" \
    --transfers 2 --checkers 4 --retries 5 --low-level-retries 10 -v; then
    upload_errors=$((upload_errors + 1))
  fi
  echo "backup.sh: rclone copy uploads -> ${remote_latest}"
  if ! rclone --config "$RCLONE_CFG" copy "$uploads_tmp" "$remote_latest" \
    --transfers 2 --checkers 4 --retries 5 --low-level-retries 10 -v; then
    upload_errors=$((upload_errors + 1))
  fi
  rm -rf "$uploads_tmp"
  set -e
  if [[ "$upload_errors" -gt 0 ]]; then
    echo "backup.sh: uploads phase completed with ${upload_errors} warning(s)" >&2
  fi
  return 0
}

backup_uploads
echo "backup.sh: done"
