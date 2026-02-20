# System Design

This document describes the local-only Super Admin control plane and the tenant-only production deployments. The Super Admin lives at `app.localhost` and is never exposed in production.

## 1. Entity Relationship Diagram (ERD)

The tenant app uses the `Tenant` entity as the root for client-specific data. The control-plane uses `TenantRegistry` and `PlanCatalog` in a separate database.

```mermaid
erDiagram
    TenantRegistry {
        string id PK
        string slug UK
        string primaryDomain UK
        string planSlug
        string status
    }

    PlanCatalog {
        string id PK
        string slug UK
        string name
        float price
        json features
    }

    ProvisioningJob {
        string id PK
        string tenantId
        string status
    }

    TenantRegistry ||--o{ ProvisioningJob : "tracks" }

    Tenant ||--o{ User : "has many"
    Tenant ||--o{ Product : "has many"
    Tenant ||--o{ Order : "has many"
    Tenant ||--o{ Category : "has many"
    Tenant ||--o{ Hub : "has many"
    Tenant ||--o{ Coupon : "has many"
    Tenant ||--o{ PromoCard : "has many"
    Tenant ||--o| SiteConfig : "has one"

    Product ||--o{ OrderItem : "included in"
    Product ||--o{ Modifier : "has many"
    Product ||--o{ Inventory : "stored as"
    Product ||--o{ Review : "reviewed in"
    Product }|--|| Category : "belongs to"
    Product }|--o{ ProductSection : "grouped in"

    Order ||--o{ OrderItem : "contains"
    Order }|--o| Hub : "fulfilled by"

    Hub ||--o{ Freezer : "contains"
    Hub ||--o{ Inventory : "manages"
    Hub ||--o{ Expense : "tracks"
    Hub ||--o{ Order : "processes"
    Hub ||--o{ User : "staffed by"

    User ||--o{ Review : "writes"
    User ||--o{ Account : "auth via"
    User ||--o{ Session : "active in"

    Tenant {
        string id PK
        string slug UK
        string customDomain UK
        string plan
        boolean isActive
    }

    Product {
        string id PK
        string tenantId FK
        string name
        int price
        string stage
    }

    User {
        string id PK
        string tenantId FK
        string email UK
        enum role
    }
```

## 2. Hosting & Deployment Architecture

We use a **control-plane + tenant-only** model:

- **Control plane**: local-only Super Admin with its own DB (`PLATFORM_DATABASE_URL`).
- **Tenant production**: each tenant is deployed to its own domain with its own DB (`DATABASE_URL`).

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

## 3. Data Isolation Flow

All tenant production deployments are single-tenant. Each domain talks only to its own database. Local platform mode can host multiple tenants for development, but production is always tenant-only.

```mermaid
sequenceDiagram
    participant Browser
    participant Middleware
    participant ServerAction
    participant Database

    Browser->>Middleware: GET crabkhai.com
    Middleware->>Middleware: Resolve Hostname (crabkhai.com)
    Middleware->>ServerAction: Rewrite to /[domain]
    ServerAction->>Database: Query Tenant where customDomain = "crabkhai.com"
    Database-->>ServerAction: Return Tenant Object (ID: 123)
    ServerAction->>Database: Fetch Products where tenantId = 123
    Database-->>ServerAction: Return Product List (Filtered)
    ServerAction-->>Browser: Render Storefront (CrabKhai)
```

## 4. Cross-Tenant Security Architecture

In production, isolation is physical (one DB per tenant). In local development, tenant data is isolated by `tenantId` filtering.

### JWT & Session Scoping

We utilize **NextAuth.js** with a customized JWT-based session strategy:

- **Tenant Context in JWT**: Upon login, the user's `tenantId` is encoded into the JWT payload.
- **Session Scoping**: The `session()` callback ensures `tenantId` is available in all Server Components and Server Actions.
- **Role-Based Access (RBAC)**: Middleware and API routes check both `role` (SUPER_ADMIN vs. HUB_ADMIN) and `tenantId` match before allowing data access.

