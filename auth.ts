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
                if (!credentials?.phone || !credentials?.password) return null

                if (!credentials?.phone || !credentials?.password) return null

                // Rate Limit Check (5 attempts per minute)
                const phone = credentials.phone as string;
                if (!checkRateLimit(phone)) {
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

                if (!user || !user.password) {
                    throw new Error("User not found");
                }

                const passwordsMatch = await bcrypt.compare(credentials.password as string, user.password)

                if (passwordsMatch) {
                    return {
                        ...user,
                        id: user.id,
                    }
                }

                throw new Error("Invalid password");
            }
        }),
    ],
})
