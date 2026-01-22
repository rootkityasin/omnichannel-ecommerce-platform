# Software Requirements Specification (SRS)
**Project:** Enterprise White-Label E-Commerce Suite
**Version:** 2.1.0-Stable 
**Date:** January 21, 2026
**Prepared By:** 90sX

## 1. Introduction
### 1.1 Purpose
The purpose of this document is to outline the functional and non-functional requirements for the Enterprise White-Label E-Commerce Suite. This system is architected as a turnkey, highly configurable B2B2C platform intended for deployment across diverse retail verticals (e.g., Frozen Foods, FMCG, Quick Service Restaurants). It facilitates distinct storefront branding and operational workflows while maintaining a unified core codebase.

### 1.2 Scope
The system operates as a single-tenant deployment model where each client instance isolates data and configuration.

- **Core Platform:** A modern web application delivering a high-performance storefront and a comprehensive administrative backend.
- **Configuration Engine:** A central mechanism allowing runtime injection of brand assets (logos, palettes), copy, and business logic parameters without code modification.
- **Operations Module:** Tools for inventory management, order lifecycle tracking, and customer relationship management (CRM).

### 1.3 Definitions and Acronyms
- **Tenant:** The client business entity utilizing the platform.
- **Storefront:** The public-facing interface for end-consumers.
- **Admin Console:** The restricted-access interface for tenant operations.
- **COTS:** Commercial Off-The-Shelf (component style).
- **RBAC:** Role-Based Access Control.

## 2. System Architecture & Branding
### 2.1 White-Label Architecture
The platform is designed for rapid redeployment. All tenant-specific attributes are abstracted into a configuration layer.

#### 2.1.1 Configurable Identity
The system must support dynamic updates to the following assets via the Admin Console:

- **Brand Assets:** Logo, Favicon, Hero Imagery.
- **Typography & Palettes:** Primary and Secondary color definitions using CSS variables for runtime theming.
- **Localization:** Currency symbols, tax rates (VAT/GST), and contact information info blocks.

#### 2.1.2 Content Injection
- **Dynamic Copy:** Headers, "Empty State" messaging, and transactional email templates must be editable.
- **Policy Management:** Built-in CMS for Privacy Policy, Terms of Service, and Refund Policy.

## 3. Functional Requirements
### 3.1 Storefront Module
#### 3.1.1 User Authentication
- **Identity Provider:** Secure authentication supporting credential-based (Phone/Password) and OAuth (Google) access.
- **Session Management:** HTTP-only secure cookies for session persistence.
- **UX Enhancements:** Integration of high-fidelity animations (e.g., canvas-based mascot interactions) during the authentication flow to enhance brand recall.
- **Input Validation:** Strict regex enforcement for local phone numbers (e.g., `^(?:\+88|88)?(01[3-9]\d{8})$`) to reduce invalid lead generation.

#### 3.1.2 Catalog & Discovery
- **Product Matrix:** A responsive grid layout supporting polymorphic product types (SKUs, Combos, Weighted Items).
- **Navigation:** Hierarchical category traversal with glassmorphic UI elements.
- **Search:** Client-side fuzzy search with debounced server queries.
- **Review System:**
  - **Product Binding:** Capability to link user reviews to specific SKUs via a searchable "Choosebox" or submit general site feedback.
  - **Rich Media:** Support for image uploads in reviews with optimization.

#### 3.1.3 Checkout & Transaction
- **Cart State:** Client-side state management (Zustand/Redux) with local storage persistence.
- **Logistics:** Geo-fenced delivery zone selection with dynamic fee calculation.
- **Payment Gateway:** Modular adapter pattern supporting:
  - **Cash on Delivery (COD):** Configurable thresholds.
  - **MFS Integration:** bKash/Nagad support with transaction ID verification.

### 3.2 Administrative Module
#### 3.2.1 Product Lifecycle Management (PLM)
- **CRUD Operations:** Full interfaces for creating and modifying SKUs.
- **Inventory Control:** Stock level management mapped to physical storage units.
- **Lazy Deduction Strategy:** Stock is reserved but not permanently deducted until the printed invoice generation event, preventing inventory drift from unconfirmed orders.

