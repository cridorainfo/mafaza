# Railway Postgres + uploads → Google Drive backup

Docker image for [Railway Cron](https://docs.railway.com/cron-jobs): runs once, then exits.

Each run uploads:

1. **Database** — `pg_dump | gzip` → `mafaza-db-YYYYMMDD_HHMMSSZ.sql.gz`  
   Includes **all tables**: `Users`, **`UserLedgers`**, `Projects`, `Transactions`, `ProjectImages`, etc.

2. **Uploads (images & receipts)** — files under `/uploads` → `mafaza-uploads/YYYYMMDD_HHMMSSZ/` and `mafaza-uploads/latest/`  
   Paths are read from the database, then downloaded from your public app URL.

## Railway setup

1. **Service** → deploy this repo → **Root Directory** `railway-db-backup`.
2. **Variables**
   - **`DATABASE_URL`** — reference **Postgres-AFWD** (or your active Postgres) internal URL.
   - **`APP_URL`** — public site origin, e.g. `https://app.mafazainvestment.com` (no trailing slash; do not prefix with `APP_URL=`).
   - **`RCLONE_CONFIG_B64`** or **`RCLONE_CONFIG`** — Google Drive rclone config (see below).
   - Optional **`RCLONE_REMOTE`**: default `gdrive:`.
   - Optional **`UPLOADS_DIR`**: if you mount `mafaza-volume` on this service at e.g. `/uploads`, set `UPLOADS_DIR=/uploads` to copy every file on disk (in addition to DB-linked paths).
3. **Cron** — `railway.toml` sets **daily 03:00 UTC** (`0 3 * * *`). Remove duplicate schedule under Settings → Cron if both are set.
4. Deploy → **Logs** should end with `backup.sh: done`. Check Drive for `.sql.gz` and `mafaza-uploads/latest/`.

### Refresh rclone (Google Drive token)

If uploads stop with auth errors, on your PC:

```powershell
rclone config reconnect gdrive:
```

Then update **`RCLONE_CONFIG`** on Railway from `%APPDATA%\rclone\rclone.conf`, or base64:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:APPDATA\rclone\rclone.conf")) | Set-Clipboard
```

Paste into **`RCLONE_CONFIG_B64`** and redeploy.

## `pg_dump` / SSL

If the dump fails with SSL errors, append **`?sslmode=require`** to `DATABASE_URL`.

## Restore (reminder)

- **DB**: `gunzip -c mafaza-db-....sql.gz | psql "$DATABASE_PUBLIC_URL"`
- **Images**: restore files from `mafaza-uploads/latest/` into `mafaza` volume `/usr/src/app/public/uploads/` (or re-fetch paths already in DB)
