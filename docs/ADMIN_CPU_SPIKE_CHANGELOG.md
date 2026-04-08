# Admin CPU Spike Changelog

Last updated: 2026-04-08
Owner: Performance remediation track

## Goal
Reduce app-container CPU spikes during rapid admin navigation and high-churn list operations (dashboard, orders, products, customers).

## Implemented Changes

### 1. Admin route-switch guardrails
- Added rapid-click throttling in admin sidebar navigation.
- Added global route transition overlay for clearer state during route changes.
- Result: fewer overlapping route transitions and less render thrash under rapid switching.

### 2. Customers page optimization
- Consolidated duplicate heavy customer/account-user scans into a shared dataset path.
- Memoized derived client-side filtered/sorted views.
- Reduced repeated compute and render churn in customer list interactions.

### 3. Orders page optimization
- Introduced precomputed row fields for expensive display logic.
- Replaced repeated array lookups with Set-based checks for suspect/blocked states.
- Bulk update/delete now uses chunked Promise.allSettled to avoid large single bursts.
- Reduced default list/page limit (50 -> 20) for lower per-view render/query cost.

### 4. Products page optimization
- Memoized board product mapping to reduce remap churn.
- Bulk move/delete now chunked with partial-failure reporting.
- Reduced default list/page limit (50 -> 20).

### 5. Admin stats and dashboard cost reduction
- Orders and dashboard metrics moved to rolling window (30-day) computations for hot paths.
- UI labels updated to match rolling-window behavior.

### 6. DB pool guardrails (app-side)
- Added env-driven pool and timeout controls in Prisma connection setup.
- Tuned defaults for mixed app + db load on VPS.
- Current defaults:
  - PG_POOL_MAX=8
  - PG_POOL_MIN=1
  - PG_POOL_IDLE_MS=15000
  - PG_POOL_CONN_TIMEOUT_MS=3000
  - PG_STATEMENT_TIMEOUT_MS=12000
  - PG_QUERY_TIMEOUT_MS=15000

## Validation Snapshot
- Local lint: passed during remediation iterations.
- Tests: vitest passing on current suite.
- VPS profiling evidence: DB remained low while app CPU spiked during rapid click stress, confirming app-side bottlenecks.

## Operational Notes
- Keep page-size defaults conservative on admin heavy lists.
- Keep chunk sizes in bulk operations moderate.
- Re-profile after major UI/route lifecycle changes.

## Maintenance Checklist (update this file when changed)
- Add date and short summary under a new "Update" section.
- Record changed files and why the change lowers CPU.
- Record validation evidence (lint/tests/profile summary).
- Record rollback notes if behavior regression appears.

## Update Log
### 2026-04-08
- Created this admin CPU spike changelog and backfilled all remediation work completed in this cycle.
