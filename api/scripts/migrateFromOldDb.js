import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import mysql from 'mysql2/promise';

const prisma = new PrismaClient();
const MYSQL = await mysql.createPool({
    host: '127.0.0.1',
    user: 'bagchee_migrator',
    password: 'migrator_pw',
    database: 'bagchee_old',
    connectionLimit: 5,
    dateStrings: true,
});

const BATCH = 1000;

const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

// --- helpers ----------------------------------------------------------------

const toBool = (v) => v === 1 || v === true || v === '1' || v === 'true';
const toInt = (v, d = 0) => {
    if (v === null || v === undefined || v === '') return d;
    const m = String(v).match(/-?\d+/);
    if (!m) return d;
    const n = parseInt(m[0], 10);
    if (!Number.isFinite(n)) return d;
    if (n > 2147483647) return 2147483647;
    if (n < -2147483648) return -2147483648;
    return n;
};
const toFloat = (v, d = 0) => {
    if (v === null || v === undefined || v === '') return d;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : d;
};
const toStr = (v, d = '') => (v === null || v === undefined ? d : String(v));
const toNullStr = (v) => (v === null || v === undefined || v === '' ? null : String(v));
const toDate = (v) => {
    if (!v || v === '0000-00-00' || v === '0000-00-00 00:00:00') return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
};
const unixToDate = (v) => {
    if (!v) return null;
    const n = Number(v);
    if (!n) return null;
    return new Date(n * 1000);
};

// Product type int → string (per products_type: 1=Books, 2=Cds, 3=Cdroms, 4=Videos, 5=Handicrafts)
const productTypeMap = { 1: 'book', 2: 'cd', 3: 'cdrom', 4: 'dvd', 5: 'handicraft' };

// Batch reader for large tables
async function* chunkedRead(sql, params = [], size = 5000) {
    let offset = 0;
    while (true) {
        const [rows] = await MYSQL.query(`${sql} LIMIT ${size} OFFSET ${offset}`, params);
        if (!rows.length) break;
        yield rows;
        if (rows.length < size) break;
        offset += size;
    }
}

async function insertMany(model, rows, { skipDuplicates = true } = {}) {
    if (!rows.length) return 0;
    let total = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
        const chunk = rows.slice(i, i + BATCH);
        try {
            const r = await prisma[model].createMany({ data: chunk, skipDuplicates });
            total += r.count;
        } catch (e) {
            // fall back to per-row so we can log which row broke
            for (const row of chunk) {
                try {
                    await prisma[model].create({ data: row });
                    total++;
                } catch (err) {
                    console.warn(`[${model}] row error:`, err.message.slice(0, 200), JSON.stringify(row).slice(0, 160));
                }
            }
        }
    }
    return total;
}

// no-op during migration — we do a single pass at the end via resetAllSequences()
async function resetSeq() { /* deferred */ }

// After migration, set every sequence to MAX(id)+1 so future inserts don't collide
async function resetAllSequences() {
    const tables = await prisma.$queryRawUnsafe(
        `SELECT tablename FROM pg_tables WHERE schemaname='public'`
    );
    for (const { tablename } of tables) {
        try {
            const cols = await prisma.$queryRawUnsafe(
                `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_default LIKE 'nextval%'`,
                tablename
            );
            if (!cols.length) continue;
            const col = cols[0].column_name;
            await prisma.$executeRawUnsafe(
                `SELECT setval(pg_get_serial_sequence('public."${tablename}"', '${col}'), GREATEST((SELECT COALESCE(MAX("${col}"), 0) FROM public."${tablename}"), 1))`
            );
        } catch (e) {
            console.warn(`[seq] ${tablename}: ${e.message.slice(0, 100)}`);
        }
    }
}

// --- phase 1: lookups --------------------------------------------------------

