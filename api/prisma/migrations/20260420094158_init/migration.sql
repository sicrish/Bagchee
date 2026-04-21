/*
  Warnings:

  - You are about to drop the column `active` on the `home_banners` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `home_banners` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `home_banners` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `home_banners` table. All the data in the column will be lost.
  - You are about to drop the column `active` on the `sliders` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `sliders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[section]` on the table `home_sections` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `title` to the `home_banners` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `home_banners` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `home_top_authors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `desktop_image` to the `sliders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mobile_image` to the `sliders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "level" INTEGER,
ADD COLUMN     "lft" INTEGER,
ADD COLUMN     "main_module" TEXT,
ADD COLUMN     "newsletter_category" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "newsletter_order" INTEGER,
ADD COLUMN     "old_id" TEXT,
ADD COLUMN     "parent_slug" TEXT,
ADD COLUMN     "rght" INTEGER;

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "books_of_month_only" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "coupon_type" TEXT NOT NULL DEFAULT 'percent_order',
ADD COLUMN     "flat_deduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tier2_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tier2_min_order" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "home_banners" DROP COLUMN "active",
DROP COLUMN "image",
DROP COLUMN "link",
DROP COLUMN "order",
ADD COLUMN     "accent_color" TEXT NOT NULL DEFAULT 'bg-hero-primary',
ADD COLUMN     "bg_image_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "button_text" TEXT NOT NULL DEFAULT 'Explore Now',
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "overlay_image_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "home_sections" ADD COLUMN     "tagline" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "home_top_authors" ADD COLUMN     "book_id" INTEGER,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "quote" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "role" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "newsletter_subscribers" ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "estimated_delivery" TIMESTAMP(3),
ADD COLUMN     "payment_link" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "payment_token" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "purchase_order_number" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "shipped_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "product_to_order" ADD COLUMN     "image" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "bank_bic_eur" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bank_bic_gbp" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bank_bic_usd" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bank_iban_eur" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bank_iban_gbp" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bank_iban_usd" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bank_name_eur" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bank_name_gbp" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bank_name_usd" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bank_owner_eur" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bank_owner_gbp" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bank_owner_usd" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "payment_gateway_mode" TEXT NOT NULL DEFAULT 'deferred';

-- AlterTable
ALTER TABLE "sliders" DROP COLUMN "active",
DROP COLUMN "image",
ADD COLUMN     "desktop_image" TEXT NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mobile_image" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "force_direct_payment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "reset_token_expiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "scheduled_emails" (
    "id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "send_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disclaimer_page" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Disclaimer',
    "page_content" TEXT NOT NULL DEFAULT '',
    "meta_title" TEXT NOT NULL DEFAULT '',
    "meta_description" TEXT NOT NULL DEFAULT '',
    "meta_keywords" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "disclaimer_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_tags" (
    "id" SERIAL NOT NULL,
    "page_url" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "meta_title" TEXT NOT NULL DEFAULT '',
    "meta_desc" TEXT NOT NULL DEFAULT '',
    "meta_keywords" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "meta_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_emails_status_send_at_idx" ON "scheduled_emails"("status", "send_at");

-- CreateIndex
CREATE UNIQUE INDEX "home_sections_section_key" ON "home_sections"("section");

-- CreateIndex
CREATE INDEX "products_product_type_idx" ON "products"("product_type");

-- CreateIndex
CREATE INDEX "products_isFeatured_idx" ON "products"("isFeatured");

-- CreateIndex
CREATE INDEX "products_isExclusive_idx" ON "products"("isExclusive");

-- CreateIndex
CREATE INDEX "products_isbn_13_idx" ON "products"("isbn_13");

-- CreateIndex
CREATE INDEX "products_isbn_10_idx" ON "products"("isbn_10");

-- CreateIndex
CREATE INDEX "products_active_created_at_idx" ON "products"("active", "created_at");

-- CreateIndex
CREATE INDEX "products_active_ordered_items_idx" ON "products"("active", "ordered_items");

-- CreateIndex
CREATE INDEX "products_active_discount_idx" ON "products"("active", "discount");

-- CreateIndex
CREATE INDEX "products_active_leading_category_id_idx" ON "products"("active", "leading_category_id");

-- CreateIndex
CREATE INDEX "products_new_release_new_release_until_idx" ON "products"("new_release", "new_release_until");

-- CreateIndex
CREATE INDEX "publishers_slug_idx" ON "publishers"("slug");

-- AddForeignKey
ALTER TABLE "books_of_month_products" ADD CONSTRAINT "books_of_month_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
