# Software Requirements Specification (SRS)
**Version:** 1.0.0
**Last Updated:** 2026-01-31

## 1. System Overview
**Crab & Khai** is a high-performance, omnichannel e-commerce platform built on **Next.js 15 (App Router)**. It features a multi-tenant architecture (supporting Subdomains and Custom Domains) and a robust Admin Dashboard.

## 2. Key Architecture Features

### 2.1 Caching System (High Performance)
The platform implements a multi-layer caching strategy to ensure sub-second response times and reduced database load.

*   **Layer 1: Database Caching (Prisma Accelerate)**
    *   **Technology**: Prisma Accelerate (Edge Caching & Connection Pooling).
    *   **Strategy**: query-level caching for high-read/low-write data.
    *   **TTL**: Auto-cached based on query frequency and data volatility.

*   **Layer 2: Application Data Cache**
    *   **Technology**: Next.js `unstable_cache` API.
    *   **Mechanism**: Functions like `getHomeSections` are memoized and cached in the Data Cache.
    *   **Revalidation**: Uses **Tag-based Revalidation** (`revalidateTag`). When data changes (checkouts, inventory updates), specific cache tags are invalidated instantly.

*   **Layer 3: Payload Optimization**
    *   **Selective Fetching**: API responses (e.g., Homepage) are optimized to fetch only essential fields (`id`, `title`, `price`, `image`), reducing payload size by ~70% and avoiding Vercel's 2MB limit.
    *   **Pagination**: Lists are limited (e.g., Top 12 Products) to prevent over-fetching.

### 2.2 Security Architecture
A "Defense in Depth" approach securing the Admin Panel.

*   **Trusted Device Enforcement**:
    *   **Middleware Guard**: `middleware.ts` intercepts **ALL** requests to `/admin/*`.
    *   **Verification**: Checks for `trusted_device` cookie. If missing, forces redirect to Device Setup.
    *   **Bypass Prevention**: Server-side logic prevents bypassing checks via client-side routing.

*   **Admin Access Control**:
    *   **Setup Token**: Requires a secure, rotating `ADMIN_SETUP_SECRET` to authorize new devices.
    *   **Session Management**: NextAuth.js (v5) handles session validation alongside device trust checks.

### 2.3 Automation & Self-Healing
*   **Auto-Seeding**: The `HomeSection` system is self-healing. If a deployment (or local environment) lacks configuration, the system automatically detects this on the first visit and:
    1.  Creates default sections (Best Sellers, New Arrivals).
    2.  Populates them with existing inventory.
    3.  Self-repairs without manual admin intervention.

## 3. Technology Stack
*   **Framework**: Next.js 15 (App Router, Server Actions)
*   **Database**: PostgreSQL + Prisma ORM
*   **Authentication**: NextAuth.js v5
*   **Storage**: Cloudinary (Organized by Project Folder)
*   **UI**: Tailwind CSS, Lucide React, Radix UI

## 4. Future Roadmap
*   **Real-Time Order Sync**: WebSockets for admin order dashboard.
*   **Advanced Analytics**: Customer retention and cohort analysis.
