# VPS CPU Profiling

Use this when admin browsing spikes CPU on the VPS.

## Goal

Identify whether the spike comes from:

- Next.js app container
- PostgreSQL container
- Traefik proxy

## Run on the VPS host

```bash
bash scripts/profile-vps-hotspots.sh
```

Then immediately reproduce the problem in the admin panel for ~30 seconds.

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

## Current baseline

The last idle measurement showed:

- CrabKhai app low CPU
- CrabKhai DB low CPU
- overall VPS healthy

That means you need to sample _during_ the admin browsing spike to identify the real hotspot.
