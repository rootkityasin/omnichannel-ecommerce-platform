# Bug Report & Step-by-Step Remediation Plan

**Scope:** Full project analysis. **No code has been changed.** This document lists suspected bugs and a planned remediation order.

---

## Summary

| Category | Count | Severity focus |
|----------|--------|----------------|
| Tenant isolation / IDOR | 12+ | Critical |
| Client-supplied tenantId | 2 | Critical |
| Wrong/invalid revalidatePath | 1 | Low |
| Missing tenant filter (reviews) | 2 | High |
| SKU generation cross-tenant | 1 | Medium |

---

## 1. Tenant isolation & IDOR (Identity-based access)

### 1.1 Product: fetch by ID without tenant check

- **`app/actions/product.ts`**
  - **`getProduct(id)`** (lines ~171–188): Fetches product by `id` only. Any user can load any tenant’s product (e.g. on `/buy/[productId]`).
  - **`getProductById(id)`** (lines ~90–104): Same issue; used in admin. Admin of Tenant A could load/edit product of Tenant B.
- **Impact:** Cross-tenant data leak (public) and cross-tenant admin access.

### 1.2 Product: mutations by ID without tenant check

- **`app/actions/product.ts`**
  - **`updateProduct(id, data)`** (~250–285): No check that `product.tenantId === session.tenantId`. Any admin can update any product.
  - **`deleteProduct(id)`** (~287–320): Same.
  - **`deleteArchivedProduct(id)`** (~322–364): Same.
  - **`archiveProduct(id)`** (~366–385): Same.
  - **`unarchiveProduct(id)`** (~387–406): Same.
- **Impact:** Cross-tenant product modification/deletion.

### 1.3 Order: admin actions by orderId without tenant check

- **`app/actions/order.ts`**
  - **`updateAdminOrder(id, updates)`** (~311–341): Finds order by `orderId` only. No check that `order.tenantId === session.tenantId`.
  - **`deleteAdminOrder(id)`** (~342–365): Same.
  - **`printOrderInvoice(orderId)`** (~367–435): Same. Also performs stock deduction; any admin could print and deduct stock for another tenant’s order.
- **Impact:** Cross-tenant order update/delete and invoice/stock manipulation.

### 1.4 Receipt & invoice pages: order by ID without tenant/domain check

- **`app/[domain]/orders/receipt/[id]/page.tsx`** (lines ~17–22): Fetches order by `orderId` only. Does not verify that the order belongs to the current `domain`/tenant. Anyone with an order ID could view any tenant’s receipt via `/{domain}/orders/receipt/{orderId}`.
- **`app/[domain]/admin/orders/print/[id]/page.tsx`** (lines ~15–22): Fetches order by `orderId` and uses `getAdminSiteConfig()` (session-scoped). Order fetch does not filter by `tenantId`; admin could print another tenant’s invoice if they know the order ID.
- **Impact:** Cross-tenant receipt viewing and admin invoice access.

---

## 2. Client-supplied `tenantId` (trusting request body)

- **`app/actions/order.ts`**
  - **`createOrder(data)`** (lines ~39–43): Uses `data.tenantId` if provided, otherwise session. A client could send a forged `tenantId` and create orders for another tenant.
  - **`upsertIncompleteOrder(data)`** (lines ~168–173): Same pattern.
- **Impact:** Order creation (and draft creation) for another tenant; possible abuse (spam, wrong tenant attribution).

---

## 3. Reviews: no tenant scope

- **`app/actions/review.ts`**
  - **`getAdminReviews()`** (lines ~6–24): `prisma.review.findMany` with no `where` clause. Returns reviews for all tenants.
  - **`deleteReview(id)`** (lines ~44–54): Deletes by review `id` only. No check that the review belongs to the current tenant (or that the user is admin for that tenant).
- **Impact:** Admins see other tenants’ reviews; any authenticated user could delete any review (if they can call the action with an id).

---

## 4. Create review: no product/tenant validation

- **`app/actions/review.ts`** – **`createReview(productId, ...)`** (lines ~56–87): Does not verify that `productId` exists or belongs to the current tenant. Could attach reviews to wrong product or invalid IDs (depending on DB constraints).
- **Impact:** Data integrity and possible cross-tenant association if product IDs are guessable.

---

## 5. SKU generation: cross-tenant

- **`app/actions/product.ts`** – **`generateUniqueSku()`** (lines ~414–432): `prisma.product.findMany({ select: { sku: true } })` with no `where: { tenantId }`. Uses SKUs from all tenants; next SKU can collide with another tenant’s and is not tenant-unique.
- **Impact:** SKU collision across tenants; wrong “max” when multiple tenants use numeric SKUs.

---

## 6. RevalidatePath: wrong path

