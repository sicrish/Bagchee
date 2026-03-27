-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "first_name" TEXT NOT NULL DEFAULT '',
    "last_name" TEXT NOT NULL DEFAULT '',
    "username" TEXT NOT NULL DEFAULT '',
    "company" TEXT NOT NULL DEFAULT '',
    "phone" TEXT,
    "profile_image" TEXT NOT NULL DEFAULT '',
    "gender" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "pincode" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT 'India',
    "role" TEXT NOT NULL DEFAULT 'user',
    "status" INTEGER NOT NULL DEFAULT 1,
    "membership" TEXT NOT NULL DEFAULT 'inactive',
    "membership_start" TIMESTAMP(3),
    "membership_end" TIMESTAMP(3),
    "is_guest" BOOLEAN NOT NULL DEFAULT false,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_addresses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Home',
    "first_name" TEXT NOT NULL DEFAULT '',
    "last_name" TEXT NOT NULL DEFAULT '',
    "house_no" TEXT NOT NULL DEFAULT '',
    "street" TEXT NOT NULL DEFAULT '',
    "address_2" TEXT NOT NULL DEFAULT '',
    "landmark" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "postal_code" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT 'India',
    "phone" TEXT NOT NULL DEFAULT '',
    "company" TEXT NOT NULL DEFAULT '',
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_to_wishlist" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "product_to_wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "bagchee_id" TEXT,
    "title" TEXT NOT NULL,
    "product_type" TEXT NOT NULL DEFAULT 'book',
    "isbn_10" TEXT DEFAULT '',
    "isbn_13" TEXT DEFAULT '',
    "isbn" TEXT,
    "language" TEXT DEFAULT 'English',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inr_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "real_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_inr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "publisher_id" INTEGER,
    "series_id" INTEGER,
    "series_number" TEXT,
    "leading_category_id" INTEGER,
    "label_id" INTEGER,
    "volume" TEXT,
    "edition" TEXT,
    "total_pages" INTEGER,
    "weight" TEXT,
    "binding" TEXT DEFAULT 'Paperback',
    "pub_date" TEXT,
    "review" TEXT,
    "from_the_critics" TEXT,
    "search_text" TEXT,
    "table_of_contents" TEXT,
    "about_author_text" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "default_image" TEXT,
    "default_toc_image" TEXT,
    "pr_meta_title" TEXT,
    "pr_meta_description" TEXT,
    "pr_meta_keywords" TEXT,
    "stock" TEXT NOT NULL DEFAULT 'active',
    "availability" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "new_release" BOOLEAN NOT NULL DEFAULT false,
    "recommended" BOOLEAN NOT NULL DEFAULT false,
    "upcoming" BOOLEAN NOT NULL DEFAULT false,
    "upcoming_date" TIMESTAMP(3),
    "new_release_until" TIMESTAMP(3),
    "isExclusive" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rated_times" INTEGER NOT NULL DEFAULT 0,
    "ordered_items" INTEGER NOT NULL DEFAULT 0,
    "ship_in_days" INTEGER NOT NULL DEFAULT 3,
    "deliver_in_days" INTEGER NOT NULL DEFAULT 7,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products_authors" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "role_id" INTEGER,

    CONSTRAINT "products_authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products_categories" (
    "product_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "products_categories_pkey" PRIMARY KEY ("product_id","category_id")
);

-- CreateTable
CREATE TABLE "products_tags" (
    "product_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "products_tags_pkey" PRIMARY KEY ("product_id","tag_id")
);

-- CreateTable
CREATE TABLE "products_formats" (
    "product_id" INTEGER NOT NULL,
    "format_id" INTEGER NOT NULL,

    CONSTRAINT "products_formats_pkey" PRIMARY KEY ("product_id","format_id")
);

-- CreateTable
CREATE TABLE "products_languages" (
    "product_id" INTEGER NOT NULL,
    "language_id" INTEGER NOT NULL,

    CONSTRAINT "products_languages_pkey" PRIMARY KEY ("product_id","language_id")
);

-- CreateTable
CREATE TABLE "products_actors" (
    "actor_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "products_actors_pkey" PRIMARY KEY ("actor_id","product_id")
);

