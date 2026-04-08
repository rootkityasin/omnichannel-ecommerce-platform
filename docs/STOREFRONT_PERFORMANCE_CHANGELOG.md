# Storefront Performance Changelog

Last updated: 2026-04-08
Owner: Storefront scaling track

## Goal
Keep storefront responsive for high concurrent reads (target: ~100 concurrent users) with predictable CPU usage and cache-friendly request paths.

## Implemented Changes

### 1. Existing baseline protections (already present before latest pass)
- ISR on key storefront pages.
- Action-level caching via unstable_cache for menu, tenant, categories, and related reads.
- Tag-based cache invalidation paths.

### 2. Homepage SEO copy caching
- Added cached homepage SEO copy lookup using unstable_cache.
- Added explicit tag invalidation for homepage SEO copy updates.
- Result: removes uncached repeated DB read on home path.

### 3. Menu API cache headers
- Added explicit Cache-Control headers for menu API:
  - full menu path: public, s-maxage=60, stale-while-revalidate=600
  - filtered path: public, s-maxage=30, stale-while-revalidate=120
- Result: better CDN/proxy cache behavior and reduced origin hits.

### 4. Large-catalog server-side filtering fallback
- Added filtered menu action and API path with:
  - category/filter/section/search parameters
  - server-side sorting for best-sellers/new-arrivals/default
  - paginated result limit/offset with safe clamps
  - total count return for load-more UX
- Menu client now auto-switches to server filtering when catalog size is large (threshold: 120 products), while keeping existing local filtering for smaller catalogs.
- Result: significantly lower client-side filter/sort CPU for large catalogs.

### 5. Minor client cleanup
- Removed unused router dependency in resource prefetcher effect to reduce unnecessary effect coupling.

## Validation Snapshot
- Changed-file diagnostics: no errors.
- ESLint on changed files: clean.
- Tests: vitest passing on current suite.

## Operational Notes
- Tune SERVER_FILTER_THRESHOLD based on real catalog size and response latency.
- Keep menu API cache headers aligned with freshness requirements.
- Re-profile after major menu UI/filter logic changes.

## Maintenance Checklist (update this file when changed)
- Add date and short summary under a new "Update" section.
- List changed files and expected runtime impact.
- Attach profile comparison evidence (before vs after).
- Note any cache invalidation/tag updates required.

## Update Log
### 2026-04-08
- Created this storefront performance changelog and documented cache/path optimizations including server-side filtering fallback.
