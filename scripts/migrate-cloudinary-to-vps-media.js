/* eslint-disable no-console */
const { randomUUID } = require("crypto");
const { mkdir, writeFile } = require("fs/promises");
const path = require("path");
const { Pool } = require("pg");
const sharp = require("sharp");

const connectionString = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Database URL missing. Set PRISMA_DATABASE_URL or DATABASE_URL.");
}

const sslMode = (() => {
  try {
    return new URL(connectionString).searchParams.get("sslmode");
  } catch {
    return null;
  }
})();

const pool = new Pool({
  connectionString,
  max: 4,
  ssl:
    process.env.NODE_ENV === "production"
      ? sslMode === "verify-full"
        ? { rejectUnauthorized: true }
        : true
      : { rejectUnauthorized: false },
});
const dryRun = process.argv.includes("--dry-run");
const mediaRoot = path.resolve(process.env.MEDIA_ROOT || "/data/media");
const publicPath = (process.env.MEDIA_PUBLIC_PATH || "/media").replace(/\/$/, "");
const reportPath = path.resolve(
  process.env.MEDIA_MIGRATION_REPORT_PATH || "/tmp/media-migration-report.json",
);
const urlMap = new Map();
const tenantSlugs = new Map();

const variants = {
  original: "original.webp",
  card: "card.webp",
  hero: "hero.webp",
  full: "full.webp",
  thumb: "thumb.webp",
  lqip: "lqip.webp",
};

const report = {
  dryRun,
  startedAt: new Date().toISOString(),
  mediaRoot,
  migrated: [],
  skipped: [],
  failed: [],
  updatedRecords: [],
};

const isCloudinaryUrl = (value) =>
  typeof value === "string" &&
  value.includes("res.cloudinary.com") &&
  value.includes("/upload/");

const isLocalMediaUrl = (value) =>
  typeof value === "string" && value.startsWith(`${publicPath}/`);

const sanitizeSegment = (value) =>
  String(value || "uploads")
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "uploads";

const sanitizeRelativePath = (value) =>
  String(value || "uploads")
    .split("/")
    .map(sanitizeSegment)
    .filter(Boolean)
    .join("/") || "uploads";

const loadTenantSlugs = async () => {
  const tenants = await selectRows("Tenant", ["id", "slug"]);
  for (const tenant of tenants) tenantSlugs.set(tenant.id, tenant.slug);
};

const tenantPrefix = (tenantId) =>
  tenantId ? `tenants/${sanitizeSegment(tenantSlugs.get(tenantId) || tenantId)}` : "global";

const quoteIdentifier = (value) => `"${String(value).replace(/"/g, '""')}"`;

const selectRows = async (table, columns) => {
  const columnSql = columns.map(quoteIdentifier).join(", ");
  const result = await pool.query(`SELECT ${columnSql} FROM ${quoteIdentifier(table)}`);
  return result.rows;
};

const updateById = async (table, id, data, casts = {}) => {
  const keys = Object.keys(data);
  if (keys.length === 0) return;
  const assignments = keys
    .map((key, index) => {
      const cast = casts[key] ? `::${casts[key]}` : "";
      return `${quoteIdentifier(key)} = $${index + 2}${cast}`;
    })
    .join(", ");
  const values = keys.map((key) =>
    casts[key] === "json" || casts[key] === "jsonb" ? JSON.stringify(data[key]) : data[key],
  );
  await pool.query(
    `UPDATE ${quoteIdentifier(table)} SET ${assignments} WHERE "id" = $1`,
    [id, ...values],
  );
};

const createOutputDirectory = async (resource) => {
  const now = new Date();
  const mediaId = randomUUID();
  const relative = path.posix.join(
    sanitizeRelativePath(resource),
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    mediaId,
  );
  const directory = path.join(mediaRoot, ...relative.split("/"));
  await mkdir(directory, { recursive: true });
  return { directory, publicUrl: `${publicPath}/${relative}/${variants.original}` };
};

const generateVariants = async (buffer, directory) => {
  const base = sharp(buffer, { failOn: "none" }).rotate();
  await Promise.all([
    base
      .clone()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86 })
      .toFile(path.join(directory, variants.original)),
    base
      .clone()
      .resize({ width: 480, height: 600, fit: "cover", position: "attention" })
      .webp({ quality: 78 })
      .toFile(path.join(directory, variants.card)),
    base
      .clone()
      .resize({ width: 900, height: 506, fit: "cover", position: "attention" })
      .webp({ quality: 80 })
      .toFile(path.join(directory, variants.hero)),
    base
      .clone()
      .resize({ width: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(directory, variants.full)),
    base
      .clone()
      .resize({ width: 160, height: 160, fit: "cover", position: "attention" })
      .webp({ quality: 74 })
      .toFile(path.join(directory, variants.thumb)),
    base
      .clone()
      .resize({ width: 20, height: 25, fit: "cover", position: "attention" })
      .blur(8)
      .webp({ quality: 28 })
      .toFile(path.join(directory, variants.lqip)),
  ]);
};

