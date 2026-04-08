# VPS CPU Profiling

Use this when admin browsing spikes CPU on the VPS.

## Goal

Identify whether the spike comes from:

- Next.js app container
- PostgreSQL container
- Traefik proxy

## Run on the VPS host

```bash
export PGPASSWORD="your-db-password"
bash scripts/profile-vps-hotspots.sh
```

Alternative (no export needed):

```bash
bash scripts/profile-vps-hotspots.sh "your-db-password"
```

Or:

```bash
DB_PASSWORD="your-db-password" bash scripts/profile-vps-hotspots.sh
```

If no password is provided, the script will prompt you securely.

Optional tuning for longer captures and custom output path:

```bash
export PGPASSWORD="your-db-password"
SAMPLES=60 OUTPUT_DIR=./artifacts/perf bash scripts/profile-vps-hotspots.sh
```

Do not commit the database password into scripts or docs.

Then immediately reproduce the problem in the admin panel for ~30 seconds.

## Output artifacts

Each run now writes timestamped artifacts:

- Detailed log: `artifacts/perf/profile-YYYYMMDD-HHMMSS.log`
- Auto summary: `artifacts/perf/profile-YYYYMMDD-HHMMSS.summary.txt`

Summary includes:

- Peak app container CPU
- Peak DB container CPU
- Peak proxy CPU
- Top active query signatures during sampling

## What the script shows

- Docker CPU / memory / network for:
  - app container
  - DB container
  - Traefik
- Active Postgres queries from `pg_stat_activity`

## How to interpret

- If app CPU spikes but DB stays low:
  - main issue is server rendering / hydration / too much data loaded in one request
- If DB CPU spikes and `pg_stat_activity` shows heavy queries:
  - main issue is Prisma/Postgres query cost
- If Traefik spikes:
  - issue is mostly proxy/network level, not app code

Additional host signals are now captured per sample:

- load average
- available memory (KB)

## Current baseline

The last idle measurement showed:

- CrabKhai app low CPU
- CrabKhai DB low CPU
- overall VPS healthy

That means you need to sample _during_ the admin browsing spike to identify the real hotspot.
