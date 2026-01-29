# Omnichannel Ecommerce Platform

This is a premium e-commerce platform dedicated to bringing the freshest live crab and seafood delicacies from the Sundarbans directly to your doorstep. Our mission is to provide an authentic, high-quality seafood experience with a touch of luxury.

## Live Demo
- **Frontend**: [http://localhost:3000](http://localhost:3000) (Local Development)

## Tech Stack
This project is built using the latest web technologies for speed, scalability, and developer experience.

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Lucide Icons](https://lucide.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Database**: Prisma (ORM) with PostgreSQL
- **Fonts**: Playfair Display (Headings) & Inter (Body)

---

### Security Audit & Hardening (ZAP Audited)
CrabKhai has been audited against **OWASP Top 10** vulnerabilities using ZAP (Zed Attack Proxy).

- **Content Security Policy (CSP)**: Robust policy preventing XSS and unauthorized script execution.
- **HSTS (Strict-Transport-Security)**: Enforced HTTPS for all connections for 1 year.
- **Anti-Clickjacking**: Implemented `X-Frame-Options: SAMEORIGIN`.
- **MIME Sniffing Protection**: Added `X-Content-Type-Options: nosniff`.
- **Referrer Policy**: Set to `strict-origin-when-cross-origin` for privacy.
- **Permissions Policy**: Restricted browser features (camera, microphone) to minimize attack surface.
- **SRI (Subresource Integrity)**: Critical assets are validated for integrity (handled via Next.js optimization).

### ISO Compliance & Enterprise Standards
We adhere to professional engineering standards inspired by **ISO 9001** and **ISO 27001**.
- **📜 Compliance Guide**: See [ISO_COMPLIANCE.md](./docs/ISO_COMPLIANCE.md) for a detailed breakdown of our controls.
- **🛡️ Rate Limiting**: Intelligent adaptive rate limiting to prevent abuse.
- **✅ CI/CD Pipeline**: Automated GitHub Actions workflow (`.github/workflows/ci.yml`) enforces quality gates on every push.

### Automated Quality Assurance
The project maintains high stability through automated verification:
- **Unit Testing**: Powered by **Vitest**. (Run `npm test` to verify)
- **Security Logic Verification**: Critical security controls (like rate limits) are mathematically verified via automated tests.
### 🏆 Certification Readiness Matrix
This project is engineered to meet rigorous enterprise standards.

| Standard | Control | Implementation Evidence |
|:---|:---|:---|
| **ISO 27001** | **A.14.2.8** (System Testing) | Automated Security Unit Tests (`lib/rate-limit.test.ts`) |
| **ISO 27001** | **A.12.6.1** (Vulnerability Mgmt) | ZAP Audit + Automated Dependency Scanning |
| **ISO 9001** | **8.1** (Operational Planning) | CI/CD Pipeline via GitHub Actions |
| **ISO 9001** | **7.5.3** (Documented Info) | Full Compliance Documentation (`docs/ISO_COMPLIANCE.md`) |
| **SOC 2** | **A1.1** (Availability) | Automated Health Monitoring (`/api/health`) |
| **GDPR** | **Art. 25** (Privacy by Design) | Data Minimization & Cookie Consent Architecture |

---

## ⚡ Performance Optimizations

This project includes comprehensive performance optimizations to reduce CPU usage and improve response times.

### React Strict Mode Protection
**useRef Guards** prevent duplicate API calls that occur in React Strict Mode (development):

| Component | Optimization |
|-----------|--------------|
| `AdminHeader.tsx` | Prevents double notification polling |
| `TrustFooter.tsx` | Prevents double `getSiteConfig()` calls |
| `CategoryNav.tsx` | Prevents double category fetching |
| `AdminProvider.tsx` | Prevents double localStorage + DB sync |
| `app/(client)/page.tsx` | Prevents double home page data load |
| `app/admin/customers/page.tsx` | Prevents double customer list fetch |

### Server Action Caching
In-memory caching with TTL (Time-To-Live) for frequently accessed data:

```typescript
// 60-second cache with automatic invalidation
getSiteConfig()   // Cached, invalidated on update
getCategories()   // Cached, invalidated on create/delete
```

### Prisma Accelerate Edge Caching
Server-side edge caching with SWR (Stale-While-Revalidate) for optimized database operations:

| Query | TTL (Fresh) | SWR (Stale) | Description |
|-------|-------------|-------------|-------------|
| Device Verification | 5 min | - | Admin device auth check |
| Site Config | 30-60 sec | - | Shop settings |
| Payment/Delivery Config | 60 sec | - | Checkout settings |
| Products List | 60 sec | 5 min | Product catalog |
| Single Product | 30 sec | 2 min | Product detail |
| Categories | 2 min | 5 min | Category navigation |
| Hero Slides | 60 sec | 5 min | Homepage carousel |

**How SWR Works:**
1. **TTL Phase:** Serves cached data instantly (no DB call)
2. **SWR Phase:** Serves stale cache while refreshing in background
3. After SWR expires → fetches fresh from database

**Admin Sync:** When admins update content, `revalidatePath()` triggers immediate cache invalidation.

### ISR (Incremental Static Regeneration)
User-facing pages use ISR with 60-second revalidation for optimal performance:
- Home page (`/`)
- Menu page (`/menu`)

### Debounce & Throttle Utilities
Custom hooks in `lib/hooks/useDebounce.ts`:

```typescript
import { useDebounce, useDebouncedCallback, useThrottle } from '@/lib/hooks/useDebounce';

// Debounce a search value
const debouncedSearch = useDebounce(searchTerm, 300);

// Debounce a callback function
const debouncedFetch = useDebouncedCallback(fetchResults, 300);

// Throttle scroll handlers
const throttledScroll = useThrottle(scrollPosition, 500);
```

### Next.js Configuration
Optimized `next.config.ts` for production:

- **Image Optimization**: Remote patterns for external images, optimized device sizes
- **Gzip Compression**: Enabled via `compress: true`
- **Source Maps**: Disabled in production for smaller bundles
- **External Packages**: Prisma packages externalized for faster builds
- **Reduced Logging**: Fetch logging minimized in production

### Performance Impact
- **~80-90% fewer database calls** with Prisma Accelerate caching
- **~50% fewer API calls** in development mode
- **Faster page loads** with cached server actions and ISR
- **Reduced database queries** through intelligent edge caching
- **Smaller production bundle** without source maps

---

## 💎 Platform Tiers & Subscription Plans

CrabKhai is built as a multi-tenant platform with three distinct service tiers tailored for different business scales.

| Feature                      | **Silver** (Starter) | **Gold** (Growth)   | **Platinum** (Scale) |
|:-----------------------------|:---------------------|:--------------------|:---------------------|
| **Pricing**                  | ৳1,000 / mo          | ৳2,500 / mo         | ৳5,000 / mo          |
| **Staff Accounts**           | 2                    | 5                   | 15                   |
| **Product Limit**            | 50                   | 500                 | **Unlimited**        |
| **Order Limit**              | 100 / month          | 1,000 / month       | **Unlimited**        |
| **Analytics**                | Basic                | Advanced            | **Real-time**        |
| **Support**                  | Standard             | Priority            | **24/7 Dedicated**   |
| **Custom Domain**            | ❌                   | ✅                 | ✅                   |
| **Multiple Hubs/Branches**   | ❌                   | ✅                 | ✅                   |
| **Email Marketing**          | ❌                   | ✅                 | ✅                   |
| **Payment Gateways**         | ❌                   | ✅                 | ✅                   |
| **IP Calling Integration**   | ❌                   | ❌                 | ✅                   |
| **Courier Integration**      | ❌                   | ❌                 | ✅                   |

> [!IMPORTANT]
> **One-Time Setup Charge: ৳6,000**
>
> A foundational fee required to provision your dedicated environment.
> **What this covers:**
> 1.  **Domain Name**: 1-year registration for your custom `.com` or `.com.bd` domain.
> 2.  **Dedicated Hosting**: Configuration of your isolated server instance on our high-performance cloud.
> 3.  **Database Provisioning**: Setup of your secure, isolated database to ensure data privacy.
>
> **Why is this required?**
> Unlike shared marketplaces, your shop gets its own dedicated resources to ensure speed, security, and brand independence. This one-time fee covers the actual infrastructure costs to get you started.

> [!TIP]
> Each plan is hosted on a physically isolated instance for maximum security and data privacy. Subscriptions can be upgraded at any time through the Super Admin dashboard.

---

## Project Structure
Here's a quick overview of how the codebase is organized:

```
crab-khai/
├── app/                  # Next.js App Router
│   ├── (client)/         # Client-facing pages (Menu, Checkout)
│   ├── admin/            # Admin dashboard routes
│   │   └── security/     # Security dashboard & device setup
│   ├── actions/          # Server actions (with caching)
│   └── api/              # API routes
├── components/           # Reusable UI components
│   ├── client/           # Components for the public store
│   ├── admin/            # Components for the admin panel
│   └── ui/               # Base UI elements (Buttons, Inputs)
├── lib/                  # Utilities and helper functions
│   ├── hooks/            # Custom React hooks (debounce, throttle)
│   └── prisma.ts         # Prisma client singleton
├── prisma/               # Database schema and config
└── public/               # Static assets (images, fonts)
```

## Getting Started

Follow these steps to get the project running locally on your machine.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) installed.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rootkityasin/CrabKhai.git
   cd CrabKhai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the App**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Kitchen Management System (Backend)