const migrateUrl = async (url, resource) => {
  if (!url || isLocalMediaUrl(url)) return url;
  if (!isCloudinaryUrl(url)) return url;
  if (urlMap.has(url)) return urlMap.get(url);

  if (dryRun) {
    const placeholder = `${publicPath}/${sanitizeRelativePath(resource)}/DRY-RUN/${variants.original}`;
    urlMap.set(url, placeholder);
    report.migrated.push({ source: url, target: placeholder, dryRun: true });
    return placeholder;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const media = await createOutputDirectory(resource);
    await generateVariants(buffer, media.directory);
    urlMap.set(url, media.publicUrl);
    report.migrated.push({ source: url, target: media.publicUrl });
    return media.publicUrl;
  } catch (error) {
    report.failed.push({ source: url, error: String(error) });
    return url;
  }
};

const migrateStringArray = async (values, resource) => {
  if (!Array.isArray(values)) return { value: values, changed: false };
  let changed = false;
  const next = [];
  for (const value of values) {
    const migrated = await migrateUrl(value, resource);
    if (migrated !== value) changed = true;
    next.push(migrated);
  }
  return { value: next, changed };
};

const migrateJson = async (value, resource) => {
  let changed = false;
  const visit = async (node) => {
    if (typeof node === "string") {
      const migrated = await migrateUrl(node, resource);
      if (migrated !== node) changed = true;
      return migrated;
    }
    if (Array.isArray(node)) {
      const arr = [];
      for (const item of node) arr.push(await visit(item));
      return arr;
    }
    if (node && typeof node === "object") {
      const obj = {};
      for (const [key, item] of Object.entries(node)) obj[key] = await visit(item);
      return obj;
    }
    return node;
  };
  const migrated = await visit(value);
  return { value: migrated, changed };
};

const updateRecord = async (table, id, data, casts = {}) => {
  if (Object.keys(data).length === 0) return;
  report.updatedRecords.push({ table, id, data });
  if (dryRun) return;
  await updateById(table, id, data, casts);
};

const migrateProducts = async () => {
  const products = await selectRows("Product", [
    "id",
    "tenantId",
    "image",
    "images",
    "cookingImage",
    "nutritionImage",
  ]);
  for (const product of products) {
    const data = {};
    const prefix = tenantPrefix(product.tenantId);
    for (const field of ["image", "cookingImage", "nutritionImage"]) {
      const migrated = await migrateUrl(product[field], `${prefix}/products/${field}`);
      if (migrated !== product[field]) data[field] = migrated;
    }
    const images = await migrateStringArray(product.images, `${prefix}/products/gallery`);
    if (images.changed) data.images = images.value;
    await updateRecord("Product", product.id, data, { images: "text[]" });
  }
};

const migrateSimpleStringFields = async (table, fields, resource, options = {}) => {
  const records = await selectRows(table, [
    "id",
    ...(options.tenantScoped ? ["tenantId"] : []),
    ...fields,
  ]);
  for (const record of records) {
    const data = {};
    const prefix = options.tenantScoped ? tenantPrefix(record.tenantId) : "global";
    for (const field of fields) {
      const migrated = await migrateUrl(record[field], `${prefix}/${resource}/${field}`);
      if (migrated !== record[field]) data[field] = migrated;
    }
    await updateRecord(table, record.id, data);
  }
};

const migrateReviewImages = async () => {
  const reviews = await selectRows("Review", ["id", "images"]);
  for (const review of reviews) {
    const images = await migrateStringArray(review.images, "reviews");
    await updateRecord("Review", review.id, images.changed ? { images: images.value } : {}, {
      images: "text[]",
    });
  }
};

const migrateSiteConfigs = async () => {
  const configs = await selectRows("SiteConfig", [
    "id",
    "tenantId",
    "logoUrl",
    "ogImage",
    "twitterImage",
    "certificates",
  ]);
  for (const config of configs) {
    const data = {};
    const prefix = tenantPrefix(config.tenantId);
    for (const field of ["logoUrl", "ogImage", "twitterImage"]) {
      const migrated = await migrateUrl(config[field], `${prefix}/site-config/${field}`);
      if (migrated !== config[field]) data[field] = migrated;
    }
    const certificates = await migrateJson(config.certificates, `${prefix}/site-config/certificates`);
    if (certificates.changed) data.certificates = certificates.value;
    await updateRecord("SiteConfig", config.id, data, { certificates: "jsonb" });
  }
};

const migrateStorySections = async () => {
  const sections = await selectRows("StorySection", ["id", "content"]);
  for (const section of sections) {
    const content = await migrateJson(section.content, "story");
    await updateRecord("StorySection", section.id, content.changed ? { content: content.value } : {}, {
      content: "jsonb",
    });
  }
};

async function main() {
  console.log(`${dryRun ? "Dry-running" : "Running"} Cloudinary media migration...`);
  await loadTenantSlugs();
  await migrateProducts();
  await migrateSimpleStringFields("PromoCard", ["imageUrl"], "promos", { tenantScoped: true });
  await migrateSimpleStringFields("HeroSlide", ["imageUrl"], "hero-slides");
  await migrateSimpleStringFields("User", ["image"], "users", { tenantScoped: true });
  await migrateSimpleStringFields(
    "PaymentConfig",
    ["bkashLogo", "nagadLogo", "selfMfsQrCode"],
    "payment-config",
    { tenantScoped: true },
  );
  await migrateReviewImages();
  await migrateSiteConfigs();
  await migrateStorySections();
  report.finishedAt = new Date().toISOString();
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Migration report written to ${reportPath}`);
  console.log(`Migrated ${report.migrated.length}, failed ${report.failed.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
