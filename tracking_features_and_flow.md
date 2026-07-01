# Server-Side Tracking Configuration & Data Flow

This document outlines the high-value features of our Server-Side Tracking setup (suited for price charts or service descriptions) followed by the tracking data flow architecture.

---

## 1. Feature Description (For Price Charts)

* **Server-Side Conversions API (CAPI)**: Sends e-commerce events directly from the VPS server to Meta’s backend, bypassing ad-blockers and iOS privacy restrictions.
* **Unified Event ID Deduplication**: Implements matching `event_id` tokens between GTM (browser) and CAPI (server) to allow Meta to merge duplicate signals.
* **Secure SHA-256 Hashed User Matching**: Hashes names, phone numbers, and email addresses client-side/server-side to increase the Event Match Quality score securely.
* **Full E-commerce Funnel Integration**: Automatically tracks customer actions from PageView, ViewContent, AddToCart, InitiateCheckout, to Purchase.
* **Real-Time Diagnostic & Test Support**: Supports standard API variables like `test_event_code` to allow testing server events live in Events Manager.

---

## 2. Tracking Data Flow Diagram

```mermaid
graph TD
    A["Customer Action (e.g., Purchase or AddToCart)"] -->|1. Generate Event ID: XYZ| B("Client Side (GTM / Browser)")
    A -->|1. Generate Event ID: XYZ| C("Server Side (VPS / Next.js backend)")

    B -->|2. Send Event 'XYZ'| D["Meta Pixel (Browser Signal)"]

    C -->|2. Hash Personal Data (SHA-256)<br>Name, Phone, Email, IP| E("Conversions API Payload")
    E -->|3. Send Event 'XYZ' + Hashed Data| F["Meta Conversions API (Server Signal)"]

    D --> G{"Meta Server (Deduplication Engine)"}
    F --> G

    G -->|4. Match Event ID 'XYZ' <br> Merge Browser + Server| H["100% Accurate Deduplicated Event Log"]
```

---

## 3. Custom Website Development Features (For Price Charts)

* **Custom Premium UI/UX Design**: Brand-tailored interface designed for high-conversion e-commerce.
* **Mobile-Responsive Layouts**: Fully responsive layouts optimized for mobile, tablet, and desktop viewports.
* **Admin Dashboard & CMS Integration**: User-friendly control panel to manage products, categories, orders, and configurations.
* **Conversion-Optimized Forms**: Interactive contact, subscription, and checkout forms designed to capture leads easily.
* **Page Speed & Technical SEO Setup**: Optimizes initial load times, image rendering, and configures semantic markup for search engines.