This project includes a robust backend administrative dashboard designed to streamline kitchen operations and business management. Everything you need to run the business is built right in.

### Key Features:
- **Order Management**: Real-time tracking of incoming orders, status updates, and fulfillment.
- **Product & Category Management**: Easy tools to add, update, or remove seafood items and organize them.
- **Inventory & Stock**: Keep track of what's fresh and what's running low.
- **Analytics & Reporting**: Insightful dashboards to monitor sales performance and customer trends.
- **Customer Database**: Manage customer profiles and order history.
- **Billing & Subscriptions**: Integrated financial tools for invoicing and subscription plans.
- **Marketing Tools**: Manage promos, themes, and automation settings.
- **Trusted Device Security**: Advanced security layer requiring device authorization for admin access.
- **Smart Admin Redirect**: Intelligent routing that instantly directs admins to the dashboard upon login.
- **User Roles**: Granular access control for admins, kitchen staff, and managers.

### 🚀 Latest Features (v2.2)
- **Prisma Accelerate Edge Caching**: Reduces database operations by 80-90% using server-side edge caching with SWR strategy.
- **ISR for User Pages**: Home and Menu pages use Incremental Static Regeneration for instant loads.
- **Unified ImageUpload Component**: Consolidated file upload with 5MB limit and Cloudinary integration.

