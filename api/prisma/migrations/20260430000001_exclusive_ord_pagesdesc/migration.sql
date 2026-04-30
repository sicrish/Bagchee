-- exclusiveFor: nullable TEXT (no default written to existing rows — storage safe)
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "exclusive_for" TEXT;

-- pagesDesc: nullable TEXT for full bibliographic pages string
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "pages_desc" TEXT;

-- ord for help_pages (small table, safe to add with default)
ALTER TABLE "help_pages" ADD COLUMN IF NOT EXISTS "ord" INTEGER NOT NULL DEFAULT 0;

-- ord for services (small table, safe to add with default)
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "ord" INTEGER NOT NULL DEFAULT 0;
