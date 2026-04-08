Universal Caching Guide (CPU Spike Focus)
Last updated: 2026-04-09

================================================================================

WHAT THIS IS FOR

Caching reduces CPU spikes by serving repeat traffic from cache instead of
recomputing the same work on every request. This guide covers caching across
four layers so that if one layer misses, another can still protect your CPU.

The four layers are:
  1. App cache (server functions)
  2. API cache headers
  3. HTML/page cache headers
  4. Client warm cache (for fast route transitions)

================================================================================

LAYER 1 — APP CACHE (SERVER-SIDE)

Cache heavy database queries directly in your server code. In Next.js, for
example, you can use unstable_cache for this.

Start with these three things:
  - Home sections data
  - Menu / bootstrap list data
  - Expensive count() queries

Why it helps: repeated reads get served from memory or edge cache instead of
hitting the database fresh every time.

================================================================================

LAYER 2 — API CACHE HEADERS

Add explicit Cache-Control headers on all read-only endpoints. A good default
for hot API routes:

  Cache-Control: public, s-maxage=60, stale-while-revalidate=300

Use shorter TTLs for highly dynamic endpoints and longer TTLs for stable ones.

================================================================================

LAYER 3 — HTML / PAGE CACHE HEADERS

For anonymous public pages like / and /menu, add page-level cache headers too.

Why it helps: even if your API is cached, rendering the HTML page still burns
CPU. Caching the HTML at the edge reduces how often your origin server has to
render anything at all.

Do NOT cache private pages — admin, account, checkout, and auth routes should
always bypass the cache.

================================================================================

LAYER 4 — CLIENT WARM CACHE (UX BOOST)

After the homepage finishes loading, prefetch the next likely route's data in
the background during idle time.

Three rules to follow:
  - Only prefetch after page load and browser idle — never block first paint.
  - Keep a short client-side TTL (10 minutes is a reasonable default).
  - Never let prefetch delay or interfere with the initial render.

================================================================================

WHAT WE CACHE IN THIS PROJECT (CURRENT)

App-level:
  - Home sections data        — revalidate every 60s
  - Full menu data            — revalidate every 600s
  - Bootstrap menu products   — revalidate every 60s
  - Bootstrap menu count      — revalidate every 300s

API-level:
  - /api/menu (full, filtered, bootstrap)  — explicit cache headers
  - /api/home-sections                     — explicit cache headers

HTML-level:
  - /        — cache headers enabled
  - /menu    — cache headers enabled

Client-level:
  - Menu cache stored in sessionStorage + Zustand
  - Warmed from the homepage in background after load + idle

================================================================================

WHAT SHOULD NOT BE CACHED

Never cache these routes at the edge:

  - /admin*
  - /account*
  - /checkout*
  - /api/auth*
  - Any user-specific or sensitive API

================================================================================

HOW TO VERIFY QUICKLY

Check response headers with curl:

  curl -I https://your-domain.com/
  curl -I https://your-domain.com/menu
  curl -I "https://your-domain.com/api/menu?bootstrap=1&limit=18"

On Cloudflare, check the cf-cache-status header:
  - First request will likely be MISS
  - Subsequent requests should show HIT

If you keep seeing MISS, review your cache rules and check for bypass conditions
that might be overriding the headers.

================================================================================

CPU SPIKE TROUBLESHOOTING (SIMPLE)

If CPU is still spiking after caching is set up, work through this list:

  1. Confirm / and /menu have cache headers set correctly.
  2. Confirm API responses are compact — bootstrap payloads should be small.
  3. Confirm the edge cache is actually hitting (cf-cache-status: HIT).
  4. Defer heavy homepage sections until after the first paint.
  5. Scale app replicas and reduce DB pool size per replica accordingly.

================================================================================

REUSABLE CHECKLIST FOR ANY PROJECT

  [ ] Add app-level cache for heavy read queries
  [ ] Add API cache headers for public GET routes
  [ ] Add HTML cache headers for public pages
  [ ] Add background prefetch after load + idle
  [ ] Exclude admin / auth / private routes from cache
  [ ] Verify HIT/MISS behavior with curl
  [ ] Re-test under load with the same command profile

Done means: lower CPU, stable latency, and fewer timeouts under the same load.
