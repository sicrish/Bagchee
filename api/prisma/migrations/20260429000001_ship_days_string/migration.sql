-- Change ship_in_days and deliver_in_days from Int to String so ranges like "2-10" can be stored.
ALTER TABLE "products" ALTER COLUMN "ship_in_days" TYPE TEXT USING "ship_in_days"::TEXT;
ALTER TABLE "products" ALTER COLUMN "ship_in_days" DROP DEFAULT;
ALTER TABLE "products" ALTER COLUMN "ship_in_days" DROP NOT NULL;

ALTER TABLE "products" ALTER COLUMN "deliver_in_days" TYPE TEXT USING "deliver_in_days"::TEXT;
ALTER TABLE "products" ALTER COLUMN "deliver_in_days" DROP DEFAULT;
ALTER TABLE "products" ALTER COLUMN "deliver_in_days" DROP NOT NULL;