### Previous Features (v2.1)
- **Lazy Stock Deduction**: Stock is only deducted when you **Print the Invoice**, preventing inventory drift from unconfirmed orders.
- **Client Intelligence**:
  - **Repeat Badge**: Automatically tags returning customers (e.g., "5x Order") to help prioritize loyalty.
  - **Blocklist System**: Mark bad actors as "Fake". Future orders from them will be flagged with a Red Alert.
- **Invoice Printing**: Integrated one-click A4/Thermal invoice generation.
- **Advanced Reviews**: Shoppers can now link reviews to specific products for better social proof.
- **Strict Validation**: Enforces valid Bangladeshi phone numbers (`01xxx...`) to eliminate junk data.

### ⚙️ Admin Panel Settings

The admin panel includes a powerful **Shop Settings** section that controls how your entire system operates:

#### Measurement Unit
Choose how stock and quantities are displayed:

| Setting | Display | Use Case |
|---------|---------|----------|
| **Product Pieces (Default)** | "5 pcs", "10 units" | Standard retail items |
| **Weight (Kg/Gm)** | "400g", "1.2kg" | Seafood, meat, bulk goods |
| **Volume (Ltr/ml)** | "500ml", "1.5 Ltr" | Liquids, beverages |

**Weight per Unit Setting:**
- Define: `1 Unit = X grams` (e.g., 200g)
- Controls how stock is **displayed and calculated** everywhere:
  - Cart Drawer: Shows "400g" instead of "2"
  - Cart Page: Weight-based quantity display
  - Admin Products: Shows "2.4 kg (12 units)"
  - Inventory: Add/remove stock in grams
  
**Logic:**
```
Display Weight = Stock Value (stored as grams)
Units (reference) = Stock Value ÷ Weight per Unit
```

#### Shop Type
Choose your business model:

| Type | Features |
|------|----------|
| **Restaurant** | Kitchen Order Board (Kanban), Stage management (Draft → Selling) |
| **Grocery/Retail** | Standard order table view, simplified workflow |

**What Changes:**
- Restaurant: Enables Kanban board at `/admin/orders`
- Grocery: Traditional order list view
- Product stages work differently based on shop type

### 📊 Customer Management

