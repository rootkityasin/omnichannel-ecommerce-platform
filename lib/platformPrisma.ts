/* eslint-disable @typescript-eslint/no-require-imports */
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { isPlatformMode, isSuperAdminEnabled } from "@/lib/deployment";

const runtimeDatabaseUrl = process.env.PLATFORM_DATABASE_URL;
const shouldInit = isPlatformMode && isSuperAdminEnabled;

type PlatformPrismaClient = Record<string, any>;

type PrismaClientOptions = {
  adapter?: unknown;
  log?: Array<"query" | "info" | "warn" | "error">;
  accelerateUrl?: string;
};

const globalForPrisma = globalThis as unknown as {
  platformPrisma?: PlatformPrismaClient;
};

const createDisabledClient = () =>
  new Proxy({} as PlatformPrismaClient, {
    get() {
      throw new Error("Platform database is disabled in this deployment.");
    },
  });

const createClient = () => {
  if (!runtimeDatabaseUrl) {
    throw new Error("PLATFORM_DATABASE_URL is required for platform mode.");
  }

  const useAdapter =
    !runtimeDatabaseUrl.startsWith("prisma://") &&
    !runtimeDatabaseUrl.startsWith("prisma+postgres://");

  let adapter;
  if (useAdapter) {
    const dbUrl = (() => {
      try {
        return new URL(runtimeDatabaseUrl);
      } catch {
        return null;
      }
    })();
    const sslMode = dbUrl?.searchParams.get("sslmode");
    const isLocalDb =
      dbUrl && ["localhost", "127.0.0.1", "::1"].includes(dbUrl.hostname);
    const pool = new Pool({
      connectionString: runtimeDatabaseUrl,
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

  const prismaOptions: PrismaClientOptions = {
    log: ["error", "warn"],
  };

  if (useAdapter && adapter) {
    prismaOptions.adapter = adapter;
  } else if (runtimeDatabaseUrl.startsWith("prisma://")) {
    prismaOptions.accelerateUrl = runtimeDatabaseUrl;
  }

  const { PrismaClient } = require("@prisma/platform-client") as {
    PrismaClient: new (options: PrismaClientOptions) => PlatformPrismaClient;
  };
  return new PrismaClient(prismaOptions);
};

const baseClient = shouldInit
  ? globalForPrisma.platformPrisma || createClient()
  : createDisabledClient();

export const platformPrisma: PlatformPrismaClient = baseClient;

if (shouldInit && process.env.NODE_ENV !== "production") {
  globalForPrisma.platformPrisma = platformPrisma;
}
