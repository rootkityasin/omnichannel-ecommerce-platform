CPU Reduction Playbook
Last updated: 2026-04-09
For: Developers with basic coding knowledge

================================================================================

WHAT THIS IS FOR

If your admin panel or storefront is spiking CPU under load, this guide walks
you through fixing it — step by step. It applies to any web stack (Next.js,
React, Node, etc.).

The order matters. Don't skip ahead.

================================================================================

THE PROCESS, IN SHORT

Measure first. Then make pages lighter, add caching, fix slow queries, and
scale replicas only if you still need to. Test again at the end with the same
commands you started with.

================================================================================

STEP 1 — MEASURE BEFORE TOUCHING ANYTHING

Run these load tests first. You need a baseline to compare against later.

  npx autocannon -c 100 -d 60 -p 1 https://your-domain.com/
  npx autocannon -c 100 -d 60 -p 1 https://your-domain.com/menu
  npx autocannon -c 100 -d 60 -p 1 "https://your-domain.com/api/menu?bootstrap=1&limit=18"

While tests run, watch: timeout/error count, average latency, p95/p99 latency,
and CPU usage on both the app and the database. Keep -p 1 to simulate real
browser behavior.

================================================================================

STEP 2 — FIX ADMIN CPU SPIKES

Admin panels usually spike because of heavy table rendering and bulk operations.
The quick wins here are:

Memoize any filter, sort, or map logic that runs on large datasets. Precompute
expensive row values once instead of recalculating on every render. If you're
doing repeated includes() checks, swap those out for a Set — it's faster at
scale. Process bulk updates and deletes in chunks rather than all at once.
Lower your default table page size so fewer rows load per view. Add click
throttling on sidebar navigation to avoid rapid route switches hammering the
server. For dashboard stats, use rolling time windows (e.g. last 30 days)
instead of scanning full history.

================================================================================

STEP 3 — FIX STOREFRONT CPU USAGE

This is where the highest impact usually is. The goal is to keep the first
response small and load heavier content afterward.

Send a compact payload on first load — don't include everything upfront. Defer
heavy homepage sections until after the first paint. For list pages, use a
lightweight bootstrap API payload and keep detail data separate. Prefetch or
warm the menu cache only after the page has loaded and the browser is idle. Add
cache headers to your hot API routes and high-traffic HTML pages.

A good cache header for list APIs looks like this:

  Cache-Control: public, s-maxage=60, stale-while-revalidate=300

For list and card APIs, only return the fields you actually need:
id, name, price, image, category, availability.
Strip out anything nested or heavy that isn't used in the list view.

================================================================================

STEP 4 — FIX DATABASE QUERIES

Start by adding composite indexes that match your real filter and sort patterns
— don't guess, check your actual query logs. Cache expensive count() queries
instead of running them on every request. Keep your connection pool conservative
per replica.

Reasonable starting values:

  PG_POOL_MAX=4
  PG_POOL_MIN=1
  PG_POOL_IDLE_MS=10000
  PG_POOL_CONN_TIMEOUT_MS=3000
  PG_STATEMENT_TIMEOUT_MS=12000
  PG_QUERY_TIMEOUT_MS=15000

================================================================================

STEP 5 — SCALE REPLICAS (ONLY IF NEEDED)

Start with 2 replicas. If that's not enough, move to 3. When you add replicas,
lower PG_POOL_MAX per replica so the total number of DB connections stays within
safe limits.

If you're on a multi-node swarm, set up an image registry first. Nodes can't
pull images without one.

================================================================================

STEP 6 — VALIDATE WITH A LONGER SOAK TEST

Once everything is in place, run 5-minute load tests:

  npx autocannon -c 100 -d 300 -p 1 https://your-domain.com/
  npx autocannon -c 100 -d 300 -p 1 https://your-domain.com/menu

You're looking for: no timeout spikes, stable p95/p99, CPU that doesn't stay
pegged at 100%, and all core flows still working correctly.

================================================================================

WHAT ACTUALLY WORKED (REFERENCE)

Admin:
  - Memoization on heavy tables
  - Chunked bulk operations
  - Route-switch throttling
  - Smaller default page sizes
  - Rolling-window dashboard metrics

Storefront:
  - Compact bootstrap API
  - Cached list + count
  - Server-side filtering for mobile
  - Deferred homepage sections
  - Background warmup delayed until page-load + idle
  - Cache headers on API and HTML routes

Infrastructure:
  - Query-aligned DB indexes
  - Conservative pool settings
  - Replica scaling
  - Repeated before/after load testing

================================================================================

REUSE CHECKLIST

  [ ] Run baseline load tests
  [ ] Identify hot routes (admin + storefront)
  [ ] Shrink first-load payloads
  [ ] Add caching where missing
  [ ] Add or verify DB indexes
  [ ] Tune DB pool settings
  [ ] Scale replicas if needed
  [ ] Run 60s and 300s load tests
  [ ] Record final numbers

Done means: stable latency, low error rate, and no sustained CPU saturation.