async function migrateLookups() {
    log('Phase 1: lookups');

    // Settings
    const [settings] = await MYSQL.query('SELECT * FROM settings LIMIT 1');
    if (settings.length) {
        const s = settings[0];
        await prisma.settings.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                saleThreshold: toFloat(s.sale_threshold),
                bestSellerThreshold: toInt(s.best_seller_threshold),
                memberDiscount: toFloat(s.member_discount),
                freeShippingOver: toFloat(s.free_shiping_over),
                freeShippingOverEur: toFloat(s.free_shiping_over_eur),
                freeShippingOverInr: toFloat(s.free_shiping_over_inr),
                membershipCartPrice: toFloat(s.membership_cart_price),
                membershipCartPriceEur: toFloat(s.membership_cart_price_eur),
                membershipCartPriceInr: toFloat(s.membership_cart_price_inr),
                usdToEurRate: toFloat(s.usd_to_eur_rate, 0.92),
                usdToInrRate: toFloat(s.usd_to_inr_rate, 84),
                topbarPromotion: toBool(s.topbar_promotion),
                topbarPromotionText: toStr(s.topbar_promotion_text),
            },
        });
        log('  settings ✓');
    }

    // Simple lookups
    const jobs = [
        {
            table: 'order_statuses', model: 'orderStatus', pg: 'order_statuses',
            map: (r) => ({ id: r.id, name: toStr(r.name, 'Unknown') }),
        },
        {
            table: 'tags', model: 'tag', pg: 'Tag',
            map: (r) => ({ id: r.id, title: toStr(r.title) }),
        },
        {
            table: 'languages', model: 'language', pg: 'Language',
            map: (r) => ({ id: r.id, title: toStr(r.title), ord: toInt(r.ord) }),
        },
        {
            table: 'formats', model: 'format', pg: 'Format',
            map: (r) => ({
                id: r.id, title: toStr(r.title), active: toBool(r.active),
                categoryId: toInt(r.category_id), ord: toInt(r.ord),
            }),
        },
        {
            table: 'labels', model: 'label', pg: 'Label',
            map: (r) => ({ id: r.label_id, title: toStr(r.title), active: toBool(r.active), ord: toInt(r.ord) }),
        },
        {
            table: 'couriers', model: 'courier', pg: 'Courier',
            map: (r) => ({ id: r.id, title: toStr(r.title), trackingPage: toStr(r.tracking_page), active: toBool(r.active) }),
        },
        {
            table: 'shipping', model: 'shippingOption', pg: 'ShippingOption',
            map: (r) => ({
                id: r.id, title: toStr(r.title).trim(), maxDayLimit: toInt(r.max_day_limit),
                priceUsd: toFloat(r.price_usd), priceEur: toFloat(r.price_eur), priceInr: toFloat(r.price_inr),
                active: toBool(r.active), ord: toInt(r.ord),
            }),
        },
        {
            table: 'payment', model: 'payment', pg: 'Payment',
            map: (r) => ({
                id: r.id, title: toStr(r.title).trim(), active: toBool(r.active), ord: toInt(r.ord),
                additionalText: toStr(r.additional_text),
            }),
        },
        {
            table: 'products_type', model: 'productType', pg: 'ProductType',
            map: (r) => ({
                id: r.product_type_id, name: toStr(r.name),
                imageFolder: toStr(r.image_folder), bagcheePrefix: toStr(r.bagchee_prefix).trim(),
            }),
        },
        {
            table: 'series', model: 'series', pg: 'Series',
            map: (r) => ({ id: r.series_id, title: toStr(r.series_title, 'Untitled') }),
        },
        {
            table: 'publishers', model: 'publisher', pg: 'Publisher',
            map: (r) => ({
                id: r.publisher_id, title: toStr(r.publisher_title, 'Unknown'),
                image: toStr(r.image), company: toNullStr(r.company), address: toNullStr(r.address),
                place: toNullStr(r.place), email: toNullStr(r.email), phone: toNullStr(r.phone), fax: toNullStr(r.fax),
                slug: toStr(r.slug), shipInDays: toStr(r.ship_in_days, '3'),
                categoryId: r.category_id || null, show: toBool(r.show), order: toInt(r.order),
            }),
        },
        {
            table: 'authors', model: 'author', pg: 'Author',
            map: (r) => ({
                id: r.id, firstName: toStr(r.first_name), lastName: toStr(r.last_name),
                fullName: toStr(r.full_name), picture: toNullStr(r.picture),
                origin: toNullStr(r.origin), profile: toNullStr(r.profile),
            }),
        },
        {
            table: 'actors', model: 'actor', pg: 'Actor',
            map: (r) => ({
                id: r.id, firstName: toStr(r.first_name), lastName: toStr(r.last_name),
                picture: toNullStr(r.picture), origin: toNullStr(r.origin), profile: toNullStr(r.profile),
            }),
        },
        {
            table: 'artists', model: 'artist', pg: 'Artist',
            map: (r) => ({
                id: r.id, firstName: toStr(r.first_name), lastName: toStr(r.last_name),
                picture: toNullStr(r.picture), role: toNullStr(r.role),
                origin: toNullStr(r.origin), profile: toNullStr(r.profile),
            }),
        },
        {
            table: 'categories', model: 'category', pg: 'Category',
            map: (r) => ({
                id: r.category_id, title: toStr(r.category_title, 'Untitled'),
                slug: toNullStr(r.slug), parentSlug: toNullStr(r.parents_slug),
                mainModule: toNullStr(r.main_module), oldId: toNullStr(r.old_id),
                parentId: toInt(r.parent_id), active: toBool(r.active),
                lft: r.lft, rght: r.rght, level: r.level,
                metaTitle: toNullStr(r.meta_title), metaKeywords: toNullStr(r.meta_keywords),
                metaDesc: toNullStr(r.meta_description),
                image: toStr(r.image), newsletterCategory: toBool(r.newsletter_category),
                newsletterOrder: r.newsletter_category_order,
                productType: toInt(r.product_type),
            }),
        },
    ];

    for (const j of jobs) {
        const [rows] = await MYSQL.query(`SELECT * FROM ${j.table}`);
        const mapped = rows.map(j.map);
        const n = await insertMany(j.model, mapped);
        await resetSeq(j.pg);
        log(`  ${j.table} → ${j.model}: ${n}/${rows.length}`);
    }

    // Order statuses: ensure default statuses are present if dump was empty
    const statusCount = await prisma.orderStatus.count();
    if (statusCount === 0) {
        await prisma.orderStatus.createMany({
            data: [
                { name: 'Pending' }, { name: 'Confirmed' }, { name: 'Shipped' },
                { name: 'Delivered' }, { name: 'Cancelled' },
            ],
        });
    }

    // MetaTags (has a controller/action pair in old, pageUrl in new)
    const [metaRows] = await MYSQL.query('SELECT * FROM meta_tags');
    const metaMapped = metaRows.map((r) => ({
        id: r.id,
        pageUrl: `/${toStr(r.controller)}${r.action ? `/${r.action}` : ''}`,
        title: toStr(r.meta_title),
        metaTitle: toStr(r.meta_title),
        metaDesc: toStr(r.meta_description),
        metaKeywords: toStr(r.meta_keywords),
    }));
    await insertMany('metaTag', metaMapped);
    await resetSeq('meta_tags');
    log(`  meta_tags → metaTag: ${metaMapped.length}`);

    // Footer
    const [footerRows] = await MYSQL.query('SELECT * FROM footer');
    await insertMany('footer', footerRows.map((r) => ({
        id: r.id, name: toStr(r.name), title: toStr(r.title),
        subtitle: toStr(r.subtitle), content: toStr(r.content),
    })));
    await resetSeq('footer');
    log(`  footer: ${footerRows.length}`);

    // Navigation
    const [navRows] = await MYSQL.query('SELECT * FROM navigation');
    await insertMany('navigation', navRows.map((r) => ({
        id: r.id, item: toStr(r.item), itemLink: toStr(r.item_link),
        hasDropdown: toBool(r.has_dropdown), dropdownContent: toStr(r.dropdown_content),
        active: toBool(r.active), ord: toInt(r.ord),
    })));
    await resetSeq('navigation');
    log(`  navigation: ${navRows.length}`);

    // Social
    const [socRows] = await MYSQL.query('SELECT * FROM socials');
    await insertMany('social', socRows.map((r) => ({
        id: r.id, title: toStr(r.title), link: toStr(r.link),
        fontAwesomeClass: toStr(r.font_awesome_class),
        shareClass: toStr(r.share_class),
        image: toStr(r.image), share: toBool(r.share),
        active: toBool(r.active),
        showInProduct: toBool(r.show_in_product),
        showInCategory: toBool(r.show_in_category),
    })));
    await resetSeq('Social');
    log(`  socials: ${socRows.length}`);

    // Testimonials
    const [testiRows] = await MYSQL.query('SELECT * FROM testemonials');
    await insertMany('testimonial', testiRows.map((r) => ({
        id: r.id, title: toStr(r.title), madeBy: toStr(r.made_by),
        content: toNullStr(r.content), active: toBool(r.active),
        createdAt: toDate(r.created_at) || new Date(),
    })));
    await resetSeq('testemonials');
    log(`  testemonials → testimonial: ${testiRows.length}`);

    // Help pages
    const [helpRows] = await MYSQL.query('SELECT * FROM help_pages');
    await insertMany('helpPage', helpRows.map((r) => ({
        id: r.id, title: toStr(r.title),
        pageContent: toStr(r.page_content),
        metaTitle: toStr(r.meta_title), metaDesc: toStr(r.meta_description),
        metaKeywords: toStr(r.meta_keywords),
    })));
    await resetSeq('help_pages');
    log(`  help_pages: ${helpRows.length}`);

    // Services
    const [svcRows] = await MYSQL.query('SELECT * FROM services');
    await insertMany('service', svcRows.map((r) => ({
        id: r.id, title: toStr(r.title),
        boxDesc: toStr(r.box_desc),
        pageContent: toStr(r.page_content),
        pageTitle: toStr(r.page_title),
        metaTitle: toStr(r.meta_title),
        metaDesc: toStr(r.meta_description),
        metaKeywords: toStr(r.meta_keywords),
    })));
    await resetSeq('services');
    log(`  services: ${svcRows.length}`);

    // Home categories → MainCategory
    const [hcRows] = await MYSQL.query('SELECT * FROM home_categories');
    await insertMany('mainCategory', hcRows.map((r) => ({
        id: r.id, title: toStr(r.title), image: toStr(r.image), link: toStr(r.link),
        active: toBool(r.active), order: toInt(r.order),
    })));
    await resetSeq('home_categories');
    log(`  home_categories → mainCategory: ${hcRows.length}`);
}

