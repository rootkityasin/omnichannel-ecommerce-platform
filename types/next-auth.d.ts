import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role?: Role | string;
    phone?: string | null;
    tenantId?: string | null;
    hubId?: string | null;
    permissions?: string[];
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: Role | string;
      phone?: string | null;
      tenantId?: string | null;
      hubId?: string | null;
      permissions?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role | string;
    phone?: string | null;
    tenantId?: string | null;
    hubId?: string | null;
    permissions?: string[];
    lastChecked?: number;
  }
}
