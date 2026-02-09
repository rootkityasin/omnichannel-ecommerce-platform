
import type { NextAuthConfig } from "next-auth"
import type { Role } from "@prisma/client"

export const authConfig = {
    pages: {
        signIn: '/account',
    },
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                // console.log("🔑 JWT Callback: User Login", user.role);
                token.id = user.id
                token.role = user.role
                token.phone = user.phone
                token.tenantId = user.tenantId
                token.permissions = user.permissions
            }
            return token
        },
        session({ session, token }) {
            if (token && session.user) {
                const role = typeof token.role === 'string' ? (token.role as Role) : undefined
                const phone = typeof token.phone === 'string' ? token.phone : undefined
                const tenantId = typeof token.tenantId === 'string' ? token.tenantId : undefined
                const permissions = Array.isArray(token.permissions) ? token.permissions : undefined
                session.user.id = token.id as string
                session.user.role = role
                session.user.phone = phone
                session.user.tenantId = tenantId
                session.user.permissions = permissions
            }
            return session
        },
        authorized({ auth, request: nextUrl }) {
            const isLoggedIn = !!auth?.user;
            const isOnAdmin = nextUrl.nextUrl.pathname.startsWith('/admin');

            // console.log(`🛡️ Middleware Check: ${nextUrl.nextUrl.pathname}, LoggedIn: ${isLoggedIn}, Role: ${(auth?.user as any)?.role}`);

            if (isOnAdmin) {
                // 1. Role Check
                if (!isLoggedIn) return false;
                if (auth?.user?.role !== 'SUPER_ADMIN' &&
                    auth?.user?.role !== 'TENANT_ADMIN' &&
                    auth?.user?.role !== 'HUB_ADMIN' &&
                    auth?.user?.role !== 'STAFF') {
                    console.log("⛔ Access Denied: Insufficient Role", auth?.user?.role);
                    return false;
                }

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
                const userRole = auth?.user?.role;
                if (userRole && ['SUPER_ADMIN', 'TENANT_ADMIN', 'HUB_ADMIN', 'STAFF'].includes(userRole)) {
                    return Response.redirect(new URL('/admin', nextUrl.url));
                }
            }

            return true;
        },
    },
    providers: [], // Providers added in auth.ts
    session: { strategy: "jwt" },
} satisfies NextAuthConfig