// --- phase 2: users + addresses ---------------------------------------------

async function migrateUsers() {
    log('Phase 2: users');
    let total = 0;
    for await (const rows of chunkedRead('SELECT * FROM users')) {
        const mapped = rows.map((u) => ({
            id: u.id,
            email: toStr(u.email).toLowerCase() || `user${u.id}@unknown.local`,
            password: toStr(u.password) || '$2a$10$invalidhashplaceholderxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            name: `${toStr(u.first_name)} ${toStr(u.last_name)}`.trim(),
            firstName: toStr(u.first_name),
            lastName: toStr(u.last_name),
            username: toStr(u.username),
            company: toStr(u.company),
            phone: toNullStr(u.phone),
            profileImage: toStr(u.image),
            role: u.id === 1 ? 'admin' : 'user',
            status: toInt(u.active, 1),
            membership: u.membership === 1 ? 'active' : 'inactive',
            membershipStart: toDate(u.membership_start),
            membershipEnd: toDate(u.membership_end),
            isGuest: toBool(u.is_guest),
            createdAt: unixToDate(u.created_on) || new Date(),
        }));
        total += await insertMany('user', mapped);
    }
    await resetSeq('User');
    log(`  users: ${total}`);

    // De-dup email collisions will have been swallowed by skipDuplicates

    // Addresses — filter against actual imported user IDs (some old users collided on email/id)
    const userIds = new Set((await prisma.user.findMany({ select: { id: true } })).map((x) => x.id));
    let addrTotal = 0, addrSkipped = 0;
    for await (const rows of chunkedRead('SELECT * FROM users_addresses')) {
        const valid = rows.filter((a) => userIds.has(a.user_id));
        addrSkipped += rows.length - valid.length;
        const mapped = valid.map((a) => ({
            id: a.id, userId: a.user_id,
            firstName: toStr(a.first_name), lastName: toStr(a.last_name),
            street: toStr(a.address), address2: toStr(a.address_2),
            city: toStr(a.city), state: toStr(a.state),
            pincode: toStr(a.postal_code), phone: toStr(a.phone),
            company: toStr(a.company), isDefault: toBool(a.is_default),
        }));
        addrTotal += await insertMany('address', mapped);
    }
    log(`  addresses: ${addrTotal} imported, ${addrSkipped} orphaned (user missing)`);
}