- **`app/actions/review.ts`** (line ~78): `revalidatePath('/app/(client)/buy/[productId]')`. The app’s client product page is under `[domain]`, e.g. `/[domain]/(client)/buy/[productId]`. This path is unlikely to match Next.js’ internal route and may never revalidate the product page.
- **Impact:** Product page cache not invalidated after new review.

---

## Step-by-step remediation plan (no changes applied yet)

### Phase 1 – Critical: tenant isolation and client trust

1. **Order actions – stop trusting client `tenantId`**
   - In `createOrder` and `upsertIncompleteOrder`, always set `tenantId` from session (and optionally from domain resolution for public checkout). Remove use of `data.tenantId` for authorization; if needed for display only, treat as untrusted and overwrite with server-resolved tenant.
   - Files: `app/actions/order.ts`.

2. **Product – scope read by tenant**
   - For **`getProduct(id)`**: Resolve tenant from request (e.g. domain from headers or passed in) or from session; then fetch with `where: { id, tenantId }`. If no tenant context on public route, require domain (or equivalent) so product is always tenant-scoped.
   - For **`getProductById(id)`**: Require session; add `where: { id, tenantId: session.tenantId }` (or equivalent for SUPER_ADMIN if you support it).
   - Files: `app/actions/product.ts`.

3. **Product – scope mutations by tenant**
   - For **`updateProduct`**, **`deleteProduct`**, **`deleteArchivedProduct`**, **`archiveProduct`**, **`unarchiveProduct`**: Resolve `tenantId` from session; fetch product with `where: { id, tenantId }` first (or use a single update/delete with `where: { id, tenantId }`). Return 404/403 if not found or not allowed.
   - Files: `app/actions/product.ts`.

4. **Order – scope admin actions by tenant**
   - For **`updateAdminOrder`**, **`deleteAdminOrder`**, **`printOrderInvoice`**: Resolve `tenantId` from session; fetch order with `where: { orderId: id, tenantId }`. If no order found, return 404/403. Then perform update/delete/print and stock deduction only for that order.
   - Files: `app/actions/order.ts`.

5. **Receipt page – bind order to domain/tenant**
   - In **`app/[domain]/orders/receipt/[id]/page.tsx`**: Resolve tenant from `domain` (e.g. `getTenantByDomain(domain)`). Fetch order with `where: { orderId: id, tenantId }`. If no order or tenant mismatch, return `notFound()`.
   - File: `app/[domain]/orders/receipt/[id]/page.tsx`.

6. **Admin invoice print page – scope by tenant**
   - In **`app/[domain]/admin/orders/print/[id]/page.tsx`**: Get `tenantId` from session (or from domain if you use domain for admin). Fetch order with `where: { orderId: id, tenantId }`. If no order, return `notFound()`.
   - File: `app/[domain]/admin/orders/print/[id]/page.tsx`.

### Phase 2 – High: reviews and product/review consistency

7. **Reviews – tenant scope**
   - **`getAdminReviews()`**: Add `tenantId` from session; `where: { product: { tenantId } }` (or equivalent relation so only current tenant’s reviews are returned).
   - **`deleteReview(id)`**: Resolve tenant from session; ensure the review belongs to a product of that tenant (e.g. join through product or add tenantId on Review if you have it), then delete. Otherwise return 403.
   - Files: `app/actions/review.ts`.

8. **Create review – validate product and tenant**
   - In **`createReview`**: Resolve tenant (e.g. from session or domain). Verify that `productId` (if not null) exists and has `product.tenantId === tenantId`. If not, return error. Then create review.
   - File: `app/actions/review.ts`.

### Phase 3 – Medium / low

9. **SKU generation – tenant-scoped**
   - **`generateUniqueSku()`**: Take tenant context (e.g. from session or parameter). Use `where: { tenantId }` in `findMany`. Generate next SKU per tenant.
   - File: `app/actions/product.ts`.

10. **RevalidatePath after review**
    - Replace `revalidatePath('/app/(client)/buy/[productId]')` with a path that matches your route structure, e.g. revalidate by segment like `/[domain]/buy/[productId]` or use `revalidateTag` if you tag product pages by product id.
    - File: `app/actions/review.ts`.

---

## Verification (after each change)

- **Tenant isolation:** As Tenant A admin, try to access/update/delete a resource that belongs to Tenant B (product id, order id, review id). Expect 404 or 403.
- **Order creation:** Call createOrder/upsertIncompleteOrder with a forged `tenantId`; confirm orders are created for the session/domain tenant only.
- **Receipt:** Open `/{tenantB_domain}/orders/receipt/{tenantA_orderId}`; expect notFound.
- **Reviews:** Create review for another tenant’s product; expect validation error. Delete another tenant’s review; expect 403.
- **SKU:** Create products in two tenants; confirm SKUs are unique per tenant and no cross-tenant collision.
- **Revalidate:** Add a review, then confirm the product page shows the new review without stale cache.

