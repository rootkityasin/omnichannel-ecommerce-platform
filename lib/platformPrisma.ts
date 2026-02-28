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
    const sslMode = (() => {
      try {
        return new URL(runtimeDatabaseUrl).searchParams.get("sslmode");
      } catch {
        return null;
      }
    })();
    const pool = new Pool({
      connectionString: runtimeDatabaseUrl,
      ssl:
        process.env.NODE_ENV === "production"
          ? sslMode === "verify-full"
            ? { rejectUnauthorized: true }
            : true
          : { rejectUnauthorized: false },
    });
    adapter = new PrismaPg(pool);
  }

  const prismaOptions: PrismaClientOptions = {
    log: ["error", "warn"],
  };

  if (useAdapter && adapter) {
    prismaOptions.adapter = adapter;
  } else {
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
