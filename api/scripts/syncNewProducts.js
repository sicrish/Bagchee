/**
 * syncNewProducts.js  —  #5
 * Imports products added to the old MySQL site AFTER the last migration.
 * Also re-syncs product images, TOC images, sample images, and all junction tables
 * for the newly added products.
 *
 * Run on VPS:  node /opt/bagchee/api/scripts/syncNewProducts.js
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import mysql from 'mysql2/promise';

const prisma = new PrismaClient();
const MYSQL = await mysql.createPool({
    host: '127.0.0.1', user: 'bagchee_migrator', password: 'migrator_pw',
    database: 'bagchee_old', connectionLimit: 5, dateStrings: true,
});

const log = (m) => console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`);
const toBool   = (v) => v === 1 || v === true || v === '1' || v === 'true';
const toInt    = (v, d = 0) => { if (v == null || v === '') return d; const n = parseInt(v); return Number.isFinite(n) ? Math.max(-2147483648, Math.min(2147483647, n)) : d; };
const toFloat  = (v, d = 0) => { if (v == null || v === '') return d; const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
const toStr    = (v, d = '') => (v == null ? d : String(v));
const toNullStr= (v) => (v == null || v === '' ? null : String(v));
const toDate   = (v) => { if (!v || String(v).startsWith('0000')) return null; const d = new Date(v); return isNaN(d) ? null : d; };
const productTypeMap = { 1: 'book', 2: 'cd', 3: 'cdrom', 4: 'dvd', 5: 'handicraft' };

const BATCH = 500;
async function insertMany(model, rows) {
    if (!rows.length) return 0;
    let n = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
        try { const r = await prisma[model].createMany({ data: rows.slice(i, i+BATCH), skipDuplicates: true }); n += r.count; }
        catch { for (const row of rows.slice(i, i+BATCH)) { try { await prisma[model].create({ data: row }); n++; } catch {} } }
    }
    return n;
}

async function main() {
    // Find the highest product id already in Neon
    const maxRow = await prisma.product.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
    const maxId = maxRow?.id ?? 0;
    log(`Max product id already in Neon: ${maxId}. Fetching new ones from MySQL...`);

    // --- Pre-load valid FK sets ---
    const pubs = new Set((await prisma.publisher.findMany({ select: { id: true } })).map(x => x.id));
    const ser  = new Set((await prisma.series.findMany({ select: { id: true } })).map(x => x.id));
    const lbs  = new Set((await prisma.label.findMany({ select: { id: true } })).map(x => x.id));

    // --- 1. Products ---
    const [newProds] = await MYSQL.query('SELECT * FROM products WHERE id > ?', [maxId]);
    log(`Found ${newProds.length} new products in MySQL`);

    if (newProds.length === 0) { log('Nothing to sync.'); await cleanup(); return; }

    const mapped = newProds.map(p => ({
        id: p.id,
        bagcheeId:       toNullStr(p.bagchee_id),
        title:           toStr(p.title, 'Untitled'),
        productType:     productTypeMap[p.product_type] || 'book',
        isbn10:          toStr(p.isbn_10),
        isbn13:          toStr(p.isbn_13),
        isbn:            toNullStr(p.isbn),
        price:           toFloat(p.price),
        inrPrice:        toFloat(p.inr_price),
        realPrice:       toFloat(p.real_price),
        discount:        toFloat(p.discount),
        discountInr:     toFloat(p.discount_inr),
        publisherId:     p.publisher_id && pubs.has(p.publisher_id) ? p.publisher_id : null,
        seriesId:        p.series_id && ser.has(p.series_id) ? p.series_id : null,
        labelId:         p.label_id && lbs.has(p.label_id) ? p.label_id : null,
        seriesNumber:    toNullStr(p.series_number),
        leadingCategoryId: toInt(p.leading_category_id) || null,
        volume:          toNullStr(p.volume),
        edition:         toNullStr(p.edition),
        pages:           toInt(p.total_pages) || null,
        pagesDesc:       p.total_pages ? `${toInt(p.total_pages)} pages` : null,
        binding:         toNullStr(p.binding) || 'Paperback',
        weight:          toNullStr(p.weight),
        pubDate:         toNullStr(p.pub_date),
        synopsis:        toNullStr(p.review),
        criticsNote:     toNullStr(p.from_the_critics),
        searchText:      toNullStr(p.search_text),
        notes:           toNullStr(p.notes),
        source:          toNullStr(p.source),
        defaultImage:    toNullStr(p.default_image),
        tocImage:        toNullStr(p.default_toc_image),
        metaTitle:       toNullStr(p.pr_meta_title),
        metaDescription: toNullStr(p.pr_meta_description),
        metaKeywords:    toNullStr(p.pr_meta_keywords),
        stock:           toBool(p.stock) ? 'active' : 'inactive',
        availability:    toInt(p.availability),
        isActive:        toBool(p.active),
        isRecommended:   toBool(p.recommended),
        isNewRelease:    toBool(p.new_release),
        upcoming:        toBool(p.upcoming),
        upcomingDate:    toDate(p.upcoming_date),
        newReleaseUntil: toDate(p.new_release_until),
        rating:          toFloat(p.rating),
        ratedTimes:      toInt(p.rated_times),
        soldCount:       toInt(p.ordered_items),
        shipDays:        toStr(p.ship_in_days, '3'),
        deliverDays:     toStr(p.deliver_in_days, '7'),
        createdAt:       toDate(p.created_at) || new Date(),
    }));

    const imported = await insertMany('product', mapped);
    log(`  Products: ${imported} / ${newProds.length} imported`);

    // --- 2. Junctions for new products only ---
    const newIds = new Set(newProds.map(p => p.id));

    const junctions = [
        { table: 'products_authors',   model: 'productAuthor',   fk: 'author_id',   map: r => ({ productId: r.product_id, authorId: r.author_id, roleId: r.role_id || null }) },
        { table: 'products_categories',model: 'productCategory', fk: 'category_id', map: r => ({ productId: r.product_id, categoryId: r.category_id }) },
        { table: 'products_formats',   model: 'productFormat',   fk: 'format_id',   map: r => ({ productId: r.product_id, formatId: r.format_id }) },
        { table: 'products_languages', model: 'productLanguage', fk: 'language_id', map: r => ({ productId: r.product_id, languageId: r.language_id }) },
        { table: 'products_tags',      model: 'productTag',      fk: 'tag_id',       map: r => ({ productId: r.product_id, tagId: r.tag_id }) },
        { table: 'products_artists',   model: 'productArtist',   fk: 'artist_id',    map: r => ({ productId: r.product_id, artistId: r.artist_id }) },
        { table: 'products_actors',    model: 'productActor',    fk: 'actor_id',     map: r => ({ productId: r.product_id, actorId: r.actor_id }) },
    ];

    for (const j of junctions) {
        const [rows] = await MYSQL.query(`SELECT * FROM ${j.table} WHERE product_id IN (?)`, [Array.from(newIds)]);
        const n = await insertMany(j.model, rows.filter(r => newIds.has(r.product_id)).map(j.map));
        log(`  ${j.table}: ${n}`);
    }

    // --- 3. Images for new products ---
    const imgJobs = [
        { table: 'products_images',        model: 'productImage',       map: r => ({ id: r.id, productId: r.product_id, file: toStr(r.file), alt: toNullStr(r.alt), ord: toInt(r.ord) }) },
        { table: 'products_tocs',          model: 'productToc',         map: r => ({ id: r.id, productId: r.product_id, file: toStr(r.file), alt: toNullStr(r.alt), ord: toInt(r.ord) }) },
        { table: 'products_sample_images', model: 'productSampleImage', map: r => ({ id: r.id, productId: r.product_id, file: toStr(r.file), ord: toInt(r.ord) }) },
    ];

    for (const j of imgJobs) {
        const [rows] = await MYSQL.query(`SELECT * FROM ${j.table} WHERE product_id IN (?)`, [Array.from(newIds)]);
        const n = await insertMany(j.model, rows.filter(r => newIds.has(r.product_id)).map(j.map));
        log(`  ${j.table}: ${n}`);
    }

    // Bump PG sequence so new admin inserts don't collide
    await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"Product"', 'id'), GREATEST((SELECT MAX(id) FROM "Product"), 1))`
    );

    log('Done ✅');
    await cleanup();
}

async function cleanup() { await prisma.$disconnect(); await MYSQL.end(); }

main().catch(e => { console.error(e); process.exit(1); });
