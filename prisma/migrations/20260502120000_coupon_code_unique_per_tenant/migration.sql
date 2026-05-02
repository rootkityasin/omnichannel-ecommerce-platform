-- Enforce coupon code uniqueness per tenant instead of globally on `code` alone.
DROP INDEX IF EXISTS "Coupon_code_key";

CREATE UNIQUE INDEX "Coupon_tenantId_code_key" ON "Coupon"("tenantId", "code");
