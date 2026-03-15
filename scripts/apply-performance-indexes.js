require("dotenv/config");

const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const INDEX_QUERIES = [
  'CREATE INDEX IF NOT EXISTS "Product_tenantId_createdAt_idx" ON "Product" ("tenantId", "createdAt")',
  'CREATE INDEX IF NOT EXISTS "Product_tenantId_stage_idx" ON "Product" ("tenantId", "stage")',
  'CREATE INDEX IF NOT EXISTS "Product_tenantId_categoryId_idx" ON "Product" ("tenantId", "categoryId")',
  'CREATE INDEX IF NOT EXISTS "Product_tenantId_isAvailable_idx" ON "Product" ("tenantId", "isAvailable")',
  'CREATE INDEX IF NOT EXISTS "Inventory_hubId_productId_idx" ON "Inventory" ("hubId", "productId")',
  'CREATE INDEX IF NOT EXISTS "Expense_hubId_date_idx" ON "Expense" ("hubId", "date")',
  'CREATE INDEX IF NOT EXISTS "Order_tenantId_createdAt_idx" ON "Order" ("tenantId", "createdAt")',
  'CREATE INDEX IF NOT EXISTS "Order_tenantId_status_createdAt_idx" ON "Order" ("tenantId", "status", "createdAt")',
  'CREATE INDEX IF NOT EXISTS "Order_tenantId_source_createdAt_idx" ON "Order" ("tenantId", "source", "createdAt")',
  'CREATE INDEX IF NOT EXISTS "Order_tenantId_customerPhone_idx" ON "Order" ("tenantId", "customerPhone")',
  'CREATE INDEX IF NOT EXISTS "Order_tenantId_hubId_createdAt_idx" ON "Order" ("tenantId", "hubId", "createdAt")',
];

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? true
        : { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    for (const query of INDEX_QUERIES) {
      console.log(`Applying: ${query}`);
      await client.query(query);
    }
    console.log("Performance indexes applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Failed to apply performance indexes:", error);
  process.exit(1);
});
