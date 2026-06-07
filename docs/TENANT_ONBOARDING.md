# Tenant Onboarding + Provisioning Workflow

Single source of truth for onboarding new tenants from registration to production.

---

## Part A: Information Checklist

Gather before provisioning.

**Business Identity:**
- Shop Name (example: "Blue Ribbon Textiles")
- Subdomain Slug (example: `blue-ribbon`)
- Custom Domain (optional)

**Admin Account:**
- Full Name, Email, Phone, Initial Password (temporary)

**Shop Configuration:**
- Shop Type (RESTAURANT | GROCERY/RETAIL)
- Measurement Unit (PCS | WEIGHT | VOLUME)
- Tax Percentage

**Branding:**
- Logo (PNG/SVG), Primary Color, Secondary Color (hex)
- Support Email, Phone, Store Address

**Plan & Technical:**
- Plan selection (Silver/Gold/Platinum)
- Database URL (if isolated deployment)
- Media volume mount path (default: `/data/media`, auto-provisioned by Docker)

**Tracking (Per Tenant):**
- GTM Container ID (optional, unique per tenant, example: GTM-XXXXXXX)
- Do not reuse crabkhai.com GTM container for other tenants

**One-time setup charge: ৳6,000** (domain registration + hosting + DB provisioning)

---

## Part B: Provisioning Steps (Control Plane → Production)

**Step 1 — Register in control-plane**
- Open `http://app.localhost`
- Create tenant record (name, slug, admin email, plan)
- Local hosts: `127.0.0.1 app.localhost`, `127.0.0.1 <tenant-slug>.localhost`

**Step 2 — Create tenant database**
- Provision dedicated PostgreSQL database

**Step 3 — Validate migrations on clone**
- Clone tenant DB to scratch (e.g., `tenant_db_clone`)
- Run migrations on clone, then restore from backup
- Verify no errors before production

**Step 4 — Apply migrations to production**
- Run migrations on real tenant DB only after clone validation passes

**Step 5 — Seed tenant database**
- Tenant record
- Site config
- Admin user  
- Plan snapshot (copy from control-plane `PlanCatalog`)

Sample plan snapshot:
```json
{
  "slug": "PLATINUM",
  "name": "Platinum",
  "price": 8000,
  "features": ["Unlimited Orders", "24/7 Support"],
  "limits": {"ordersPerMonth": "UNLIMITED", "users": "UNLIMITED"}
}
```

**Step 6 — Deploy application**
Environment variables:
```env
DEPLOYMENT_MODE=tenant
SUPER_ADMIN_ENABLED=false
DATABASE_URL=postgresql://...
TENANT_PRIMARY_DOMAIN=your-tenant-domain.com
```

**Step 7 — Configure DNS**
- Point domain to tenant deployment
- Verify root domain loads tenant storefront

**Step 8 — Validate**
- [ ] Admin login works
- [ ] Storefront loads on tenant domain
- [ ] Tenant data isolated (no cross-tenant leakage)
- [ ] Super Admin routes blocked on production domain

---

## Reference Notes

- **Super Admin:** Local-only (`app.localhost`), never exposed in production
- **Control-plane:** Uses `PLATFORM_DATABASE_URL`
- **Tenant production:** Set `DEPLOYMENT_MODE=tenant` + `SUPER_ADMIN_ENABLED=false`
- **Plan data:** Centralized in control-plane, snapshotted into tenant DB at provisioning
