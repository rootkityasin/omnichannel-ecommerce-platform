import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
    matcher: [
        /*
         * Match all paths except for:
         * 1. /api routes
         * 2. /_next (Next.js internals)
         * 3. /_static (inside /public)
         * 4. all root files inside /public (e.g. /favicon.ico)
         */
        '/((?!api/|_next/|_static/|images/|_vercel|[\\w-]+\\.\\w+|sitemap.xml|robots.txt).*)',
    ],
};

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl;

    // Get hostname (e.g. vercel.pub, crabkhai.com)
    const hostname = req.headers
        .get("host")!
        .replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);

    const searchParams = req.nextUrl.searchParams.toString();
    // Get the pathname of the request (e.g. /, /about, /blog/first-post)
    const path = searchParams.length > 0 ? `${url.pathname}?${searchParams}` : url.pathname;

    // Prepare request headers with x-pathname
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-pathname', url.pathname);

    // 1. Handle "App" Subdomain (Main Platform Admin)
    // e.g. app.vercel.pub -> /app
    if (hostname === `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) {
        return NextResponse.rewrite(
            new URL(`/app${path === "/" ? "" : path}`, req.url),
            { request: { headers: requestHeaders } }
        );
    }

    // 2. Handle Root Domain (Landing Page)
    // e.g. vercel.pub -> /home
    if (
        hostname === "localhost:3000" ||
        hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN
    ) {
        return NextResponse.rewrite(
            new URL(`/home${path === "/" ? "" : path}`, req.url),
            { request: { headers: requestHeaders } }
        );
    }

    // 3. Handle Tenant Domains

    // Enforce Trusted Device Check for Admin Routes
    const isAdminRoute = url.pathname.startsWith('/admin');
    const isDeviceSetup = url.pathname.includes('/admin/security/device-setup');
    const isTrusted = req.cookies.get('trusted_device');

    if (isAdminRoute && !isDeviceSetup && !isTrusted) {
        return NextResponse.redirect(new URL('/admin/security/device-setup', req.url));
    }

    return NextResponse.rewrite(new URL(`/${hostname}${path}`, req.url), {
        request: {
            headers: requestHeaders,
        },
    });
}