#### 3.2.2 Client Intelligence & CRM
- **Repeat Customer Detection:** Algorithmic identification of returning customers based on phone/email signatures, flagged with OrderCount badges in the order matrix.
- **Risk Management (Blocklist):**
  - Manual tagging of "Fake" or "Malicious" customers.
  - Visual "Suspect" alerts on incoming orders matching blocklisted credentials.
  - Prevention of future orders from flagged entities.

#### 3.2.3 Order Processing System (OPS)
- **Status Workflow:** Finite state machine implementation for order tracking (PENDING -> CONFIRMED -> PROCESSING -> DELIVERED).
- **Returns Management (RMA):** Dedicated module for handling customer return requests, tracking reverse logistics, and processing refunds or store credit.
- **Invoice Generation:**
  - **One-Click Print:** Generates a standardized, receipt-style A4/Thermal invoice.
  - **Stock Committal:** Triggers the final stock deduction from the inventory ledger.
  - **Status Transition:** Automatically updates order status to INVOICE_PRINTED.

#### 3.2.4 Marketing Engine
- **Social Proof Engine:** A mechanism to display real-time or simulated "Recent Purchase" notifications (e.g., "Someone in [City] just bought [Item]") to invoke Fear Of Missing Out (FOMO) and increase conversion rates.
- **Promotions:** Rule-based coupon system (Percentage/Fixed types) with usage limits.
- **Banner Management:** Drag-and-drop interface for homepage carousel slides.

#### 3.2.5 Media Management
The system features a hybrid image management system for flexibility and reliability.

- **Primary Storage (Cloudinary):** 
  - Uses **Unsigned Client-Side Uploads** for all dynamic content (Products, Categories, Trust Badges).
  - Delivers assets via global CDN with on-the-fly transformations.
  - **Configuration:** Requires `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
  
- **Fallback Mechanism (Failsafe):**
  - Automatically detects missing Cloudinary credentials.
  - **Action:** Reverts to converting uploads to **Base64 Data URLs** and storing them directly in the database.
  - **Constraint:** Intended for development or emergency use only; triggers a "Saved locally" toast notification.


#### 3.2.6 Multi-Tenancy & SaaS Management
The system operates as a unified SaaS platform with a hierarchical permission structure.

- **Super Admin Dashboard:**
  - Accessible via `app.{platform_domain}`.
  - **Company Management:** Create, Edit, Suspend Tenants (Companies).
  - **Impersonation:** "Login As Company" feature to view specific tenant dashboards.
  - **Plan Management:** Upgrade/Downgrade tenant feature capabilities.

- **Tenant Isolation:**
  - **Data Security:** All database queries MUST be scoped by `tenantId`.
  - **Routing:** Middleware routes incoming requests to the correct tenant based on subdomain/custom domain.

## 4. Non-Functional Requirements

### 4.1 Performance
- **Core Web Vitals:** Target 'Green' scores for LCP (Largest Contentful Paint) and CLS (Cumulative Layout Shift).
- **Rendering Strategy:** Hybrid approach utilizing Server-Side Rendering (SSR) for SEO-critical pages and Client-Side Rendering (CSR) for interactive dashboards.
- **Image Optimization:** Utilization of `next/image` for automatic format conversion (AVIF/WebP) and sizing.

### 4.2 Security
- **Access Control:** Strict RBAC ensuring segregation of duties between Super Admins and Store Managers.
- **Data Protection:** Encryption at rest for sensitive user data; bcrypt hashing for credentials.
- **Compliance:** Adherence to OWASP Top 10 mitigation strategies (Sanitization, CSRF protection).

### 4.3 Scalability
- **Database:** Normalized Relational Schema (3NF) designed for high-concurrency read/write operations.
- **Infrastructure:** Stateless application tier containerize-ready (Docker/K8s) for horizontal scaling.

## 5. Technology Stack
- **Frontend Framework:** Next.js 14+ (React Server Components).
- **Styling Engine:** Tailwind CSS.
- **Data Layer:** Prisma ORM / PostgreSQL.
- **Media Layer:** Cloudinary IDM (with Local Fallback).
- **State Management:** Zustand.
- **Authentication:** Auth.js (NextAuth v5).
