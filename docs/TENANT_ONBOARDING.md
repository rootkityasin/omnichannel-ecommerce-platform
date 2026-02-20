# New Tenant Onboarding Requirements

To set up a new shop on the platform, please provide the following details. This information is required to initialize your database, configure your storefront, and set up your isolated hosting instance.

## 1. Business Identity

- **Shop Name**: The official name of your business (e.g., "Blue Ribbon Textiles").
- **Subdomain Slug**: A unique URL identifier (e.g., `blue-ribbon`). Your store will be reachable at `blue-ribbon.everywhere.com`.
- **Custom Domain (Optional)**: If you own a domain (e.g., `www.blueribbon.com`), provide it so we can map it to your instance.

## 2. Admin Account (Owner)

- **Full Name**: Name of the primary shop administrator.
- **Email Address**: Used for login and system notifications.
- **Phone Number**: Required for secure login and SMS notifications.
- **Initial Password**: A temporary secure password.

## 3. Shop Configuration

- **Shop Type**:
  - `RESTAURANT`: Enables kitchen Kanban boards and live order tracking.
  - `GROCERY/RETAIL`: Standard retail order management.
- **Measurement Unit**:
  - `PCS`: Standard unit-based selling.
  - `WEIGHT (Kg/Gm)`: Ideal for seafood or bulk goods.
  - `VOLUME (Ltr/ml)`: Ideal for liquids.
- **Tax Percentage**: Default tax to apply to all orders.

## 4. Branding & Contact

- **Logo**: A high-resolution PNG or SVG (Transparent background recommended).
- **Brand Colors**:
  - Primary Color (Hex code, e.g., `#E60000`)
  - Secondary Color (Hex code, e.g., `#0F172A`)
- **Public Contact Details**:
  - Support Email (shown to customers)
  - Support Phone
  - Physical Address/Store Location

## 5. Choose a Service Plan

Select the tier that best fits your business scale. Our system provides 100% data isolation regardless of your chosen plan.

| Feature     | **Silver** (Starter) | **Gold** (Growth) | **Platinum** (Scale) |
| :---------- | :------------------- | :---------------- | :------------------- |
| **Pricing** | ৳1,000 / mo          | ৳2,500 / mo       | ৳5,000 / mo          |

> [!IMPORTANT]
> **One-Time Setup Charge: ৳6,000**
>
> A foundational fee required to provision your dedicated environment.
> **What this covers:**
>
> 1.  **Domain Name**: 1-year registration for your custom `.com` or `.com.bd` domain.
> 2.  **Dedicated Hosting**: Configuration of your isolated server instance on our high-performance cloud.
> 3.  **Database Provisioning**: Setup of your secure, isolated database to ensure data privacy.
>
> **Why is this required?**
> Unlike shared marketplaces, your shop gets its own dedicated resources to ensure speed, security, and brand independence. This one-time fee covers the actual infrastructure costs to get you started.
> | **Staff Accounts** | 2 | 5 | 15 |
> | **Product Limit** | 50 | 500 | **Unlimited** |
> | **Order Limit** | 100 / month | 1,000 / month | **Unlimited** |
> | **Analytics** | Basic | Advanced | **Real-time** |
> | **Support** | Standard | Priority | **24/7 Dedicated** |
> | **Custom Domain** | ❌ | ✅ | ✅ |
> | **Multiple Hubs/Branches** | ❌ | ✅ | ✅ |
> | **Email Marketing** | ❌ | ✅ | ✅ |
> | **Payment Gateways** | ❌ | ✅ | ✅ |
> | **IP Calling Integration** | ❌ | ❌ | ✅ |
> | **Courier Integration** | ❌ | ❌ | ✅ |

### Feature Breakdown

- **Staff Accounts:** Number of unique administrative logins for your team.
- **Custom Domain:** Connect your own `.com` or `.com.bd` domain (e.g., `shop.yourbrand.com`).
- **Multiple Hubs:** Manage inventory and orders across different physical locations or warehouses.
- **IP Calling:** Integrated VOIP services for direct customer communication from the dashboard.
- **Courier Integration:** Automated delivery booking with partners like Pathao.

## 6. Technical Requirements (Multi-Instance)

If you are using a dedicated Vercel project for maximum isolation:

- **Database URL**: A dedicated PostgreSQL connection string.
- **Cloudinary Credentials**: Cloud Name and a dedicated Upload Preset (allows your assets to be separate from other shops).

## 7. Control-Plane Workflow (Local Only)

- Tenants are registered in the local Super Admin console at `app.localhost`.
- The control-plane database stores tenant registry + centralized plans.
- Provisioning exports a tenant snapshot for deployment.
- Production tenant deployments never include Super Admin routes.
