# Environment Setup Guide

## Required Environment Variables

### 1. Database & Infrastructure

```env
DATABASE_URL="postgresql://user:password@host:port/db?schema=public"
DIRECT_URL="postgresql://user:password@host:port/db?schema=public" # For migrations
PLATFORM_DATABASE_URL="postgresql://user:password@host:port/platform_db?schema=public"
```

### 2. Authentication (NextAuth)

```env
AUTH_SECRET="generate-a-random-string-here" # Run `openssl rand -base64 32`
PLATFORM_AUTH_SECRET="another-strong-secret-for-platform"
NEXT_PUBLIC_ROOT_DOMAIN="localhost:3000" # or your production domain
```

### 3. Security (CRITICAL)

```env
# REQUIRED: Prevents unauthorized admin access
ADMIN_SETUP_SECRET="change-this-to-a-secure-random-string"
```

### 6. Deployment Mode

```env
DEPLOYMENT_MODE=platform # platform | tenant
SUPER_ADMIN_ENABLED=true
```

### 4. OAuth Providers (Google)

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 5. Optional (Recommended for Production)

```env
# Upstash Redis (For Rate Limiting)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="hit..."

# Analytics
NEXT_PUBLIC_ANALYTICS_ID="Vercel-Analytics-ID"
```

## How to obtain credentials

### Google OAuth

1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  APIs & Services > Credentials > Create Credentials > OAuth client ID.
3.  **Authorized Origins**: `http://localhost:3000` (and `https://your-domain.com`).
4.  **Authorized Redirect URIs**: `http://localhost:3000/api/auth/callback/google` (and `https://your-domain.com/api/auth/callback/google`).

### Admin Setup Secret

1.  Generate a strong random string (e.g., using a password manager).
2.  Set this in your `.env` (local) and Vercel Environment Variables (production).
3.  **Note**: If this is not set, admin features requiring authorization will fail securely.
