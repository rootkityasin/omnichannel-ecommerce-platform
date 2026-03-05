import { PrismaClient } from "@prisma/client";

import { withAccelerate } from "@prisma/extension-accelerate";

const runtimeDatabaseUrl = process.env.PRISMA_DATABASE_URL;
const fallbackDatabaseUrl = process.env.DATABASE_URL;
const connectionString = runtimeDatabaseUrl || fallbackDatabaseUrl;

const sanitizeDbUrl = (value?: string) => {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return value;
  }
};

if (
  runtimeDatabaseUrl &&
  fallbackDatabaseUrl &&
  runtimeDatabaseUrl !== fallbackDatabaseUrl
) {
  console.warn(
    "[Prisma Config Warning] PRISMA_DATABASE_URL and DATABASE_URL are different.",
    {
      runtime: sanitizeDbUrl(runtimeDatabaseUrl),
      fallback: sanitizeDbUrl(fallbackDatabaseUrl),
    },
  );
}

if (!connectionString) {
  throw new Error(
    "Database URL missing. Set PRISMA_DATABASE_URL or DATABASE_URL.",
  );
}

type PrismaClientOptions = ConstructorParameters<typeof PrismaClient>[0] & {
  accelerateUrl?: string;
};

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prismaOptions: PrismaClientOptions = {
  log: ["error", "warn"],
};

export const baseClient = new PrismaClient(prismaOptions);

export const prisma: PrismaClient =
  globalForPrisma.prisma ||
  (connectionString.startsWith("prisma://") || connectionString.startsWith("prisma+postgres://")
    ? (baseClient.$extends(withAccelerate()) as unknown as PrismaClient)
    : baseClient);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
