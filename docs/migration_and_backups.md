# Database Migration & Backup Strategy

## 1. Migration Summary
Database migrated from **Prisma Cloud** (db.prisma.io) to **PostgreSQL 18** in Dokploy on VPS.

**Connection String Change:**
- Old: `db.prisma.io` with SSL required
- New: `omnichannelecommerceplatform-crabkhaidb-cdnm87:5432` with `?sslmode=disable` (internal network)

**Benefits:**
- Eliminated monthly database subscription costs
- Removed operational limits (now limited only by VPS CPU/storage)
- Reduced query latency from 50-200ms to ~0ms (local network only)

## 2. Automated Backup Strategy (Two-Layer System)

**Overview:** Database backed up nightly at 2:00 AM (local VPS) and 2:30 AM (off-site Windows pull).

### Layer 1: VPS Local Backups
**Step 1 — Automatic Nightly Snapshot (2:00 AM)**
- Bash script `/root/backup_postgres.sh` runs via crontab
- Creates encrypted dump: `/var/backups/postgres/db_backup_YYYY-MM-DD_HH-MM-SS.dump`
- Uses `docker run` to spin up temporary Postgres container
- Compresses with `pg_dump -Fc` format

**Step 2 — Retention Management**
- Backups older than 14 days auto-deleted by cron job
- Prevents disk exhaustion on NVMe

### Layer 2: Off-Site Windows Backup (External Safety)
**Step 1 — Automatic Nightly Pull (2:30 AM)**
- PowerShell script runs via Windows Task Scheduler
- Uses `scp` over SSH port 22 to pull dumps from VPS

**Step 2 — Local Storage**
- Backups saved to Windows at `C:\backups\crabkhai_db\`
- Backups older than 14 days auto-deleted locally

## 3. Disaster Recovery (Restore Procedure)

**When to restore:** Database corruption, accidental deletion, or VPS failure.

**Step 1 — Locate backup file**
- From Layer 1 (VPS): `/var/backups/postgres/db_backup_*.dump`
- From Layer 2 (Windows): `C:\backups\crabkhai_db\db_backup_*.dump`

**Step 2 — Copy backup to VPS**
Transfer the chosen backup to `/root/backup.dump` on the VPS.

**Step 3 — Run restore command**
```bash
docker run --rm --network dokploy-network -v /root/backup.dump:/backup.dump postgres:18 \
  pg_restore --clean --if-exists -d "postgresql://<db_user>:<db_password>@<db_host>:5432/<db_name>?sslmode=disable" /backup.dump
```

**Step 4 — Redeploy application**
Open Dokploy and click **Deploy** on your Next.js application to clear stale cache and activate restored data.

## 4. Scaling Considerations

As traffic increases, implement these optimizations:

- **Disk Alerts:** Add cron script to email/Slack when VPS disk exceeds 80%
- **Slow Query Logging:** Enable `log_min_duration_statement = 500` in PostgreSQL config to identify missing indexes
- **Autovacuum Tuning:** Reduce `autovacuum_vacuum_scale_factor` to `0.05` for high-traffic tables (Users, Sessions, Orders)
- **Data Archiving:** Move orders and audit logs older than 1-2 years to archive tables
- **Point-in-Time Recovery (PITR):** Switch from nightly snapshots to WAL archiving for recovery to exact minute
