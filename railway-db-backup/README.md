# Railway Postgres → Google Drive backup

Docker image that runs **`pg_dump | gzip`** once and **`rclone copy`** into Drive, then **exits** (required by [Railway Cron](https://docs.railway.com/cron-jobs)).

## Railway setup

1. **New service** → deploy this repo → set **Root Directory** to `railway-db-backup`.
2. **Variables**
   - **`DATABASE_URL`**: reference the variable from your **Railway Postgres** service (same project; internal URL is fine).
   - **`RCLONE_CONFIG_B64`**: base64 of your local `%APPDATA%\rclone\rclone.conf` (single line). PowerShell:

     ```powershell
     [Convert]::ToBase64String(
       [IO.File]::ReadAllBytes("$env:APPDATA\rclone\rclone.conf")
     ) | Set-Clipboard
     ```

   - Optional **`RCLONE_REMOTE`**: default `gdrive:` (must match the remote name inside `rclone.conf`).
3. **Cron**: defined in `railway.toml` (`cronSchedule`) or set **Settings → Cron Schedule** in Railway (UTC). Remove duplicate if both are set.
4. Deploy and check **Logs** for `backup.sh: done`. Confirm the `.sql.gz` in your Drive folder.

If **`RCLONE_CONFIG_B64`** is awkward, paste the full file into **`RCLONE_CONFIG`** instead (multiline).

## `pg_dump` / SSL

If the dump fails with SSL errors, append **`?sslmode=require`** to `DATABASE_URL` in Railway (Postgres plugin dependent).
