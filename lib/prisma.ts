import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { withAccelerate } from "@prisma/extension-accelerate";

const runtimeDatabaseUrl = process.env.PRISMA_DATABASE_URL;
const fallbackDatabaseUrl = process.env.DATABASE_URL;
const connectionString = runtimeDatabaseUrl || fallbackDatabaseUrl;

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const poolMax = parsePositiveInt(process.env.PG_POOL_MAX, 8);
const poolMin = parsePositiveInt(process.env.PG_POOL_MIN, 1);
const poolIdleMs = parsePositiveInt(process.env.PG_POOL_IDLE_MS, 15_000);
const poolConnectionTimeoutMs = parsePositiveInt(
  process.env.PG_POOL_CONN_TIMEOUT_MS,
  3_000,
);
const statementTimeoutMs = parsePositiveInt(
  process.env.PG_STATEMENT_TIMEOUT_MS,
  12_000,
);
const queryTimeoutMs = parsePositiveInt(process.env.PG_QUERY_TIMEOUT_MS, 15_000);

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

// Only use the PG adapter if NOT using Accelerate (which handles its own pooling)
const useAdapter =
  !connectionString.startsWith("prisma://") &&
  !connectionString.startsWith("prisma+postgres://");

let adapter;
if (useAdapter) {
  const dbUrl = (() => {
    try {
      return new URL(connectionString);
    } catch {
      return null;
    }
  })();
  const sslMode = dbUrl?.searchParams.get("sslmode");
  const isLocalDb =
    dbUrl && ["localhost", "127.0.0.1", "::1"].includes(dbUrl.hostname);
  const pool = new Pool({
    connectionString,
    max: poolMax,
    min: Math.min(poolMin, poolMax),
    idleTimeoutMillis: poolIdleMs,
    connectionTimeoutMillis: poolConnectionTimeoutMs,
    statement_timeout: statementTimeoutMs,
    query_timeout: queryTimeoutMs,
    ssl:
      sslMode === "disable" || isLocalDb
        ? false
        : sslMode === "require"
          ? { rejectUnauthorized: false }
          : sslMode === "verify-full"
            ? { rejectUnauthorized: true }
            : process.env.NODE_ENV === "production",
  });
  adapter = new PrismaPg(pool);
}

type PrismaClientOptions = ConstructorParameters<typeof PrismaClient>[0] & {
  accelerateUrl?: string;
};

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prismaOptions: PrismaClientOptions = {
  log: ["error", "warn"],
};

if (useAdapter && adapter) {
  prismaOptions.adapter = adapter;
} else {
  // Explicitly pass connection string as accelerateUrl for Driver Adapter mode (forced by schema)
  prismaOptions.accelerateUrl = connectionString;
}

const baseClient = new PrismaClient(prismaOptions);

export const prisma: PrismaClient =
  globalForPrisma.prisma ||
  (useAdapter
    ? baseClient
    : (baseClient.$extends(withAccelerate()) as unknown as PrismaClient));

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
