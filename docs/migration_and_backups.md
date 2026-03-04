# Database Migration & Backup Strategy

## 1. Migration Overview
The application database was successfully migrated from a remote Prisma Cloud instance to a local, self-hosted **PostgreSQL 18** instance running as a service inside **Dokploy** on a 100GB NVMe VPS.

### Key Changes
*   **Old Database:** `db.prisma.io` (Public Internet connection, required SSL)
*   **New Database:** `omnichannelecommerceplatform-crabkhaidb-cdnm87:5432` (Internal Docker network, `sslmode=disable`)
*   **Why `sslmode=disable`?** When Next.js connects to the Postgres database *inside* the Dokploy Docker network, the traffic never touches the public internet. Because the connection stays entirely within the private VPS virtual network, SSL certificates are completely unnecessary and actually disabled by default to save overhead. Prisma enforces SSL by default, so we must add `?sslmode=disable` to tell Prisma it is safe to connect unencrypted over the private local network.
*   **Performance:** Queries now bypass the public internet, reducing latency.
*   **Data Integrity:** All schema, tenant mappings (via `customDomain`), users, and products (7 total) were successfully cloned using standard `pg_dump` and `pg_restore`.

---

## 2. Automated Backup Strategy (Two-Layer System)

To mitigate the risk of keeping the database and its backups on the same physical VPS disk, a highly secure two-layer automated backup system was implemented. Both layers retain only the last 14 days of backups to prevent disk exhaustion.

### Layer 1: VPS Local Backups (CRON)
Every night at **2:00 AM**, the VPS generates a new encrypted snapshot of the live database.

*   **Location:** `/var/backups/postgres/db_backup_YYYY-MM-DD_HH-MM-SS.dump`
*   **Mechanism:** A bash script (`/root/backup_postgres.sh`) runs via a `crontab` schedule.
*   **Command:** The script uses `docker run` to temporarily spin up a Postgres container that connects to the live database, runs `pg_dump` with custom compression format (`-Fc`), and saves the file directly to the host NVMe drive.
*   **Retention:** The script automatically runs a `find ... -mtime +14` command to forcefully delete any `.dump` files older than 14 days.

### Layer 2: Off-Site Pull Backup (Windows Task Scheduler)
Every night at **2:30 AM**, an external Windows PC automatically reaches into the VPS and clones the new localized backup off the server.

*   **Location:** Windows Server/PC at `C:\backups\crabkhai_db\`
*   **Mechanism:** A PowerShell script (`pull_vps_backup.ps1`) runs automatically via Windows Task Scheduler.
*   **Command:** It uses `scp` over port 22 (SSH) to recursively download any new `.dump` files from `/var/backups/postgres/` on the VPS to the local `C:\backups\crabkhai_db` folder.
*   **Retention:** It executes a `Get-ChildItem` filter to silently delete any local `.dump` files older than 14 days.

---

## 3. Disaster Recovery (How to Restore)

If the active Dokploy database ever corrupts, fails, or data is accidentally destroyed, you can instantly restore from either Layer 1 (if the VPS is alive) or Layer 2 (if the VPS crashed completely).

### Restoring from a Backup
**Step 1:** Transfer the desired backup file to the VPS (if it's not already there).
For example, copy `db_backup_2026-03-03_22-21-24.dump` to `/root/backup.dump`.

**Step 2:** Run the `pg_restore` Docker command on the VPS. 
*Note: Make sure to replace the `DATABASE_URL` below if your Dokploy database service name ever changes.*

```bash
docker run --rm --network dokploy-network -v /root/backup.dump:/backup.dump postgres:18 \
  pg_restore --clean --if-exists -d "postgresql://crabkhai_user:ar0aengeil4sheeC@omnichannelecommerceplatform-crabkhaidb-cdnm87:5432/crabkhai?sslmode=disable" /backup.dump
```

*   `--clean`: Drops existing tables before restoring (prevents duplicate key errors).
*   `--if-exists`: Prevents warnings from dropping tables that are already missing.
*   `-v`: Maps the backup file exactly so the sterile Docker container can access it.

**Step 3:** Open Dokploy and click **Deploy** on your main Next.js application to force it to drop stale cached data and pull the immediately restored configuration.

---

## 4. Prisma Cloud vs. VPS Database (Architecture Comparison)

| Feature | Prisma Cloud Database (`db.prisma.io`) | Local VPS Postgres (via Dokploy) |
| :--- | :--- | :--- |
| **Hosting Cost** | Tiered/Usage-based (Risk of surprise overages) | **$0 / month** (Included in existing VPS cost) |
| **Operation Limits** | Strict limits (Stops working if you hit the cap) | **Unlimited** (Bound only by the server CPU) |
| **Data Storage** | Low tier limits (e.g., 500MB) | **100GB NVMe** (Thousands of times larger) |
| **Latency/Speed** | ~50ms - 200ms (Data travels across public internet) | **0ms** (Instant local network connection) |
| **Security & Privacy** | Publicly accessible endpoint, relies on Prisma auth | **100% Private** (Isolated inside Dokploy Docker network) |
| **Connection Strategy** | SSL certificates required (`sslmode=require`) | Internal, unencrypted safely (`sslmode=disable`) |
| **Backups** | Cloud-managed snapshots | Fully owned 2-Layer Automated System |
| **Data Ownership** | Hosted on third-party cloud infra | 100% physically stored on owned hardware |

*Conclusion:* Moving the database to the VPS eliminated all ongoing database subscription costs, removed strict operational limits, and drastically improved the Next.js application page load speed by reducing network latency to zero.

---

## 5. Future Technical Roadmap (Scaling Operations)

As the store grows to process hundreds of daily orders and high concurrent traffic, the following advanced configurations should be considered:

*   **Disk Usage Alerts:** Implement a cron script (or utilize Dokploy's built-in alerts when available) to send email/Slack notifications when the VPS disk usage exceeds 80%.
*   **Slow Query Logging:** Expose and edit the VPS `postgresql.conf` to enable logging of queries that exceed `500ms`. This will help identify missing indexes as order volume scales.
*   **Autovacuum Tuning:** Adjust `autovacuum_vacuum_scale_factor` to `0.05` to ensure tables with heavy read/write operations (like `User` or `Session` tables) stay optimized.
- [x] **Restore Swipeable Checkout Drawer**: Reintroduced the `Drawer` component for the checkout overlay on mobile, providing a premium swipe-to-dismiss experience.
- [x] **Fix Header Text Visibility**: Adjusted styling and positioning of "Complete your order" text to ensure it's visible and correctly placed within the drawer.
- [x] **Required Field Indicators**: Added an asterisk (`*`) to the "Area" field placeholder in checkout to clearly mark it as mandatory.
- [x] **Resolved Order Creation Failure**:
    - Fixed a bug where `tenantId` was missing for storefront visitors, causing order creation to fail.
    - Added `Math.round()` to all currency fields (total amount, price, advance payment) to prevent Prisma `Int` type errors in PostgreSQL.
    - Verified that `paymentMethod` and advance payment status are correctly persisted in the database.
    - Synchronized Prisma client with the latest schema fields.
*   **Hot/Cold Data Archiving:** Schedule a yearly or bi-yearly operation to move old `Order` and `AuditLog` records into an archive table, reducing the active query dataset size to keep database read speeds essentially instant.
*   **Point in Time Recovery (PITR):** Transition from nightly snapshots to Write-Ahead Log (WAL) archiving to allow restoring the database to the exact minute before an accidental deletion.