-- CreateTable
CREATE TABLE "products_artists" (
    "artist_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "products_artists_pkey" PRIMARY KEY ("artist_id","product_id")
);

-- CreateTable
CREATE TABLE "products_images" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "file" TEXT NOT NULL,
    "alt" TEXT,
    "ord" INTEGER DEFAULT 0,

    CONSTRAINT "products_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products_tocs" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "file" TEXT NOT NULL,
    "alt" TEXT,
    "ord" INTEGER DEFAULT 0,

    CONSTRAINT "products_tocs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products_sample_images" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "file" TEXT NOT NULL,
    "ord" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "products_sample_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "order_number" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shipping_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payment_type" TEXT NOT NULL DEFAULT '',
    "shipping_type" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "transaction_id" TEXT NOT NULL DEFAULT '',
    "membership" TEXT NOT NULL DEFAULT 'No',
    "membership_discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coupon_id" INTEGER,
    "comment" TEXT NOT NULL DEFAULT '',
    "shipping_email" TEXT NOT NULL DEFAULT '',
    "shipping_f_name" TEXT NOT NULL DEFAULT '',
    "shipping_l_name" TEXT NOT NULL DEFAULT '',
    "shipping_address_1" TEXT NOT NULL DEFAULT '',
    "shipping_address_2" TEXT NOT NULL DEFAULT '',
    "shipping_company" TEXT NOT NULL DEFAULT '',
    "shipping_country" TEXT NOT NULL DEFAULT '',
    "shipping_state" TEXT NOT NULL DEFAULT '',
    "shipping_city" TEXT NOT NULL DEFAULT '',
    "shipping_post_code" TEXT NOT NULL DEFAULT '',
    "shipping_phone" TEXT NOT NULL DEFAULT '',
    "billing_f_name" TEXT NOT NULL DEFAULT '',
    "billing_l_name" TEXT NOT NULL DEFAULT '',
    "billing_address_1" TEXT NOT NULL DEFAULT '',
    "billing_address_2" TEXT NOT NULL DEFAULT '',
    "billing_company" TEXT NOT NULL DEFAULT '',
    "billing_country" TEXT NOT NULL DEFAULT '',
    "billing_state" TEXT NOT NULL DEFAULT '',
    "billing_city" TEXT NOT NULL DEFAULT '',
    "billing_post_code" TEXT NOT NULL DEFAULT '',
    "billing_phone" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_to_order" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "product_status" TEXT NOT NULL DEFAULT '',
    "courier_id" INTEGER,
    "tracking_code" TEXT NOT NULL DEFAULT '',
    "return_note" TEXT NOT NULL DEFAULT '',
    "cancel_note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "product_to_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authors" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL DEFAULT '',
    "last_name" TEXT NOT NULL DEFAULT '',
    "full_name" TEXT NOT NULL DEFAULT '',
    "picture" TEXT,
    "origin" TEXT,
    "profile" TEXT,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actors" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL DEFAULT '',
    "last_name" TEXT NOT NULL DEFAULT '',
    "picture" TEXT,
    "origin" TEXT,
    "profile" TEXT,

    CONSTRAINT "actors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artists" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL DEFAULT '',
    "last_name" TEXT NOT NULL DEFAULT '',
    "picture" TEXT,
    "role" TEXT,
    "origin" TEXT,
    "profile" TEXT,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publishers" (
    "id" SERIAL NOT NULL,
    "publisher_title" TEXT NOT NULL,
    "image" TEXT NOT NULL DEFAULT '',
    "company" TEXT,
    "address" TEXT,
    "place" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "slug" TEXT NOT NULL DEFAULT '',
    "ship_in_days" TEXT NOT NULL DEFAULT '3',
    "category_id" INTEGER,
    "show" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publishers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series" (
    "id" SERIAL NOT NULL,
    "series_title" TEXT NOT NULL,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "category_title" TEXT NOT NULL,
    "slug" TEXT,
    "parent_id" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT NOT NULL DEFAULT '',
    "meta_title" TEXT,
    "meta_keywords" TEXT,
    "meta_description" TEXT,
    "product_type" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategories" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "subcategoryname" TEXT NOT NULL,
    "subcategoryiconname" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_categories" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL DEFAULT '',
    "link" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "home_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labels" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ord" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formats" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "category_id" INTEGER NOT NULL DEFAULT 0,
    "ord" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "formats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "ord" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products_type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "image_folder" TEXT NOT NULL DEFAULT '',
    "bagchee_prefix" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "products_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "fix_amount" BOOLEAN NOT NULL DEFAULT false,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimum_buy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price_over_only" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "new_customer_only" BOOLEAN NOT NULL DEFAULT false,
    "members_only" BOOLEAN NOT NULL DEFAULT false,
    "next_order_only" BOOLEAN NOT NULL DEFAULT false,
    "bestseller_only" BOOLEAN NOT NULL DEFAULT false,
    "recommended_only" BOOLEAN NOT NULL DEFAULT false,
    "new_arrivals_only" BOOLEAN NOT NULL DEFAULT false,
    "get_third_free" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "couriers" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "tracking_page" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "couriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "max_day_limit" INTEGER NOT NULL DEFAULT 0,
    "price_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price_eur" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price_inr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ord" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "shipping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ord" INTEGER NOT NULL DEFAULT 0,
    "additional_text" TEXT NOT NULL DEFAULT '',
    "additional_text_active" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_statuses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "order_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitorreviews" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "customer_id" INTEGER,
    "email" TEXT,
    "name" TEXT,
    "title" TEXT,
    "review" TEXT,
    "rating" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitorreviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL DEFAULT '',
    "last_name" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sliders" (
    "id" SERIAL NOT NULL,
    "image" TEXT NOT NULL,
    "link" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sliders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_best_sellers" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_best_sellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_section_sale" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "home_section_sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_new_and_noteworthy" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "home_new_and_noteworthy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_sections" (
    "id" SERIAL NOT NULL,
    "section" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "home_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_section_products" (
    "id" SERIAL NOT NULL,
    "home_section_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_section_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books_of_month" (
    "id" SERIAL NOT NULL,
    "month_name" TEXT NOT NULL,
    "headline" TEXT,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_of_month_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books_of_month_products" (
    "id" SERIAL NOT NULL,
    "books_of_month_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "books_of_month_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_banners" (
    "id" SERIAL NOT NULL,
    "image" TEXT NOT NULL,
    "link" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "home_banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_top_authors" (
    "id" SERIAL NOT NULL,
    "top_author_id" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "home_top_authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "side_banner_one" (
    "id" SERIAL NOT NULL,
    "image1" TEXT NOT NULL DEFAULT '',
    "link1" TEXT NOT NULL DEFAULT '',
    "image2" TEXT NOT NULL DEFAULT '',
    "link2" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "side_banner_one_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "side_banner_two" (
    "id" SERIAL NOT NULL,
    "image1" TEXT NOT NULL DEFAULT '',
    "link1" TEXT NOT NULL DEFAULT '',
    "image2" TEXT NOT NULL DEFAULT '',
    "link2" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "side_banner_two_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_page" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'About Us',
    "page_content" TEXT NOT NULL DEFAULT '',
    "meta_title" TEXT NOT NULL DEFAULT '',
    "meta_description" TEXT NOT NULL DEFAULT '',
    "meta_keywords" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "about_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_page" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Privacy Policy',
    "page_content" TEXT NOT NULL DEFAULT '',
    "meta_title" TEXT NOT NULL DEFAULT '',
    "meta_description" TEXT NOT NULL DEFAULT '',
    "meta_keywords" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "privacy_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms_page" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Terms & Conditions',
    "page_content" TEXT NOT NULL DEFAULT '',
    "meta_title" TEXT NOT NULL DEFAULT '',
    "meta_description" TEXT NOT NULL DEFAULT '',
    "meta_keywords" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "terms_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authors_publishers_page" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Authors & Publishers',
    "page_content" TEXT NOT NULL DEFAULT '',
    "meta_title" TEXT NOT NULL DEFAULT '',
    "meta_description" TEXT NOT NULL DEFAULT '',
    "meta_keywords" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "authors_publishers_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_pages" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "page_content" TEXT NOT NULL DEFAULT '',
    "meta_title" TEXT NOT NULL DEFAULT '',
    "meta_description" TEXT NOT NULL DEFAULT '',
    "meta_keywords" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "help_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "box_desc" TEXT NOT NULL DEFAULT '',
    "page_content" TEXT NOT NULL DEFAULT '',
    "page_title" TEXT NOT NULL DEFAULT '',
    "meta_title" TEXT NOT NULL DEFAULT '',
    "meta_description" TEXT NOT NULL DEFAULT '',
    "meta_keywords" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "sale_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "best_seller_threshold" INTEGER NOT NULL DEFAULT 0,
    "member_discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "free_shiping_over" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "free_shiping_over_eur" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "free_shiping_over_inr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "membership_cart_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "membership_cart_price_eur" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "membership_cart_price_inr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usd_to_eur_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usd_to_inr_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mail_from" TEXT NOT NULL DEFAULT '',
    "mail_reply_to" TEXT NOT NULL DEFAULT '',
    "topbar_promotion" BOOLEAN NOT NULL DEFAULT false,
    "topbar_promotion_text" TEXT NOT NULL DEFAULT '',
    "bank_iban" TEXT NOT NULL DEFAULT '',
    "bank_bic" TEXT NOT NULL DEFAULT '',
    "bank_owner" TEXT NOT NULL DEFAULT '',
    "bank_name" TEXT NOT NULL DEFAULT '',
    "emails_copy" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "footer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation" (
    "id" SERIAL NOT NULL,
    "item" TEXT NOT NULL,
    "item_link" TEXT NOT NULL DEFAULT '',
    "has_dropdown" BOOLEAN NOT NULL DEFAULT false,
    "dropdown_content" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ord" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "navigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socials" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "font_awesome_class" TEXT NOT NULL DEFAULT '',
    "share_class" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL DEFAULT '',
    "share" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "show_in_product" BOOLEAN NOT NULL DEFAULT true,
    "show_in_category" BOOLEAN NOT NULL DEFAULT true,
    "show_in_footer" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "socials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testemonials" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "made_by" TEXT NOT NULL DEFAULT '',
    "content" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "testemonials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_addresses_user_id_idx" ON "users_addresses"("user_id");

-- CreateIndex
CREATE INDEX "product_to_wishlist_user_id_idx" ON "product_to_wishlist"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_to_wishlist_user_id_product_id_key" ON "product_to_wishlist"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "products_bagchee_id_idx" ON "products"("bagchee_id");

-- CreateIndex
CREATE INDEX "products_active_idx" ON "products"("active");

-- CreateIndex
CREATE INDEX "products_recommended_idx" ON "products"("recommended");

-- CreateIndex
CREATE INDEX "products_new_release_idx" ON "products"("new_release");

-- CreateIndex
CREATE INDEX "products_ordered_items_idx" ON "products"("ordered_items");

-- CreateIndex
CREATE INDEX "products_title_idx" ON "products"("title");

-- CreateIndex
CREATE INDEX "products_publisher_id_idx" ON "products"("publisher_id");

-- CreateIndex
CREATE INDEX "products_series_id_idx" ON "products"("series_id");

-- CreateIndex
CREATE INDEX "products_leading_category_id_idx" ON "products"("leading_category_id");

-- CreateIndex
CREATE INDEX "products_discount_idx" ON "products"("discount");

-- CreateIndex
CREATE INDEX "products_authors_product_id_idx" ON "products_authors"("product_id");

-- CreateIndex
CREATE INDEX "products_authors_author_id_idx" ON "products_authors"("author_id");

-- CreateIndex
CREATE INDEX "products_categories_product_id_idx" ON "products_categories"("product_id");

-- CreateIndex
CREATE INDEX "products_categories_category_id_idx" ON "products_categories"("category_id");

-- CreateIndex
CREATE INDEX "products_tags_product_id_idx" ON "products_tags"("product_id");

-- CreateIndex
CREATE INDEX "products_formats_product_id_idx" ON "products_formats"("product_id");

-- CreateIndex
CREATE INDEX "products_languages_product_id_idx" ON "products_languages"("product_id");

-- CreateIndex
CREATE INDEX "products_actors_product_id_idx" ON "products_actors"("product_id");

-- CreateIndex
CREATE INDEX "products_artists_product_id_idx" ON "products_artists"("product_id");

-- CreateIndex
CREATE INDEX "products_images_product_id_idx" ON "products_images"("product_id");

-- CreateIndex
CREATE INDEX "products_tocs_product_id_idx" ON "products_tocs"("product_id");

-- CreateIndex
CREATE INDEX "products_sample_images_product_id_idx" ON "products_sample_images"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "product_to_order_order_id_idx" ON "product_to_order"("order_id");

-- CreateIndex
CREATE INDEX "authors_full_name_idx" ON "authors"("full_name");

-- CreateIndex
CREATE INDEX "publishers_publisher_title_idx" ON "publishers"("publisher_title");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "subcategories_category_id_idx" ON "subcategories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "visitorreviews_item_id_idx" ON "visitorreviews"("item_id");

-- CreateIndex
CREATE INDEX "visitorreviews_active_idx" ON "visitorreviews"("active");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE INDEX "home_best_sellers_product_id_idx" ON "home_best_sellers"("product_id");

-- CreateIndex
CREATE INDEX "home_section_sale_product_id_idx" ON "home_section_sale"("product_id");

-- CreateIndex
CREATE INDEX "home_new_and_noteworthy_product_id_idx" ON "home_new_and_noteworthy"("product_id");

-- CreateIndex
CREATE INDEX "home_section_products_home_section_id_idx" ON "home_section_products"("home_section_id");

-- CreateIndex
CREATE INDEX "home_section_products_product_id_idx" ON "home_section_products"("product_id");

-- CreateIndex
CREATE INDEX "books_of_month_products_books_of_month_id_idx" ON "books_of_month_products"("books_of_month_id");

-- CreateIndex
CREATE UNIQUE INDEX "books_of_month_products_books_of_month_id_product_id_key" ON "books_of_month_products"("books_of_month_id", "product_id");

-- AddForeignKey
ALTER TABLE "users_addresses" ADD CONSTRAINT "users_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_to_wishlist" ADD CONSTRAINT "product_to_wishlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_to_wishlist" ADD CONSTRAINT "product_to_wishlist_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_authors" ADD CONSTRAINT "products_authors_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_authors" ADD CONSTRAINT "products_authors_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_categories" ADD CONSTRAINT "products_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_categories" ADD CONSTRAINT "products_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_tags" ADD CONSTRAINT "products_tags_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_tags" ADD CONSTRAINT "products_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_formats" ADD CONSTRAINT "products_formats_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_formats" ADD CONSTRAINT "products_formats_format_id_fkey" FOREIGN KEY ("format_id") REFERENCES "formats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_languages" ADD CONSTRAINT "products_languages_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_languages" ADD CONSTRAINT "products_languages_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_actors" ADD CONSTRAINT "products_actors_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_actors" ADD CONSTRAINT "products_actors_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "actors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_artists" ADD CONSTRAINT "products_artists_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_artists" ADD CONSTRAINT "products_artists_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_images" ADD CONSTRAINT "products_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_tocs" ADD CONSTRAINT "products_tocs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_sample_images" ADD CONSTRAINT "products_sample_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_to_order" ADD CONSTRAINT "product_to_order_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_to_order" ADD CONSTRAINT "product_to_order_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitorreviews" ADD CONSTRAINT "visitorreviews_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_section_products" ADD CONSTRAINT "home_section_products_home_section_id_fkey" FOREIGN KEY ("home_section_id") REFERENCES "home_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books_of_month_products" ADD CONSTRAINT "books_of_month_products_books_of_month_id_fkey" FOREIGN KEY ("books_of_month_id") REFERENCES "books_of_month"("id") ON DELETE CASCADE ON UPDATE CASCADE;
