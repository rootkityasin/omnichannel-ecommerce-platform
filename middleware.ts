
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
        "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
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
    const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""
        }`;

    // 1. Handle "App" Subdomain (Main Platform Admin)
    // e.g. app.vercel.pub -> /app
    if (hostname === `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) {
        return NextResponse.rewrite(
            new URL(`/app${path === "/" ? "" : path}`, req.url)
        );
    }

    // 2. Handle Root Domain (Landing Page)
    // e.g. vercel.pub -> /home
    if (
        hostname === "localhost:3000" ||
        hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN
    ) {
        return NextResponse.rewrite(
            new URL(`/home${path === "/" ? "" : path}`, req.url)
        );
    }

    // 3. Handle Tenant Domains
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-pathname', url.pathname);

    return NextResponse.rewrite(new URL(`/${hostname}${path}`, req.url), {
        request: {
            headers: requestHeaders,
        },
    });
}