// --- phase 3: products -------------------------------------------------------

async function migrateProducts() {
    log('Phase 3: products');
    // Build valid FK sets so we can null out bad refs
    const pubs = new Set((await prisma.publisher.findMany({ select: { id: true } })).map((x) => x.id));
    const ser = new Set((await prisma.series.findMany({ select: { id: true } })).map((x) => x.id));
    const lbs = new Set((await prisma.label.findMany({ select: { id: true } })).map((x) => x.id));

    let total = 0;
    for await (const rows of chunkedRead('SELECT * FROM products', [], 2000)) {
        const mapped = rows.map((p) => ({
            id: p.id,
            bagcheeId: toNullStr(p.bagchee_id),
            title: toStr(p.title, 'Untitled'),
            productType: productTypeMap[p.product_type] || 'book',
            isbn10: toStr(p.isbn_10),
            isbn13: toStr(p.isbn_13),
            isbn: toNullStr(p.isbn),
            price: toFloat(p.price),
            inrPrice: toFloat(p.inr_price),
            realPrice: toFloat(p.real_price),
            discount: toFloat(p.discount),
            discountInr: toFloat(p.discount_inr),
            publisherId: p.publisher_id && pubs.has(p.publisher_id) ? p.publisher_id : null,
            seriesId: p.series_id && ser.has(p.series_id) ? p.series_id : null,
            labelId: p.label_id && lbs.has(p.label_id) ? p.label_id : null,
            seriesNumber: toNullStr(p.series_number),
            leadingCategoryId: toInt(p.leading_category_id) || null,
            volume: toNullStr(p.volume),
            edition: toNullStr(p.edition),
            pages: toInt(p.total_pages) || null,
            weight: toNullStr(p.weight),
            pubDate: toNullStr(p.pub_date),
            synopsis: toNullStr(p.review),
            criticsNote: toNullStr(p.from_the_critics),
            searchText: toNullStr(p.search_text),
            notes: toNullStr(p.notes),
            source: toNullStr(p.source),
            defaultImage: toNullStr(p.default_image),
            tocImage: toNullStr(p.default_toc_image),
            metaTitle: toNullStr(p.pr_meta_title),
            metaDescription: toNullStr(p.pr_meta_description),
            metaKeywords: toNullStr(p.pr_meta_keywords),
            stock: toBool(p.stock) ? 'active' : 'inactive',
            availability: toInt(p.availability),
            isActive: toBool(p.active),
            isRecommended: toBool(p.recommended),
            isNewRelease: toBool(p.new_release),
            upcoming: toBool(p.upcoming),
            upcomingDate: toDate(p.upcoming_date),
            newReleaseUntil: toDate(p.new_release_until),
            rating: toFloat(p.rating),
            ratedTimes: toInt(p.rated_times),
            soldCount: toInt(p.ordered_items),
            shipDays: toInt(p.ship_in_days, 3),
            deliverDays: toInt(p.deliver_in_days, 7),
            createdAt: toDate(p.created_at) || new Date(),
        }));
        total += await insertMany('product', mapped);
        if (total % 10000 < BATCH) log(`    products progress: ${total}`);
    }
    await resetSeq('Product');
    log(`  products: ${total}`);
}

