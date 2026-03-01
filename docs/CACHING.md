# Caching Overview

This project uses a layered caching strategy across the app, client, and edge.
The goal is fast first-load on mobile and instant Home -> Menu transitions.

## 1) App-level caching (Next.js)

We cache the heavy data at the server with `unstable_cache`.

Key locations:

- `app/actions/section.ts`: `getHomeSections` cached with `revalidate: 60`
- `app/actions/product.ts`: `getProducts` cached with `revalidate: 3600`
- `app/actions/menu.ts`: `getMenuData` cached with `revalidate: 600`

These caches reduce DB load and stabilize response times.

## 2) Client-side menu cache (mobile acceleration)

We prefetch menu data on Home and reuse it on Menu.

Flow:

1. Home loads and prefetches menu data in the background.
2. The payload is stored in sessionStorage (10 minutes TTL).
3. It is also stored in Zustand for instant reuse on navigation.

Key locations:

- `components/client/ResourcePrefetcher.tsx`: prefetches `/menu` and `/api/menu`
- `app/api/menu/route.ts`: returns cached menu payload
- `app/actions/menu.ts`: `getMenuData` shared by `/menu` and `/api/menu`
- `components/client/MenuClient.tsx`: uses cached data first
- `lib/menuCache.ts`: sessionStorage TTL (10 minutes)
- `lib/store.ts`: Zustand menu cache

## 3) Edge / browser caching (Cloudflare + Traefik)

We use cache headers and Cloudflare Cache Rules.

### Traefik headers (file provider)

Configured in `/etc/dokploy/traefik/dynamic/middlewares.yml`:

- `cache-html`: `s-maxage=60`, `stale-while-revalidate=600`
- `cache-api`: `s-maxage=600`, `stale-while-revalidate=600`
- `cache-static`: `max-age=31536000, immutable`

These middlewares are attached to the Crab Khai routers in Traefik.

### Cloudflare Cache Rules

Applied in Cloudflare (Rules -> Cache Rules):

1. Static assets

- Match: `/_next/static/*`
- Cache: Everything
- Edge TTL: 1 year

2. Menu API

- Match: `/api/menu*`
- Cache: Everything
- Edge TTL: 10 minutes

3. Never cache private routes (Bypass)

- `/admin*`, `/cart*`, `/checkout*`, `/account*`, `/api/auth*`, `/api/track*`

## 4) What is NOT cached

- Admin pages, checkout, account pages
- Auth APIs and tracking APIs

## 5) How to verify

Use curl to confirm caching headers and Cloudflare status:

```
curl -I https://crabkhai.com/api/menu
curl -I https://crabkhai.com/_next/static/chunks/<REAL_FILE>.js
```

Expected headers:

- `Cache-Control` matches the rule
- `cf-cache-status: HIT` after a second request

## 6) TTL summary

- Home sections (server cache): 60s
- Products list (server cache): 1h
- Menu data (server cache): 10m
- Menu API (edge cache): 10m
- Static assets (edge cache): 1y
- Client menu cache (sessionStorage/Zustand): 10m

## 7) Menu route details

The `/menu` page uses a single cached payload:

- `app/actions/menu.ts` (`getMenuData`) returns `{ products, categories }`
- `/menu` revalidate: 600s
- `/api/menu` uses the same cached payload
