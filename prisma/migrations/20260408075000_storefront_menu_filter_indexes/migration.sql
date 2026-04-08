-- Storefront filtered menu query indexes
-- Improves tenant + availability scoped filters and sort paths used by menu API.

CREATE INDEX IF NOT EXISTS "Product_tenantId_isAvailable_categoryId_idx"
ON "Product"("tenantId", "isAvailable", "categoryId");

CREATE INDEX IF NOT EXISTS "Product_tenantId_isAvailable_type_idx"
ON "Product"("tenantId", "isAvailable", "type");

CREATE INDEX IF NOT EXISTS "Product_tenantId_isAvailable_createdAt_idx"
ON "Product"("tenantId", "isAvailable", "createdAt");

CREATE INDEX IF NOT EXISTS "Product_tenantId_isAvailable_totalSold_idx"
ON "Product"("tenantId", "isAvailable", "totalSold");