// --- phase 4: product junctions + images ------------------------------------

async function migrateProductJunctions() {
    log('Phase 4: product junctions + images');
    const prodIds = new Set((await prisma.product.findMany({ select: { id: true } })).map((x) => x.id));

    const jobs = [
        {
            table: 'products_authors', model: 'productAuthor',
            fkSet: 'author', fkCol: 'author_id',
            map: (r) => ({ productId: r.product_id, authorId: r.author_id, roleId: r.role_id || null }),
        },
        {
            table: 'products_artists', model: 'productArtist',
            fkSet: 'artist', fkCol: 'artist_id',
            map: (r) => ({ productId: r.product_id, artistId: r.artist_id }),
        },
        {
            table: 'products_actors', model: 'productActor',
            fkSet: 'actor', fkCol: 'actor_id',
            map: (r) => ({ productId: r.product_id, actorId: r.actor_id }),
        },
        {
            table: 'products_categories', model: 'productCategory',
            fkSet: 'category', fkCol: 'category_id',
            map: (r) => ({ productId: r.product_id, categoryId: r.category_id }),
        },
        {
            table: 'products_formats', model: 'productFormat',
            fkSet: 'format', fkCol: 'format_id',
            map: (r) => ({ productId: r.product_id, formatId: r.format_id }),
        },
        {
            table: 'products_languages', model: 'productLanguage',
            fkSet: 'language', fkCol: 'language_id',
            map: (r) => ({ productId: r.product_id, languageId: r.language_id }),
        },
        {
            table: 'products_tags', model: 'productTag',
            fkSet: 'tag', fkCol: 'tag_id',
            map: (r) => ({ productId: r.product_id, tagId: r.tag_id }),
        },
    ];

    for (const j of jobs) {
        const fkIds = new Set((await prisma[j.fkSet].findMany({ select: { id: true } })).map((x) => x.id));
        let total = 0, skipped = 0;
        for await (const rows of chunkedRead(`SELECT * FROM ${j.table}`, [], 10000)) {
            const valid = rows.filter((r) => prodIds.has(r.product_id) && fkIds.has(r[j.fkCol]));
            skipped += rows.length - valid.length;
            total += await insertMany(j.model, valid.map(j.map));
        }
        log(`  ${j.table}: ${total} imported, ${skipped} skipped`);
    }

    // Product images
    const imgJobs = [
        { table: 'products_images', model: 'productImage',
            map: (r) => ({ id: r.id, productId: r.product_id, file: toStr(r.file), alt: toNullStr(r.alt), ord: toInt(r.ord) }),
            pg: 'ProductImage',
        },
        { table: 'products_tocs', model: 'productToc',
            map: (r) => ({ id: r.id, productId: r.product_id, file: toStr(r.file), alt: toNullStr(r.alt), ord: toInt(r.ord) }),
            pg: 'ProductToc',
        },
        { table: 'products_sample_images', model: 'productSampleImage',
            map: (r) => ({ id: r.id, productId: r.product_id, file: toStr(r.file), ord: toInt(r.ord) }),
            pg: 'ProductSampleImage',
        },
    ];
    for (const j of imgJobs) {
        let total = 0;
        for await (const rows of chunkedRead(`SELECT * FROM ${j.table}`, [], 10000)) {
            const valid = rows.filter((r) => prodIds.has(r.product_id));
            total += await insertMany(j.model, valid.map(j.map));
        }
        await resetSeq(j.pg);
        log(`  ${j.table}: ${total}`);
    }
}

