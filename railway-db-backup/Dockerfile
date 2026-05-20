# One-shot Postgres dump -> Google Drive (rclone). Use with Railway Cron.
FROM postgres:18-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends rclone ca-certificates bash curl \
  && rm -rf /var/lib/apt/lists/*

COPY backup.sh /backup.sh
RUN sed -i 's/\r$//' /backup.sh && chmod +x /backup.sh

CMD ["/backup.sh"]