#### Excel Import Feature
Bulk import customers from CSV/Excel files:

1. Click **Upload Excel** → See format guide popup
2. File must have **Name** and **Phone** columns (Email optional)
3. System automatically:
   - Parses header row
   - Maps columns by name matching
   - Validates phone numbers (10+ digits)
   - Skips duplicates (by phone)
   - Reports: "Imported X, Skipped Y"

**Supported Column Names:**
- Name: `Name`, `Full Name`, `Customer Name`
- Phone: `Phone`, `Mobile`, `Contact`
- Email: `Email`, `Mail` (optional)

### 🧠 AI Smart Features (Powered by Gemini Pro)
- **Magic Description**: Automatically generates professional product descriptions.
- **Bangla Auto-Translate**: Translates ingredient names to Bangla as you type.
- **Smart Paste**: Copy-paste raw text (e.g., "Crab 500g 1200tk") and let AI parse it into the form. **(Price is intentionally excluded so you can set it manually)**.

## Design System
We use a custom theme configured in `tailwind.config.ts` to reflect our brand identity:
- **Colors**: `crab-red` (Primary), `ocean-blue` (Secondary), `sand` (Accent).
- **Typography**: Serif headings for elegance, Sans-serif body for readability.

## 🖼️ Image Management

The application features a hybrid image management system for flexibility and reliability:

### 1. Cloudinary (Primary)
Used for all dynamic uploads (Products, Categories, Trust Badges).
- **Type**: Unsigned Client-Side Uploads
- **Benefits**: CDN delivery, on-the-fly transformations, reduced server load.
- **Config**: Requires `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.

### 2. Local Fallback (Failsafe)
If Cloudinary credentials are missing or valid keys are not provided:
- **Mechanism**: The system automatically detects the missing config.
- **Action**: Converts uploads to **Base64 Data URLs** and stores them directly in the database.
- **Note**: This is intended for development or emergency fallback, not high-volume production use.


## 🏢 System Design

Detailed documentation including **ERD (Entity Relationship Diagram)**, **Deployment Flow**, and **Data Isolation Sequences** can be found in the [Full System Design Guide](./docs/SYSTEM_DESIGN.md).

For new shop registrations, refer to the [Tenant Onboarding Guide](./docs/TENANT_ONBOARDING.md).

### 1. Primary Strategy: Multi-Instance (Isolated)
We have adopted a **Multi-Instance (Tenant-per-Project)** hosting strategy on Vercel to ensure maximum isolation, customizability, and efficient use of the hobby tier.

- **Isolated Projects**: Each tenant project (e.g., CrabKhai, Textile) is connected to its own **Git Branch**.
- **Dedicated Branches**: 
  - `crabkhai` branch -> serves `crabkhai.com`
  - `tenant-textile` branch -> serves textile-related shops.
- **Environment Separation**: Each project maintains its own isolated `DATABASE_URL` and API keys.
- **Frontend Customization**: Unique theme injectors allow each branch to provide a different storefront experience while sharing the core admin logic.

### 2. Standard Multi-Tenant Design (Internal)
The system remains fundamentally built on a **Shared-Database Multi-Tenancy** model for internal scaling:
*   **Tenants (Shops)**: Every piece of data is tagged with a `tenantId` for logical isolation.
*   **Dynamic Resolution**: Next.js Middleware inspects the **Hostname** to resolve the correct tenant context at the request level.
*   **Logical Isolation**: Strict internal filters ensure that even if hosted in a single project, data remains secure and separated.


## Contributing

Feel free to open issues or submit pull requests if you have ideas for improvements.

---
*Built with ❤️ by 90sX*

## Deployment & Environment Variables

When deploying to Vercel (or any other host), you **MUST** configure the following Environment Variables in your project settings:

### Required Variables
| Variable Key | Description |
|--------------|-------------|
| `DATABASE_URL` | Connection string for your PostgreSQL database. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Your Cloudinary Cloud Name (e.g., `dwrmfoq1a`). |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Your **Unsigned** Upload Preset (e.g., `CrabKhai`). |
| `ADMIN_SETUP_SECRET` | Secret token for authorizing new admin devices (optional, has default). |

### How to Add in Vercel
1. Go to your Vercel Dashboard.
2. Select your project -> **Settings**.
3. Click on **Environment Variables** in the sidebar.
4. Add the keys and values listed above.
5. **Redeploy** your application for changes to take effect.