// --- phase 5: orders + order items + wishlist + reviews ----------------------

async function migrateOrders() {
    log('Phase 5: orders');
    const userIds = new Set((await prisma.user.findMany({ select: { id: true } })).map((x) => x.id));
    const prodIds = new Set((await prisma.product.findMany({ select: { id: true } })).map((x) => x.id));
    const statusMap = new Map((await prisma.orderStatus.findMany()).map((s) => [s.id, s.name]));
    const paymentMap = new Map((await prisma.payment.findMany()).map((p) => [p.id, p.title]));
    const shippingMap = new Map((await prisma.shippingOption.findMany()).map((s) => [s.id, s.title]));

    // Orders
    let orderTotal = 0;
    for await (const rows of chunkedRead('SELECT * FROM orders', [], 2000)) {
        const valid = rows.filter((o) => userIds.has(o.customer_id));
        const mapped = valid.map((o) => ({
            id: o.order_id,
            orderNumber: `ORD-${o.order_id}`,
            customerId: o.customer_id,
            total: toFloat(o.total),
            shippingCost: toFloat(o.shipping_cost),
            currency: toStr(o.currency, 'USD').toUpperCase(),
            paymentType: paymentMap.get(o.payment_type) || '',
            shippingType: shippingMap.get(o.shipping_type) || '',
            status: (statusMap.get(o.status) || 'Pending').toLowerCase(),
            paymentStatus: toStr(o.payment_status, 'pending'),
            transactionId: toStr(o.transaction_id),
            membership: o.membership === 1 ? 'Yes' : 'No',
            membershipDiscount: toFloat(o.membership_discount),
            couponId: null, // FK check below would need coupon import first
            comment: toStr(o.comment),
            shippingEmail: toStr(o.shipping_email),
            shippingFirstName: toStr(o.shipping_f_name),
            shippingLastName: toStr(o.shipping_l_name),
            shippingAddress1: toStr(o.shipping_address_1),
            shippingAddress2: toStr(o.shipping_address_2),
            shippingCompany: toStr(o.shipping_company),
            shippingCountry: String(o.shipping_country_id || ''),
            shippingState: toStr(o.shipping_state),
            shippingCity: toStr(o.shipping_city),
            shippingPostcode: toStr(o.shipping_post_code),
            shippingPhone: toStr(o.shipping_phone),
            billingFirstName: toStr(o.billing_f_name),
            billingLastName: toStr(o.billing_l_name),
            billingAddress1: toStr(o.billing_address_1),
            billingAddress2: toStr(o.billing_address_2),
            billingCompany: toStr(o.billing_company),
            billingCountry: String(o.billing_country_id || ''),
            billingState: toStr(o.billing_state),
            billingCity: toStr(o.billing_city),
            billingPostcode: toStr(o.billing_post_code),
            billingPhone: toStr(o.billing_phone),
            createdAt: toDate(o.created_at) || new Date(),
            updatedAt: toDate(o.updated_at) || new Date(),
        }));
        orderTotal += await insertMany('order', mapped);
    }
    await resetSeq('Order');
    log(`  orders: ${orderTotal}`);

    // Order items
    const orderIds = new Set((await prisma.order.findMany({ select: { id: true } })).map((x) => x.id));
    let itemTotal = 0;
    for await (const rows of chunkedRead('SELECT * FROM product_to_order', [], 5000)) {
        const valid = rows.filter((r) => orderIds.has(r.order_id) && prodIds.has(toInt(r.product_id)));
        const mapped = valid.map((r) => ({
            id: r.id, orderId: r.order_id, productId: toInt(r.product_id),
            name: '', image: '',
            price: toFloat(r.price), quantity: toInt(r.quantity, 1),
            status: toStr(r.product_status).slice(0, 50),
            courierId: r.courier_id || null,
            trackingCode: toStr(r.tracking_code),
            returnNote: toStr(r.return_note), cancelNote: toStr(r.cancel_note),
        }));
        itemTotal += await insertMany('orderItem', mapped);
    }
    await resetSeq('OrderItem');
    log(`  order items: ${itemTotal}`);

    // Wishlist
    let wlTotal = 0;
    for await (const rows of chunkedRead('SELECT * FROM product_to_wishlist', [], 10000)) {
        const valid = rows.filter((r) => userIds.has(r.user_id) && prodIds.has(toInt(r.product_id)));
        const mapped = valid.map((r) => ({ userId: r.user_id, productId: toInt(r.product_id) }));
        wlTotal += await insertMany('wishlist', mapped);
    }
    log(`  wishlist: ${wlTotal}`);

    // Reviews
    let revTotal = 0;
    for await (const rows of chunkedRead('SELECT * FROM visitorreviews')) {
        const valid = rows.filter((r) => prodIds.has(r.item_id));
        const mapped = valid.map((r) => ({
            id: r.id, productId: r.item_id,
            customerId: r.customer_id || null,
            email: toNullStr(r.email), name: toNullStr(r.name),
            title: toNullStr(r.title), review: toNullStr(r.review),
            rating: r.rating, active: toBool(r.active),
            createdAt: toDate(r.created_at) || new Date(),
        }));
        revTotal += await insertMany('review', mapped);
    }
    await resetSeq('Review');
    log(`  reviews: ${revTotal}`);
}

