# Provisioning Workflow (Local Control-Plane -> Tenant Production)

This workflow validates migrations using a **clone DB** and restores the clone every time. The real tenant DB is migrated only after validation.

## 1. Register Tenant (Local Super Admin)

- Go to `http://app.localhost`.
- Create tenant (name, slug, admin email, plan).
- This creates a record in the control-plane DB only.

### Hosts File (Local)

- `127.0.0.1 app.localhost`
- `127.0.0.1 <tenant-slug>.localhost`

## 2. Prepare a Tenant DB

- Create a new Postgres database for the tenant.

## 3. Validate Migration on Clone (Backup -> Migrate -> Restore)

1. Clone the tenant DB to a scratch DB (e.g., `tenant_db_clone`).
2. Backup the clone.
3. Run migrations against the clone.
4. Restore the clone from backup (always).

## 4. Apply Migrations to Real Tenant DB

- Run migrations against the real tenant DB after clone validation.

## 5. Seed Tenant Snapshot

- Insert tenant record, site config, admin user, and plan snapshot.
- The plan snapshot is copied from control-plane `PlanCatalog` into tenant DB.

### Sample Plan Snapshot JSON

```json
{
  "slug": "PLATINUM",
  "name": "Platinum",
  "price": 8000,
  "features": ["Unlimited Orders", "24/7 Support"],
  "limits": {
    "ordersPerMonth": "UNLIMITED",
    "users": "UNLIMITED"
  }
}
```

## 6. Deploy Tenant App

Use environment variables:

```env
DEPLOYMENT_MODE=tenant
SUPER_ADMIN_ENABLED=false
DATABASE_URL=postgresql://...
TENANT_PRIMARY_DOMAIN=crabkhai.com
```

## 7. DNS + Domain

- Point the domain to the tenant deployment (Vercel or other).
- Root domain serves tenant storefront directly.

## 8. Notes

- Super Admin never ships to production domains.
- Only the tenant app is deployed per domain.
