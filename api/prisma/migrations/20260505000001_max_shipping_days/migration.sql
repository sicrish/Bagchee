-- Add max_shipping_days to settings for combining with product ship days
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "max_shipping_days" INTEGER NOT NULL DEFAULT 0;