// --- phase 6: coupons + home content ----------------------------------------

async function migrateCoupons() {
    log('Phase 6: coupons + home/CMS');

    // Coupons
    const [coupRows] = await MYSQL.query('SELECT * FROM coupons');
    const coupMapped = coupRows.map((c) => ({
        id: c.id, code: toStr(c.code, `CODE-${c.id}`), title: toStr(c.title, 'Coupon'),
        validFrom: toDate(c.valid_from) || new Date(),
        validTo: toDate(c.valid_to) || new Date(Date.now() + 365 * 86400 * 1000),
        active: toBool(c.active), fixAmount: toBool(c.fix_amount),
        amount: toFloat(c.amount), minimumBuy: toFloat(c.minimum_buy),
        priceOverOnly: toFloat(c.price_over_only),
        newCustomerOnly: toBool(c.new_customer_only),
        membersOnly: toBool(c.members_only),
        nextOrderOnly: toBool(c.next_order_only),
        bestsellerOnly: toBool(c.bestseller_only),
        recommendedOnly: toBool(c.recommended_only),
        newArrivalsOnly: toBool(c.new_arrivals_only),
        getThirdFree: toBool(c.get_third_free),
    }));
    await insertMany('coupon', coupMapped);
    await resetSeq('Coupon');
    log(`  coupons: ${coupMapped.length}`);

    // Sliders
    const [sliderRows] = await MYSQL.query('SELECT * FROM sliders');
    await insertMany('homeSlider', sliderRows.map((r) => ({
        id: r.id, desktopImage: toStr(r.image), mobileImage: toStr(r.image),
        link: toNullStr(r.link), isActive: toBool(r.active), order: toInt(r.order),
        addedAt: toDate(r.added_at) || new Date(),
    })));
    await resetSeq('sliders');
    log(`  sliders: ${sliderRows.length}`);

    // home_section_sale → HomeSaleProduct
    const prodIds = new Set((await prisma.product.findMany({ select: { id: true } })).map((x) => x.id));
    const [saleRows] = await MYSQL.query('SELECT * FROM home_section_sale');
    await insertMany('homeSaleProduct', saleRows.filter((r) => prodIds.has(r.product_id)).map((r) => ({
        id: r.id, productId: r.product_id, active: toBool(r.active), order: toInt(r.order),
    })));
    await resetSeq('home_section_sale');
    log(`  home sale: ${saleRows.length}`);

    // home_new_and_noteworthy → HomeNewNoteworthy
    const [nnRows] = await MYSQL.query('SELECT * FROM home_new_and_noteworthy');
    await insertMany('homeNewNoteworthy', nnRows.filter((r) => prodIds.has(r.product_id)).map((r) => ({
        id: r.id, productId: r.product_id, active: toBool(r.active), order: toInt(r.order),
    })));
    await resetSeq('home_new_and_noteworthy');
    log(`  home new&noteworthy: ${nnRows.length}`);

    // home_top_authors → TopAuthor
    const authorIds = new Set((await prisma.author.findMany({ select: { id: true } })).map((x) => x.id));
    const [taRows] = await MYSQL.query('SELECT * FROM home_top_authors');
    await insertMany('topAuthor', taRows.filter((r) => authorIds.has(r.top_author_id)).map((r) => ({
        id: r.id, authorId: r.top_author_id,
        active: toBool(r.active), order: toInt(r.orders),
    })));
    await resetSeq('TopAuthor');
    log(`  home top authors: ${taRows.length}`);

    // Newsletter subscribers
    let nsTotal = 0;
    for await (const rows of chunkedRead('SELECT * FROM newsletter_subscribers')) {
        const seen = new Set();
        const valid = rows.filter((r) => {
            const e = toStr(r.email).toLowerCase();
            if (!e || seen.has(e)) return false;
            seen.add(e);
            return true;
        });
        const mapped = valid.map((r) => ({
            id: r.id, email: toStr(r.email).toLowerCase(),
            firstName: toStr(r.first_name), lastName: toStr(r.last_name),
        }));
        nsTotal += await insertMany('newsletterSubscriber', mapped);
    }
    await resetSeq('newsletter_subscribers');
    log(`  newsletter subs: ${nsTotal}`);
}

// --- main -------------------------------------------------------------------

async function main() {
    const t0 = Date.now();
    await migrateLookups();
    await migrateUsers();
    await migrateProducts();
    await migrateProductJunctions();
    await migrateOrders();
    await migrateCoupons();
    log('Resetting sequences...');
    await resetAllSequences();
    log(`DONE in ${Math.round((Date.now() - t0) / 1000)}s`);
}

main().catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); await MYSQL.end(); });
