require("dotenv/config");

const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const tenantDbUrl = process.env.DATABASE_URL;
const platformDbUrl = process.env.PLATFORM_DATABASE_URL;

const tenantSlug = process.env.TENANT_SLUG || "crabkhai";
const targetPlan = "PLATINUM";

const metaPixelId = process.env.CRABKHAI_META_PIXEL_ID;
const metaAccessToken = process.env.CRABKHAI_META_ACCESS_TOKEN;

if (!tenantDbUrl) {
  console.error("❌ DATABASE_URL is missing from environment");
  process.exit(1);
}

if (!metaPixelId || !metaAccessToken) {
  console.error(
    "❌ Missing CRABKHAI_META_PIXEL_ID or CRABKHAI_META_ACCESS_TOKEN",
  );
  process.exit(1);
}

const createTenantClient = () => {
  const pool = new Pool({
    connectionString: tenantDbUrl,
    ssl:
      process.env.NODE_ENV === "production"
        ? true
        : { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  return { prisma, pool };
};

const createPlatformClient = () => {
  if (!platformDbUrl) return null;
  // Lazily require platform client to avoid errors when not generated.
  let PlatformPrismaClient;
  try {
    ({
      PrismaClient: PlatformPrismaClient,
    } = require("@prisma/platform-client"));
  } catch (error) {
    console.warn(
      "⚠️  Platform client not available; skipping platform update.",
    );
    return null;
  }

  const pool = new Pool({
    connectionString: platformDbUrl,
    ssl:
      process.env.NODE_ENV === "production"
        ? true
        : { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PlatformPrismaClient({ adapter });
  return { prisma, pool };
};

async function main() {
  const { prisma, pool } = createTenantClient();
  const platform = createPlatformClient();

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true, plan: true },
    });

    if (!tenant) {
      console.error(`❌ Tenant not found for slug: ${tenantSlug}`);
      process.exit(1);
    }

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { plan: targetPlan },
    });

    const siteConfig = await prisma.siteConfig.findUnique({
      where: { tenantId: tenant.id },
      select: { id: true },
    });

    if (!siteConfig) {
      console.error(`❌ SiteConfig not found for tenant: ${tenantSlug}`);
      process.exit(1);
    }

    await prisma.siteConfig.update({
      where: { id: siteConfig.id },
      data: { metaPixelId, metaAccessToken },
    });

    if (platform) {
      await platform.prisma.tenantRegistry.updateMany({
        where: { slug: tenantSlug },
        data: { planSlug: targetPlan },
      });
      console.log("✅ Platform plan updated.");
    } else {
      console.log("ℹ️  Platform update skipped (no PLATFORM_DATABASE_URL). ");
    }

    console.log(`✅ Updated ${tenant.name} to ${targetPlan}.`);
    console.log("✅ Meta Pixel and CAPI access token updated.");
  } finally {
    await prisma.$disconnect();
    await pool.end();
    if (platform) {
      await platform.prisma.$disconnect();
      await platform.pool.end();
    }
  }
}

main().catch((error) => {
  console.error("❌ Update failed:", error);
  process.exit(1);
});
