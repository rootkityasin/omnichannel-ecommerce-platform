import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getRootDomain,
  isPlatformMode,
  isSuperAdminEnabled,
  isTenantMode,
} from "@/lib/deployment";
import { normalizeHost } from "@/lib/domain";

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|media/|_next/|_static/|images/|_vercel).*)",
  ],
};

/** Extract the slug (subdomain) from a hostname */
const getSlug = (hostname: string) => {
  const parts = hostname.split(".");
  // For 'crabkhai.com' → 'crabkhai', for 'shop.90slabs.com' → 'shop'
  return parts.length >= 2 ? parts[0] : hostname;
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  const rootDomain = getRootDomain();

  // Get hostname (e.g. crabkhai.com)
  const rawHostHeader =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const normalizedHost = normalizeHost(
    rawHostHeader.replace(".localhost:3000", `.${rootDomain}`),
  );
  const hostname = normalizedHost;
  const slug = getSlug(hostname);

  const searchParams = req.nextUrl.searchParams.toString();
  const path =
    searchParams.length > 0 ? `${url.pathname}?${searchParams}` : url.pathname;

  if (slug && url.pathname.startsWith(`/${slug}`)) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", url.pathname);

  const isRootMetadataFile =
    url.pathname === "/sitemap.xml" || url.pathname === "/robots.txt";
  const isStaticRootFile =
    /\.[a-z0-9]+$/i.test(url.pathname) && !isRootMetadataFile;

  if (isStaticRootFile) {
    return NextResponse.next();
  }

  // Admin device-setup guard — must run BEFORE any rewrites
  const isAdminRoute = url.pathname.startsWith("/admin");
  const isDeviceSetup = url.pathname.includes("/admin/security/device-setup");
  const isTrusted = req.cookies.get("trusted_device");

  if (isAdminRoute && !isDeviceSetup && !isTrusted) {
    return NextResponse.redirect(
      new URL("/admin/security/device-setup", req.url),
    );
  }

  const isAppHost = hostname === `app.${rootDomain}`;

  if (isTenantMode && (isAppHost || url.pathname.startsWith("/app"))) {
    return NextResponse.rewrite(new URL("/not-found", req.url), {
      request: { headers: requestHeaders },
    });
  }

  if (isAppHost) {
    if (!isPlatformMode || !isSuperAdminEnabled) {
      return NextResponse.rewrite(new URL("/not-found", req.url), {
        request: { headers: requestHeaders },
      });
    }

    return NextResponse.rewrite(
      new URL(`/app${path === "/" ? "" : path}`, req.url),
      { request: { headers: requestHeaders } },
    );
  }

  if (isRootMetadataFile) {
    return NextResponse.next();
  }

  if (hostname === "localhost" || hostname === rootDomain) {
    if (isTenantMode) {
      return NextResponse.rewrite(new URL(`/${slug}${path}`, req.url), {
        request: { headers: requestHeaders },
      });
    }

    return NextResponse.rewrite(
      new URL(`/home${path === "/" ? "" : path}`, req.url),
      { request: { headers: requestHeaders } },
    );
  }

  return NextResponse.rewrite(new URL(`/${slug}${path}`, req.url), {
    request: {
      headers: requestHeaders,
    },
  });
}