---

## Files to touch (checklist)

| File | Changes |
|------|--------|
| `app/actions/order.ts` | Ignore client `tenantId`; scope update/delete/print by session tenant |
| `app/actions/product.ts` | Scope getProduct, getProductById, update, delete, archive, unarchive, generateUniqueSku by tenant |
| `app/[domain]/orders/receipt/[id]/page.tsx` | Resolve tenant from domain; fetch order with tenantId |
| `app/[domain]/admin/orders/print/[id]/page.tsx` | Resolve tenant from session/domain; fetch order with tenantId |
| `app/actions/review.ts` | Scope getAdminReviews, deleteReview, createReview by tenant; fix revalidatePath |

---

## Additional bugs (second pass – after first-round fixes)

These were found in a follow-up pass. Assume the earlier tenant-isolation and review fixes are done.

### 1. Admin setup token / device auth uses arbitrary tenant (multi-tenant)

- **`app/actions/security.ts`** (lines ~15–18): `authorizeDevice` uses `prisma.siteConfig.findFirst({ select: { adminSetupToken: true } })` with **no `where`**. So the “valid” setup token is whatever tenant’s config comes first in the DB. In multi-tenant, only one tenant’s token would work for device authorization, and it’s non-deterministic which tenant that is.
- **`app/actions/admin-helper.ts`** (lines ~17–21, ~32–35): `getAdminSetupToken()` and `updateAdminSetupToken()` use `findFirst` with no `where`. Same issue: they read/update the first tenant’s `SiteConfig` only. Updating the token would change only one tenant’s config; other tenants would still see/use the old token from their own config if they ever get scoped correctly elsewhere.
- **`app/[domain]/admin/security/page.tsx`** (lines ~24–27): Fetches `config` via `findFirst` with no tenant filter, and shows `securityLog.findMany` / `trustedDevice.findMany` with no tenant filter. Admins see one arbitrary tenant’s setup token and **all** tenants’ security logs and trusted devices (global list).
- **Impact:** In multi-tenant, device auth and setup token are tied to an arbitrary tenant; security dashboard is not tenant-scoped; token update only affects one tenant.

**Remediation:** Resolve tenant from session (or domain) in these flows. Use `where: { tenantId }` when reading/updating `SiteConfig` for setup token. Scope `securityLog` and `trustedDevice` by tenant if the schema gains `tenantId`, or document that they are intentionally global and restrict who can access the security page.

---

### 2. Pending order count is global

- **`app/actions/admin-helper.ts`** (lines ~6–12): `getPendingOrderCount()` does `prisma.order.count({ where: { status: 'PENDING' } })` with **no `tenantId`**. So the count is across all tenants.
- **Impact:** If this is shown in tenant admin UI (e.g. sidebar), admins see the global pending count instead of their tenant’s count.

**Remediation:** Resolve `tenantId` from session and add `where: { tenantId, status: 'PENDING' }` (or equivalent). If the helper is only used in super-admin/global context, keep global but ensure callers are correct.

---

### 3. Fetch response not checked before parsing (track + AI image)

- **`lib/track.ts`** (lines ~30–47): After `fetch('/api/track', ...)`, code does `return await response.json()` with **no `response.ok` check**. On 4xx/5xx, the JSON body may be an error payload; callers may treat it as success.
- **`app/actions/ai.ts`** (lines ~53–55): After `fetch(imageUrl)` for AI image, code uses `imgRes.arrayBuffer()` with **no `imgRes.ok` check**. On 404/5xx, the body could be an HTML error page; that gets sent as base64 to Gemini and can cause API errors or confusing behavior.
- **Impact:** Track: incorrect success handling; AI: wasted tokens and possible failures when image URL is broken.

**Remediation:** In `lib/track.ts`, check `response.ok` and handle errors (e.g. throw or return a typed error). In `app/actions/ai.ts`, check `imgRes.ok` before reading the body and skip attaching the image (or return a clear error) when the fetch fails.

---

### 4. `revalidatePath` with literal `[domain]` segment

- **`app/actions/review.ts`** (line ~111): `revalidatePath('/[domain]/(client)/buy/[productId]', 'page')` uses a path with literal brackets. Next.js `revalidatePath` for dynamic routes typically expects either a concrete path (e.g. `/myshop/buy/abc123`) or a layout path; the literal `[domain]` may not match the actual cached route.
- **Impact:** Product page cache might not be invalidated after a new review.

**Remediation:** Either revalidate by a concrete path per product (e.g. pass domain + productId and build path), or use `revalidateTag` with a tag derived from product id (and tag the product page with that tag). See Next.js docs for revalidating dynamic segments.

