-- Add productId column to Coupon (if missing)
ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "productId" text;

-- Add foreign key constraint referencing Product(id) if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Coupon_productId_fkey'
  ) THEN
    ALTER TABLE "Coupon"
      ADD CONSTRAINT "Coupon_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL;
  END IF;
END$$;

-- Add index on productId for queries
CREATE INDEX IF NOT EXISTS "Coupon_productId_index" ON "Coupon"("productId");
