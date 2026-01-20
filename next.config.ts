import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Experimental features
  experimental: {
    esmExternals: true,
  },

  // Image Optimization - Allow remote images
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.easykoro.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google avatars
    ],
    // Reduce image sizes for faster load
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Enable gzip compression
  compress: true,

  // Reduce bundle size in production
  productionBrowserSourceMaps: false,

  // Reduce logging in production
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  // Optimize server actions
  serverExternalPackages: ['@prisma/client', 'pg'],

  // Disable X-Powered-By header
  poweredByHeader: false,

  // Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://*.facebook.net", // kept unsafe-inline/eval for now to prevent breakage, but will review if possible to remove
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' blob: data: https://**.easykoro.com https://images.unsplash.com https://res.cloudinary.com https://lh3.googleusercontent.com https://*.facebook.com https://*.fbcdn.net",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://vitals.vercel-insights.com https://graph.facebook.com https://*.fbcdn.net",
              "frame-src 'self' https://*.facebook.com",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // Changed to SAMEORIGIN as recommended
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload', // Increased max-age to 2 years
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()', // Fixed typo 'geolocations' -> 'geolocation'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://www.crabkhai.com', // Restrict cross-origin access
          },
        ],
      },
      // Cache control for static assets
      {
        source: '/logo.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
