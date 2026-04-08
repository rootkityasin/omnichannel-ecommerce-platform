# Phase 3: DB + Dockploy Tuning (Hostinger KVM2)

This runbook is for reducing CPU saturation when admin users switch between Dashboard, Orders, Products, and Customers.

## Scope

- Single VPS host (KVM2)
- App and PostgreSQL running on same Dockploy host
- Goal: stable CPU and lower latency under admin navigation bursts

## 1) App-side guardrails already added

Connection pool guardrails are now configurable in `lib/prisma.ts`.

Environment variables:

- `PG_POOL_MAX` (default `10`)
- `PG_POOL_MIN` (default `1`)
- `PG_POOL_IDLE_MS` (default `15000`)
- `PG_POOL_CONN_TIMEOUT_MS` (default `5000`)
- `PG_STATEMENT_TIMEOUT_MS` (default `15000`)
- `PG_QUERY_TIMEOUT_MS` (default `20000`)

Suggested starting values for KVM2:

- `PG_POOL_MAX=6`
- `PG_POOL_MIN=1`
- `PG_POOL_IDLE_MS=10000`
- `PG_POOL_CONN_TIMEOUT_MS=4000`
- `PG_STATEMENT_TIMEOUT_MS=12000`
- `PG_QUERY_TIMEOUT_MS=15000`

Why this helps:

- Prevents app from over-saturating DB connections on a small host
- Fails slow or blocked queries faster instead of piling up CPU

## 2) Dockploy resource controls

Set explicit container limits/reservations in Dockploy service settings.

### App container

- CPU limit: `1.0`
- CPU reservation: `0.35`
- Memory limit: `1.2G`
- Memory reservation: `512M`

### PostgreSQL container

- CPU limit: `1.0`
- CPU reservation: `0.35`
- Memory limit: `1.2G`
- Memory reservation: `512M`

Notes:

- Keep total limits below host capacity with headroom for Dockploy, Traefik, and OS.
- If swap usage grows, lower limits and reduce app concurrency first.

## 3) PostgreSQL runtime tuning

Apply conservative settings in `postgresql.conf` (or equivalent env/config in your Postgres container):

- `shared_buffers = 512MB`
- `effective_cache_size = 1536MB`
- `work_mem = 8MB`
- `maintenance_work_mem = 128MB`
- `max_connections = 80`
- `checkpoint_completion_target = 0.9`
- `wal_compression = on`
- `random_page_cost = 1.1`
- `effective_io_concurrency = 200`
- `track_io_timing = on`

For autovacuum on active order tables:

- `autovacuum_vacuum_scale_factor = 0.05`
- `autovacuum_analyze_scale_factor = 0.03`

Slow-query logging:

- `log_min_duration_statement = 500`
- `log_checkpoints = on`
- `log_lock_waits = on`

After changing settings, restart only the DB container first, then app.

## 4) Validation sequence (required)

1. Apply index script (if not already applied):

```bash
node scripts/apply-performance-indexes.js
```

2. Run profiling baseline/post-change:

```bash
export PGPASSWORD="your-db-password"
bash scripts/profile-vps-hotspots.sh
```

3. During the 30s sample, reproduce exact sequence:

- Dashboard -> Orders -> Products -> Customers -> Dashboard

4. Compare before vs after:

- app container peak CPU and sustained CPU
- db container peak CPU and sustained CPU
- number of active non-idle queries

## 5) Acceptance criteria

- No sustained 100% CPU during route switching
- Fewer long-running active DB queries during profile window
- Admin navigation remains responsive without functional regressions

## 6) Rollback plan

- Revert pool env values to previous defaults
- Revert Postgres runtime settings to previous snapshot
- Re-deploy app only after DB returns healthy

## 7) Optional next step if CPU still spikes

- Move PostgreSQL off the app host (managed DB or separate VPS) to remove CPU contention between Node and Postgres.
