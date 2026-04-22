-- Add tenant-level Google Tag Manager container setting
ALTER TABLE "SiteConfig"
ADD COLUMN "gtmContainerId" TEXT;
