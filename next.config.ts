import type { NextConfig } from "next";
import pkg from "./package.json" with { type: "json" };

const rustfsUrl = process.env.RUSTFS_PUBLIC_URL || process.env.RUSTFS_ENDPOINT;
const rustfsPublicBaseUrl = (() => {
  if (process.env.RUSTFS_PUBLIC_URL) return process.env.RUSTFS_PUBLIC_URL.replace(/\/$/, "");
  if (!process.env.RUSTFS_ENDPOINT || !process.env.RUSTFS_BUCKET) return "";
  return `${process.env.RUSTFS_ENDPOINT.replace(/\/$/, "")}/${process.env.RUSTFS_BUCKET}`;
})();
const rustfsImageSource = (() => {
  if (!rustfsUrl) return null;
  try {
    const parsed = new URL(rustfsUrl);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return null;
  }
})();

const rustfsRemotePattern = (() => {
  if (!rustfsUrl) return null;
  try {
    const parsed = new URL(rustfsUrl);
    return {
      protocol: parsed.protocol.replace(":", "") as "http" | "https",
      hostname: parsed.hostname,
    };
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || pkg.version,
    NEXT_PUBLIC_RUSTFS_PUBLIC_BASE_URL: rustfsPublicBaseUrl,
  },
  // Enable standalone output for Docker deployment
  output: "standalone",

  // Experimental features
  experimental: {
    esmExternals: true,
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  // Compiler options
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  // Image Optimization - Allow remote images
  images: {
    unoptimized: true, // Crucial for VPS CPU performance with many images
    remotePatterns: [
      { protocol: "https", hostname: "*.easykoro.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
      { protocol: "https", hostname: "www.transparenttextures.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      ...(rustfsRemotePattern ? [rustfsRemotePattern] : []),
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
  serverExternalPackages: ["@aws-sdk/client-s3", "@prisma/client", "pg", "sharp"],

  // Disable X-Powered-By header
  poweredByHeader: false,

  // Security Headers
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        source: "/menu",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
      // Cache control for static assets
      {
        source: "/logo.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
