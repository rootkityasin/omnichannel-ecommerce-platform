# Universal CPU Reduction Playbook

Last updated: 2026-04-08
Audience: Any engineer working on web apps with admin + storefront traffic

## Why this guide exists
This is a practical, reusable guide to reduce high CPU usage in web projects.
It is based on a real optimization cycle where CPU dropped from frequent 100% spikes to stable ~70-80% under heavy load.

## Use this when
- Route switching in admin causes CPU spikes
- Storefront slows down at high concurrency
- Load tests show timeouts or very high p95 latency
- API is fast but page routes are still slow

## Quick rule
Always optimize in this order:
1. Measure first
2. Reduce payload and render work
3. Add caching
4. Scale replicas
5. Re-test with the same load profile

---

## Phase 1: Measure correctly

### 1.1 Baseline test commands
Use the same commands every time so before/after is fair.

Homepage:
```bash
npx autocannon -c 100 -d 60 -p 1 https://your-domain.com/
```

Menu or catalog page:
```bash
npx autocannon -c 100 -d 60 -p 1 https://your-domain.com/menu
```

Critical API endpoint:
```bash
npx autocannon -c 100 -d 60 -p 1 "https://your-domain.com/api/menu?bootstrap=1&limit=18"
```

### 1.2 Do not use unrealistic profile by default
- Avoid high pipelining values for browser-like testing.
- Start with `-p 1`.

### 1.3 Track these 4 metrics
- Timeout/error count
- Average latency
- p95/p99 latency
- App container CPU (and DB CPU)

---

## Phase 2: Admin panel CPU reduction

These changes are usually high impact for internal dashboards.

### 2.1 Reduce repeated client compute
- Memoize filtered/sorted lists.
- Precompute expensive row fields once.
- Replace repeated `array.includes` checks with `Set` lookups.

### 2.2 Reduce heavy bulk operations
- Process bulk updates/deletes in chunks.
- Use `Promise.allSettled` for large batches.

### 2.3 Reduce default table/list pressure
- Lower default page size for heavy admin views.
- Add progressive loading where possible.

### 2.4 Prevent route switch thrash
- Add sidebar click throttling.
- Add route transition loading state to block rapid multi-navigation.

### 2.5 Make admin stats cheaper
- Use rolling windows (example: last 30 days) for dashboard cards.
- Avoid all-history scans on each route load.

---

## Phase 3: Storefront CPU reduction

These changes are usually needed for high-concurrency public traffic.

### 3.1 Make first paint lightweight
- Keep homepage first response minimal (hero + categories).
- Defer heavy sections until after first paint/idle.

### 3.2 Use bootstrap payloads
- Serve compact first-page list payload (small field set).
- Load extra details and larger sets progressively.

### 3.3 Split list payload from detail payload
For list/card views, return only essentials:
- id
- name
- price
- image
- category
- availability

Do not include heavy nested fields in list bootstrap unless needed.

### 3.4 Warm cache in background
- Prefetch key route data after page load + idle time.
- Do not let warmup block first paint.

### 3.5 Add explicit cache headers
Use edge-friendly cache headers on:
- Hot APIs
- High-traffic HTML routes (if safe)

Example:
```http
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

---

## Phase 4: Database and query path

### 4.1 Add indexes for real filters/sorts
Create composite indexes that match actual where + order patterns.

### 4.2 Cache expensive counts
- Cache frequent total counts with short TTL.
- Avoid recalculating counts on every request under high load.

### 4.3 Keep DB pool conservative per replica
When scaling app replicas, reduce per-replica pool max.
Example starting point:
- PG_POOL_MAX=4
- PG_POOL_MIN=1
- PG_POOL_IDLE_MS=10000
- PG_POOL_CONN_TIMEOUT_MS=3000
- PG_STATEMENT_TIMEOUT_MS=12000
- PG_QUERY_TIMEOUT_MS=15000

---

## Phase 5: Runtime scaling

### 5.1 Scale app replicas first
- Move from 1 replica to 2.
- If still needed, go to 3.

### 5.2 Rebalance DB connections after scaling
- Lower per-replica pool max so total DB connections stay safe.

### 5.3 Important for multi-node
If using multiple swarm nodes, configure image registry first.
Without registry, nodes cannot pull built images.

---

## Phase 6: Validation gate (must pass)

Run a 5-minute soak test:

```bash
npx autocannon -c 100 -d 300 -p 1 https://your-domain.com/
npx autocannon -c 100 -d 300 -p 1 https://your-domain.com/menu
```

### Target acceptance
- No timeout spikes
- Stable p95/p99 (no runaway tail)
- CPU no longer pinned at 100% for sustained periods
- Core user flows still work

---

## What worked in this project (summary)

Admin side:
- Memoized expensive list operations
- Precomputed row values
- Chunked bulk operations
- Reduced default list sizes
- Added route-switch guardrails
- Limited heavy stats windows

Storefront side:
- Introduced compact bootstrap API payload
- Cached bootstrap list + count
- Added server-side filtering fallback for large/mobile paths
- Deferred homepage sections load to post-paint
- Delayed background warmup until page load + idle
- Added explicit cache headers for hot APIs and key HTML routes

Infra/runtime side:
- Applied query indexes aligned with real filters/sorts
- Tuned app DB pool limits
- Scaled app replicas
- Re-tested repeatedly with fixed load profiles

---

## Reuse checklist for any project

Copy this checklist into your issue tracker:

- [ ] Capture baseline with fixed autocannon commands
- [ ] Identify top 2 hot routes (admin + storefront)
- [ ] Reduce list payload size (bootstrap + detail split)
- [ ] Memoize client-heavy filters/sorts/maps
- [ ] Add route cache headers where safe
- [ ] Add query-aligned composite indexes
- [ ] Tune DB pool per replica
- [ ] Scale replicas (2 -> 3 if needed)
- [ ] Run 60s tests and 300s soak tests
- [ ] Record final numbers and rollback point

---

## Notes
- Optimize for real user patterns, not only synthetic peaks.
- Keep changes small and measurable.
- Do not declare success until soak tests are stable.
