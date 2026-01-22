
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: '/account',
    },
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = (user as any).role
                token.phone = (user as any).phone
                token.tenantId = (user as any).tenantId
            }
            return token
        },
        session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                // @ts-ignore
                session.user.role = token.role as string
                // @ts-ignore
                session.user.phone = token.phone as string
                // @ts-ignore
                session.user.tenantId = token.tenantId as string
            }
            return session
        },
        authorized({ auth, request: nextUrl }) {
            const isLoggedIn = !!auth?.user;
            const isOnAdmin = nextUrl.nextUrl.pathname.startsWith('/admin');

            if (isOnAdmin) {
                // 1. Role Check
                if (!isLoggedIn) return false;
                if ((auth?.user as any)?.role !== 'SUPER_ADMIN' && (auth?.user as any)?.role !== 'HUB_ADMIN') return false;

                // 2. Device Check
                const isDeviceSetup = nextUrl.nextUrl.pathname.startsWith('/admin/security/device-setup');
                const deviceCookie = nextUrl.cookies.get('trusted_device');

                if (!deviceCookie && !isDeviceSetup) {
                    return Response.redirect(new URL('/admin/security/device-setup', nextUrl.url).toString());
                }

                return true;
            }

            // Redirect Admin to Dashboard if they try to access Login/Account page
            const isOnAccount = nextUrl.nextUrl.pathname.startsWith('/account');
            if (isOnAccount && isLoggedIn) {
                const userRole = (auth?.user as any)?.role;
                if (userRole === 'SUPER_ADMIN' || userRole === 'HUB_ADMIN') {
                    return Response.redirect(new URL('/admin', nextUrl.url));
                }
            }

            return true;
        },
    },
    providers: [], // Providers added in auth.ts
    session: { strategy: "jwt" },
} satisfies NextAuthConfig
