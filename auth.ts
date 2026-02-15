import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"
import { checkRateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs";

const isLocal = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.includes('localhost');
const useSecureCookies = process.env.NODE_ENV === 'production' && !isLocal;
const cookiePrefix = useSecureCookies ? '__Secure-' : '';
const hostPrefix = useSecureCookies ? '__Host-' : '';

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    secret: process.env.AUTH_SECRET,
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user, trigger, session }) {
            // 1. Initial Sign In - Copy user data to token
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.phone = user.phone;
                token.tenantId = user.tenantId;
                token.permissions = user.permissions;
                return token;
            }

            // 2. Subsequent verification - Check User Existence (Throttled)
            // Checks at most once every 30 seconds to spare resources while ensuring security
            const now = Date.now();
            const lastChecked = (token.lastChecked as number) || 0;
            const CHECK_INTERVAL = 30 * 1000; // 30 seconds

            const tokenId = typeof token.id === 'string' ? token.id : undefined;

            if (!user && tokenId && (now - lastChecked > CHECK_INTERVAL)) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: tokenId },
                        select: { id: true, role: true, permissions: true, tenantId: true, phone: true }
                    });

                    if (!dbUser) {
                        console.log(`❌ Session Invalidated: User ${tokenId} not found in DB`);
                        return null;
                    }

                    // Sync latest state & Update timestamp
                    token.role = dbUser.role;
                    token.permissions = dbUser.permissions;
                    token.tenantId = dbUser.tenantId;
                    token.lastChecked = now;

                } catch (e) {
                    console.error("Session Validation Error", e);
                }
            }
            return token;
        },
    },
    // Add Secure Cookie Configuration
    cookies: {
        sessionToken: {
            name: `${cookiePrefix}next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: useSecureCookies,
            },
        },
        callbackUrl: {
            name: `${cookiePrefix}next-auth.callback-url`,
            options: {
                sameSite: 'lax',
                path: '/',
                secure: useSecureCookies,
            },
        },
        csrfToken: {
            name: `${hostPrefix}next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: useSecureCookies,
            },
        },
    },
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        Apple({
            clientId: process.env.APPLE_CLIENT_ID,
            clientSecret: process.env.APPLE_CLIENT_SECRET,
        }),
        Credentials({
            credentials: {
                phone: { label: "Phone", type: "text" },
                password: { label: "Password", type: "password" }
            },
            authorize: async (credentials) => {
                try {
                    if (!credentials?.phone || !credentials?.password) return null

                    const phoneInput = credentials.phone as string;

                    // --- Impersonation Logic ---
                    if (phoneInput.startsWith('impersonate:')) {
                        const targetUserId = phoneInput.split(':')[1];
                        const token = credentials.password as string;

                        console.log(`🔐 Impersonation Attempt for User ${targetUserId}`);

                        const verification = await prisma.verificationToken.findFirst({
                            where: {
                                identifier: `impersonate:${targetUserId}`,
                                token: token
                            }
                        });

                        if (verification && verification.expires > new Date()) {
                            console.log('✅ Impersonation Token Valid');
                            // Valid Token - Use deleteMany to avoid unique constraint issues if identifier isn't unique alone
                            await prisma.verificationToken.deleteMany({
                                where: {
                                    identifier: `impersonate:${targetUserId}`
                                }
                            });

                            const user = await prisma.user.findUnique({ where: { id: targetUserId } });
                            if (user) {
                                // Return plain object to avoid serialization issues
                                return {
                                    id: user.id,
                                    name: user.name,
                                    email: user.email,
                                    phone: user.phone,
                                    role: user.role,
                                    tenantId: user.tenantId,
                                    hubId: user.hubId,
                                    image: user.image,
                                    permissions: user.permissions
                                };
                            }
                        }
                        console.log('❌ Impersonation Token Invalid or Expired');
                        return null; // Invalid token
                    }
                    // ---------------------------

                    // Rate Limit Check (5 attempts per minute)
                    const phone = credentials.phone as string;
                    if (!await checkRateLimit(phone)) {
                        console.warn(`Rate limit exceeded for phone: ${phone}`);
                        return null;
                    }

                    // Find user by phone (or email allow)
                    const user = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { phone: credentials.phone as string },
                                { email: credentials.phone as string }
                            ]
                        }
                    })

                    if (!user?.password) {
                        console.error("User not found or password not set.");
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(credentials.password as string, user.password)

                    if (passwordsMatch) {
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            phone: user.phone,
                            role: user.role,
                            tenantId: user.tenantId,
                            hubId: user.hubId,
                            image: user.image,
                            permissions: user.permissions
                        };
                    }

                    console.error("Invalid password for user:", user.email || user.phone);
                    return null;
                } catch (e) {
                    console.error("Authorize Error:", e);
                    return null;
                }
            }
        }),
    ],
})
