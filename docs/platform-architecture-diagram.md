# Platform Architecture Diagram

```mermaid
flowchart TD
    subgraph LocalPlatform[Local Platform (localhost only)]
        SA[Super Admin UI
app.localhost] --> APIGW[Platform Auth
/api/platform-auth]
        APIGW --> PDB[(Control-Plane DB
PLATFORM_DATABASE_URL)]
        SA --> CP[Control-Plane Actions]
        CP --> PDB
        CP --> REG[Tenant Registry + Plan Catalog]
    end

    subgraph TenantProd[Tenant Production Deployment]
        TB[Browser] --> TD[tenant-domain.com]
        TD --> APP[Tenant App
DEPLOYMENT_MODE=tenant]
        APP --> TDB[(Tenant DB
DATABASE_URL)]
    end

    REG -->|Provisioning Bundle| Provision[Provisioning Script]
    Provision --> TDB
    Provision --> Deploy[Deploy Tenant App]
    Deploy --> TenantProd
```

## Key Notes

- Super Admin only exists in local platform mode (never exposed in production).
- Control-plane DB stores tenants + plan catalog and provisioning status.
- Each tenant has its own production deployment and database.
- Plans are centralized; tenants get a local snapshot at provisioning time.
