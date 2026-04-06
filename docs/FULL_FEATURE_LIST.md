# Comprehensive Feature List - Omnichannel E-Commerce Platform

This document provides a complete inventory of all business and technical features available in the project, consolidated from all system documentation, requirements (SRS), and architectural designs.

---

## 1. Core Technical Excellence ("Plus" Features)

These features represent the advanced engineering standards implemented in the platform for performance, reliability, and security.

### 1.1 Multi-Layered Caching Strategy

- **L1 Database Caching**: Prisma Accelerate for edge-based query result caching and connection pooling.
- **L2 Server-Side Memoization**: Next.js `unstable_cache` for expensive computations (e.g., product sections, menu data).
- **L3 Edge/CDN Caching**: Static assets and ISR pages cached at Vercel/Cloudflare Edge with granular TTLs.
- **L4 Client-Side Acceleration**: Prefetching menu data into `sessionStorage` and Zustand for instant navigation.
- **Tag-Based Invalidation**: On-demand cache purging via `revalidateTag` for real-time updates.

### 1.2 Infrastructure & DevSecOps

- **ISO-Inspired Quality Gate**: CI/CD pipeline (GitHub Actions) enforcing linting, type safety (TSC), and behavioral verification (Vitest).
- **2-Layer Automated Backup System**:
  - **Layer 1**: Local VPS encrypted snapshots (CRON).
  - **Layer 2**: Remote off-site pull backups (Windows Task Scheduler over SSH).
- **Self-Healing Seeding**: Automatic detection and provisioning of default UI sections upon first tenant access.
- **Dockerized Deployment**: Fully containerized environment optimized for Dokploy/VPS hosting.

### 1.3 Image & Asset Optimization

- **Cloudinary Integration**: Automated transformation pipeline (WebP/AVIF conversion).
- **Canonical Crops**: Dynamic resizing for Product Cards (4:5), Hero (16:9), and Thumbnails (1:1).
- **Lazy Loading & LQIP**: Low-Quality Image Placeholders (LQIP) with blur effects for faster perceived performance.

---

## 2. Business & Functional Features

Features designed to support multi-tenant e-commerce operations across different industries (Restaurant, Retail).

### 2.1 Multi-Tenant Architecture

- **Logical Isolation**: Data segregation enforced at the application and DB layer via `tenantId`.
- **Physical Isolation Support**: Capability to deploy dedicated database instances per tenant for maximum security.
- **Custom Domain Engine**: Support for custom root domains and subdomains per shop.
- **Plan-Gated Features**: Tiered service plans (Silver, Gold, Platinum) with resource limits (Orders, Products, Staff).

### 2.2 Customer Storefront

- **Omnichannel UI**: Responsive design optimized for Mobile, Tablet, and Desktop.
- **Advanced Cart Management**: Persistent cart with variant support (e.g., Weight, PCS).
- **Premium Checkout Flow**: Swipeable mobile drawer and multi-step desktop checkout.
- **Order Tracking**: Real-time status updates and order history.
- **AI-Powered Interactions**: Product recommendations and descriptions potential via Gemini AI.

### 2.3 Admin Dashboard

- **Inventory & Product Management**: Support for modifiers (addons), categories, and multi-hub stock tracking.
- **Order Fulfillment Console**: Dedicated interfaces for order processing and status management.
- **Kitchen Kanban (Restaurant Mode)**: Specialized board for live order preparation and tracking.
- **Lead Management & CRM**: Customer data tracking with LabsMail integration for email campaigns.
- **Trust & Security Center**: Trusted device authorization and audit log monitoring.

---

## 3. Security & Compliance Features

Adherence to high-security standards (inspired by ISO 27001).

- **Trusted Device Enforcement**: Middleware-level guard requiring device authorization for admin access.
- **Audit Logging**: Detailed tracking of critical actions (Price changes, Security settings) in `AuditLog` and `SecurityLog`.
- **RBAC (Role-Based Access Control)**: Strict permissions for Super Admin, Tenant Admin, and Staff/Kitchen roles.
- **Rate Limiting**: Custom implementation to prevent brute-force attacks on sensitive endpoints.
- **Secure Session Management**: NextAuth.js v5 with JWT rotation and periodic re-verification.

---

## 4. Strategic Integrations

- **LabsMail**: Automated lead export and campaign synchronization.
- **Cloudinary**: Centralized, tenant-scoped media storage.
- **Prisma Accelerate**: Distributed data acceleration and pooling.

---

## 5. Technical Stack Summary

- **Framework**: Next.js 15 (App Router, Server Actions).
- **Language**: TypeScript (Strict Mode).
- **Database**: PostgreSQL 18 (Self-hosted/Managed).
- **Authentication**: NextAuth.js v5.
- **Styling**: TailwindCSS + Framer Motion (Animations).
- **State Management**: Zustand.
- **Testing**: Vitest + Playwright.