---

### 5. Security page fallback token in UI

- **`app/[domain]/admin/security/page.tsx`** (line ~28): `const currentToken = config?.adminSetupToken || process.env.ADMIN_SETUP_SECRET || 'crab-secret-setup-123';` — hardcoded fallback `'crab-secret-setup-123'` is dangerous if ever used (e.g. when no config and no env). Exposing env in UI is also a concern; consider masking the token in the UI and never sending the raw secret to the client.
- **Impact:** Risk of default secret in UI; possible info leak of server env to client.

**Remediation:** Remove the hardcoded fallback. If no token is configured, show “Not set” or “Configure in env”. Do not send the raw `ADMIN_SETUP_SECRET` to the client; show a masked value (e.g. last 4 chars) or “Set”/“Not set” only.

---

### 6. Optional: `innerHTML` usage (products admin)

- **`app/[domain]/admin/products/page.tsx`** (lines ~1058–1060): Button label is set with `btn.innerHTML = '...'` (static SVG markup). Not user content, so not an XSS bug, but innerHTML is brittle and bypasses React’s reconciliation.
- **Impact:** Low; maintainability and consistency. Prefer React state or a React node for the button content.

**Remediation:** Replace with React state (e.g. “loading” vs “Auto-Write (AI)”) and render the icon/label as JSX so the button stays in React’s tree.

---

## Additional bugs (third pass)

### 1. **Critical: Unprotected API routes (no auth)**

These API routes perform destructive or sensitive operations with **no authentication**:

- **`app/api/admin-cleanup/route.ts`** – `GET` calls `prisma.product.deleteMany({})` and **deletes every product** in the database. Anyone who can send a GET request can wipe all products.
- **`app/api/fix-hubs/route.ts`** – `GET` upserts default hubs (no auth). Any caller can mutate hub data.
- **`app/api/upgrade-crab/route.ts`** – `GET` updates all tenants with name containing "crab" to plan `PREMIUM` (no auth).
- **`app/api/fix-super-admin/route.ts`** – `GET` finds the first user with name containing "Yasin" and sets `role: 'SUPER_ADMIN'` (no auth). Anyone can escalate that user to super-admin.
- **`app/api/debug-session/route.ts`** – `GET` returns the full session object (and `nodeEnv`) to the caller. No auth check; anyone can read session data (role, tenantId, etc.) if they hit the route.

**Remediation:**  
- Remove or strictly protect these routes. For admin/maintenance endpoints: require auth and role (e.g. SUPER_ADMIN), or restrict by IP/env (e.g. only in development or from a known IP).  
- For `debug-session`: require auth and run only in development, or remove.  
- For `admin-cleanup`: if kept, require SUPER_ADMIN and use a server action (like `resetDatabaseAction`) instead of an open GET endpoint.

---

### 2. **Impersonation URL params (account page)**

- **`app/[domain]/(client)/account/page.tsx`** (lines ~22–42): Auto-login uses `?impersonate=X&token=Y` from the URL. The token is sent to the credentials provider. If the token is not a single-use, server-validated magic link, an attacker who obtains a valid token (e.g. from logs, referrer, or history) could impersonate the user. Tokens in URLs can also leak via Referer.

**Remediation:** Ensure the credentials provider validates the token server-side (e.g. against a short-lived store or DB) and invalidates it after one use. Prefer POST body or a one-time code over long-lived tokens in query params.

---

### 3. **Hero slides cache key ignores domain**

- **`app/actions/hero.ts`** (lines ~12–31): `getCachedHeroSlides` is defined with `unstable_cache(..., ["hero-slides"], { ... })`. The cache key is only `["hero-slides"]`; the `domain` argument is **not** part of the key. So all domains get the same cached result. If hero slides ever become tenant-specific (e.g. by adding `tenantId` to the schema), the cache would be wrong.

**Remediation:** Include `domain ?? "global"` in the cache key array (e.g. `["hero-slides", domain ?? "global"]`) so cache is per-domain. If hero slides are intentionally global forever, document that and leave as-is.

---

### 4. **getHomeSections() without domain returns global data**

- **`app/actions/section.ts`** (lines ~32–41): When `getHomeSections(domain)` is called with no domain (or `undefined`), the cache key is `["home-sections", "global"]` and the query uses `isAvailable: true` / `isActive: true` with **no tenantId filter**. So all tenants’ sections and products are returned. Callers that pass a domain get correct tenant-scoped data; any future caller that omits domain would get mixed tenant data.

**Remediation:** Either require `domain` (make it non-optional and return [] or throw when missing), or document that the “global” case is intentional (e.g. super-admin only). If multi-tenant, avoid calling without domain in tenant context.

---

*Generated from full-project bug hunt. No code was modified; this is planning only.*