### Database Constraint Isolation

Every data-fetching Server Action is "Hardened" with a mandatory `tenantId` clause:

```typescript
// Example of a hardened query
const products = await prisma.product.findMany({
  where: { tenantId: session.user.tenantId },
});
```

This ensures that even if a user manually changes an ID in a request, the query is geographically locked to their authenticated tenant.

---

## 5. Asset & Media Isolation (Cloudinary)

To maintain privacy and organizational clarity, the platform uses **Folder Partitioning** for all uploaded media assets.

### Dynamic Folder Routing

When an image is uploaded (via `ImageUpload.tsx` or `MediaUpload.tsx`), the system routes it to a specific Cloudinary folder based on the tenant's identifier:

- **Structure**: `platform_uploads/[tenant_slug]/[resource_type]/`
- **Isolation**: Each tenant has a dedicated "sandbox" within Cloudinary. This prevents asset naming collisions and allows for tenant-specific storage reporting or bulk-deletion.

### Fallback Data URLs

In cases where Cloudinary is not configured, the system utilizes **Base64 Inline Storage**. While not recommended for high-volume use, it maintains 100% tenant isolation as the data strings are stored directly in the tenant-scoped database records.

---

## 6. Multi-Tenant Caching Strategy

The platform uses Next.js **Data Cache** (`unstable_cache`) to ensure high performance without compromising data isolation.

### Tenant-Scoped Tags

To prevent "Cache Injection" (where Tenant A sees cached data from Tenant B), all cache keys are tagged with the specific `tenantId`:

- **Implementation**: `tags: ['products', tenantId]`
- **Isolation**: When a product is updated in the CrabKhai admin, we only invalidate tags for `['products', crabkhaiId]`. The cache for Textile remains untouched and secure.

### Revalidation Flow

- **On-Demand**: Triggered via `revalidateTag()` when a specific resource (Order, Category, Product) is modified.
- **Time-Based**: Fallback TTL (e.g., 3600s) ensures data eventually refreshes even if hardware signals fail.

---

## 7. Future Scaling Roadmap (100+ Tenants)

While the current **tenant-only production** model works for early clients, the platform can evolve to centralized multitenancy if needed.

### Phase 1: High-Density Logical Multi-Tenancy

Move from separate Vercel projects to a single project that utilizes a **Centralized Database** with a sophisticated `tenantId` filtering layer (Row Level Security or Prisma Middleware).

### Phase 2: Schema Isolation

As data grows, transition to **PostgreSQL Schema Isolation**:

- **Setup**: Each tenant gets their own private schema within a shared database instance (`crabkhai.products`, `textile.products`).
- **Benefit**: Provides the data isolation of separate databases with the management ease of a single database.

### Phase 3: Global Edge Performance

Deploying **Edge Middleware** and **Edge Config** to resolve tenant domains at the CDN level, reducing the time-to-first-byte (TTFB) to near-zero across the globe.

---

## 8. Why this Design?

| Feature         | Single Project (Multi-Tenant)      | Separate Projects (Multi-Instance)  |
| --------------- | ---------------------------------- | ----------------------------------- |
| **Isolation**   | Logical (Risky if filters missing) | Physical (Safe, unique projects)    |
| **Env Vars**    | Shared (Must prefix keys)          | Unique (Clean, one key per project) |
| **Themes**      | Conditional Code                   | Branch-specific Code                |
| **Vercel Free** | Hits limits faster                 | Distributes limits across projects  |

## 9. Local Platform-Only Notes

- Super Admin runs only on `app.localhost` with hosts file entry.
- Super Admin uses the control-plane DB (`PLATFORM_DATABASE_URL`).
- Production tenant deployments use `DEPLOYMENT_MODE=tenant` and never expose `/app`.
- Plans are centralized in the control-plane and snapshotted into tenant DBs at provisioning time.

## 10. Migration Validation Policy

- Before any real tenant migration, validate in a **clone DB**.
- Always **backup -> migrate -> restore** the clone.
- Only after validation, migrate the real tenant DB.
