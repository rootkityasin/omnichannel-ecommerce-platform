import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { PrismaAdapter } from "@auth/prisma-adapter";
import { platformPrisma } from "@/lib/platformPrisma";

export const runtime = "nodejs";

const isLocal = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.includes("localhost");
const useSecureCookies = 
  process.env.NODE_ENV === "production" && 
  !isLocal &&
  process.env.NEXTAUTH_URL?.startsWith("https://");

export const { handlers: platformHandlers, auth: platformAuth } = NextAuth({
  basePath: "/api/platform-auth",
  trustHost: true,
  secret: process.env.PLATFORM_AUTH_SECRET || process.env.AUTH_SECRET,
  pages: {
    signIn: "/app/login",
  },
  session: { strategy: "jwt" },
  adapter: PrismaAdapter(platformPrisma),
  cookies: {
    sessionToken: {
      name: "platform-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: "platform-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: "platform-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "SUPER_ADMIN";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "SUPER_ADMIN";
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email);
        const password = String(credentials.password);
        const user = await platformPrisma.user.findUnique({
          where: { email },
        });
        if (!user || !user.isActive) return null;
        const passwordOk = await bcrypt.compare(password, user.password);
        if (!passwordOk) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});
