# Omnichannel Ecommerce Platform

This is a premium e-commerce platform dedicated to live seafood delivery, specifically engineered for scalability, security, and enterprise-grade compliance. It facilitates omnichannel operations, connecting online storefronts with kitchen management and logistics systems.

## System Overview

- **Frontend**: [http://localhost:3000](http://localhost:3000) (Tenant app)
- **Super Admin (Local Only)**: [http://app.localhost](http://app.localhost)
- **Technology Stack**: Next.js 16 (App Router), Prisma ORM, PostgreSQL, Tailwind CSS, Radix UI.
- **Architecture**: Local control-plane + tenant-only production deployments.

---

## Enterprise Compliance & Security

This project adheres to professional engineering standards, implementing controls inspired by ISO 9001, ISO 27001, and SOC 2 frameworks.

### Certification Readiness Matrix

| Standard      | Control                           | Implementation Evidence                                  |
| :------------ | :-------------------------------- | :------------------------------------------------------- |
| **ISO 27001** | **A.14.2.8** (System Testing)     | Automated Security Unit Tests (`lib/rate-limit.test.ts`) |
| **ISO 27001** | **A.12.6.1** (Vulnerability Mgmt) | ZAP Audit + Automated Dependency Scanning                |
| **ISO 9001**  | **8.1** (Operational Planning)    | CI/CD Pipeline via GitHub Actions                        |
| **ISO 9001**  | **7.5.3** (Documented Info)       | Full Compliance Documentation (`docs/ISO_COMPLIANCE.md`) |
| **SOC 2**     | **A1.1** (Availability)           | Automated Health Monitoring (`/api/health`)              |
| **GDPR**      | **Art. 25** (Privacy by Design)   | Data Minimization & Cookie Consent Architecture          |

### Security Measures

- **Content Security Policy (CSP)**: Strict restrictions on script sources to prevent XSS.
- **Audit Logging**: Comprehensive database logging of critical administrative actions (create, update, delete) for accountability.
- **Rate Limiting**: Adaptive traffic throttling on API endpoints.
- **Device Authorization**: Cookie-based trusted device verification for admin access (2-Hour Persistence).
- **Dynamic Secure Cookies**: Intelligent cookie policy that enforces `Secure` (HTTPS) in production while automatically allowing HTTP for localhost testing.

---

## Technical Features

### Version 2.3 (Enterprise)

- **Audit Logging**: Forensic-grade logging system tracking user actions, entity changes, and timestamps for full accountability.
- **System Health Checks**: Automated `/api/health` endpoint monitoring database connectivity and system uptime (SOC 2 requirement).
- **Edge Caching**: Implemented Prisma Accelerate with SWR (Stale-While-Revalidate) strategy, reducing database load by approximately 90%.
- **ISR Implementation**: Incremental Static Regeneration configured for user facing pages (`/`, `/menu`) to ensure sub-second page loads.
- **Smart Access Control**: Dynamic security cookies that adapt to environment (Local vs Prod) with a strict 2-hour re-verification window.

### Core Capabilities

- **Kitchen Management System**: Kanban-style order board for restaurant operations.
- **Stock Management**: Inventory tracking with lazy deduction upon invoice generation.
- **Client Intelligence**: Automated tagging system for returning customers and blocklist management for fraudulent accounts.
- **Invoice Generation**: Integrated thermal and A4 invoice printing.
- **Multi-Language Support**: Smart fallback translation system (EN, BN, CTG, NOA).

---

## Local Platform Mode

- Super Admin only runs on `app.localhost` and never ships to production.
- Control-plane DB uses `PLATFORM_DATABASE_URL`.
- Tenant production deployments use `DEPLOYMENT_MODE=tenant` and do not expose `/app`.

---

## Performance Engineering

The platform includes rigorous optimizations to minimize resource usage and latency.

### Caching Strategy

| Type             | Technology          | Use Case          | TTL           |
| :--------------- | :------------------ | :---------------- | :------------ |
| **Edge Cache**   | Prisma Accelerate   | Database Queries  | 60s (SWR 5m)  |
| **Page Cache**   | Next.js ISR         | Public Pages      | 60s           |
| **Memory Cache** | Request Memoization | Config & Settings | Request Scope |

### Frontend Optimization

- **React Strict Mode Compliance**: `useRef` guards prevent duplicate effects and API calls during development.
- **Bundle Optimization**: Source maps disabled in production; external packages excluded from the server bundle.
- **Debouncing**: Custom hooks manage search inputs and scroll events to reduce main-thread blocking.

### 📊 Load Test Benchmarks

Benchmarks performed on standard local hardware. Cloud deployment (Vercel) expected to scale 10x-50x higher.

| Scenario           | Environment            | Req/Sec    | Latency  | Est. Capacity    |
| :----------------- | :--------------------- | :--------- | :------- | :--------------- |
| **Development**    | Local `npm run dev`    | ~20 RPS    | 2.2s     | ~200 Users       |
| **Production**     | Local `npm start`      | ~50 RPS    | 1.0s     | ~2,250 Users     |
| **Mobile Traffic** | Production (Simulated) | **66 RPS** | **0.7s** | **~3,000 Users** |

> _Verified via Autocannon with 50 concurrent connections._

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL Database

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/rootkityasin/omnichannel-ecommerce-platform.git
   cd omnichannel-ecommerce-platform
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Database Setup**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start Development Server**

   ```bash
   npm run dev
   ```

5. **Verify System Integrity**
   Run the automated test suite to verify ISO security controls:
   ```bash
   npm test
   ```

---

## Project Structure

```
omnichannel-ecommerce-platform/
├── app/                  # Application Routes (Next.js App Router)
│   ├── (client)/         # Public Storefront
│   ├── admin/            # Administrative Dashboard
│   ├── api/              # API Endpoints (Health, Webhooks)
│   └── actions/          # Server Actions (Business Logic)
├── components/           # React Components
├── lib/                  # Shared Utilities (Auth, Logger, Prisma)
├── prisma/               # Database Schema & Migrations
├── public/               # Static Assets
├── docs/                 # Engineering Documentation
└── .github/              # CI/CD Workflows
```

## Contributing

Please refer to the documentation in the `docs/` directory for coding standards and contribution guidelines.

---

_Maintained by 90sX Engineering Team_
