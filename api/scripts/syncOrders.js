/**
 * syncOrders.js  —  #8
 * Imports orders placed in the last 10 months from the old MySQL site.
 * Skips orders where EITHER the shipping OR billing country is India.
 * Also imports the order line items for each imported order.
 *
 * Run on VPS:  node /opt/bagchee/api/scripts/syncOrders.js
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import mysql from 'mysql2/promise';

const prisma = new PrismaClient();
const MYSQL = await mysql.createPool({
    host: '127.0.0.1', user: 'bagchee_migrator', password: 'migrator_pw',
    database: 'bagchee', connectionLimit: 5, dateStrings: true,
});

const log = (m) => console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`);
const toInt    = (v, d = 0) => { if (v == null || v === '') return d; const n = parseInt(v); return Number.isFinite(n) ? n : d; };
const toFloat  = (v, d = 0) => { if (v == null || v === '') return d; const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
const toStr    = (v, d = '') => (v == null ? d : String(v));
const toDate   = (v) => { if (!v || String(v).startsWith('0000')) return null; const d = new Date(v); return isNaN(d) ? null : d; };

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
    // --- Resolve India's country_id from MySQL ---
    // The old DB stores country as an integer FK into a countries table.
    // We use a broad pattern match so regional variations ("Republic of India" etc.) are caught.
    let indiaIds = new Set();
    try {
        const [cRows] = await MYSQL.query(
            `SELECT id FROM countries WHERE LOWER(country_name) LIKE '%india%'`
        );
        cRows.forEach(r => indiaIds.add(r.id));
    } catch {
        // Some deployments may not have a separate countries table — fall back to checking
        // the shipping_country_id values directly in the orders table by looking for known
        // India country IDs (101 is the standard ISO-sorted India ID in many e-commerce DBs).
        try {
            const [cRows] = await MYSQL.query(
                `SELECT id FROM countries WHERE id IN (101) LIMIT 5`
            );
            cRows.forEach(r => indiaIds.add(r.id));
        } catch {
            log('WARNING: Could not resolve India country ID — using fallback ID=101');
            indiaIds.add(101);
        }
    }
    log(`India country IDs to exclude: [${[...indiaIds].join(', ')}]`);

    // --- Find max order id already in Neon ---
    const maxRow = await prisma.order.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
    const maxId = maxRow?.id ?? 0;
    log(`Max order id in Neon: ${maxId}`);

    // --- Lookup tables needed to convert IDs → names ---
    const statusMap   = new Map((await prisma.orderStatus.findMany()).map(s => [s.id, s.name]));
    const paymentMap  = new Map((await prisma.payment.findMany()).map(p => [p.id, p.title]));
    const shippingMap = new Map((await prisma.shippingOption.findMany()).map(s => [s.id, s.title]));
    const userIds     = new Set((await prisma.user.findMany({ select: { id: true } })).map(x => x.id));
    const prodIds     = new Set((await prisma.product.findMany({ select: { id: true } })).map(x => x.id));

    // --- Fetch orders: last 10 months, id > maxId, excluding India ---
    // order_id in MySQL maps to id in Neon
    const indiaPlaceholders = indiaIds.size > 0
        ? Array.from(indiaIds).map(() => '?').join(',')
        : '0'; // dummy — no match if set is empty somehow

    const indiaIdArr = indiaIds.size > 0 ? Array.from(indiaIds) : [0];

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 10);
    const cutoff = cutoffDate.toISOString().slice(0, 10); // 'YYYY-MM-DD'

    log(`Fetching orders created after ${cutoff}, order_id > ${maxId}, excluding India...`);

    const [orders] = await MYSQL.query(
        `SELECT * FROM orders
         WHERE order_id > ?
           AND created_at >= ?
           AND (shipping_country_id NOT IN (${indiaPlaceholders}) OR shipping_country_id IS NULL)
           AND (billing_country_id  NOT IN (${indiaPlaceholders}) OR billing_country_id  IS NULL)
         ORDER BY order_id`,
        [maxId, cutoff, ...indiaIdArr, ...indiaIdArr]
    );

    log(`Found ${orders.length} orders to import`);

    if (orders.length === 0) { log('Nothing to sync.'); await cleanup(); return; }

    const mapped = orders.map(o => ({
        id: o.order_id,
        orderNumber: `ORD-${o.order_id}`,
        customerId: o.customer_id && userIds.has(o.customer_id) ? o.customer_id : null,
        total: toFloat(o.total),
        shippingCost: toFloat(o.shipping_cost),
        currency: toStr(o.currency, 'USD').toUpperCase() || 'USD',
        paymentType: paymentMap.get(o.payment_type) || toStr(o.payment_type),
        shippingType: shippingMap.get(o.shipping_type) || toStr(o.shipping_type),
        status: (statusMap.get(o.status) || 'pending').toLowerCase(),
        paymentStatus: toStr(o.payment_status, 'pending'),
        transactionId: toStr(o.transaction_id),
        membership: o.membership === 1 ? 'Yes' : 'No',
        membershipDiscount: toFloat(o.membership_discount),
        couponId: null,
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

    const orderImported = await insertMany('order', mapped);
    log(`  Orders: ${orderImported} / ${orders.length} imported`);

    // --- Order items for newly imported orders ---
    const importedOrderIds = new Set(orders.map(o => o.order_id));
    const existingOrderIds = new Set(
        (await prisma.order.findMany({
            where: { id: { in: Array.from(importedOrderIds) } },
            select: { id: true },
        })).map(x => x.id)
    );

    const orderIdArr = Array.from(existingOrderIds);
    if (orderIdArr.length === 0) { log('No order rows landed — skipping items.'); await cleanup(); return; }

    const [items] = await MYSQL.query(
        `SELECT * FROM product_to_order WHERE order_id IN (?)`, [orderIdArr]
    );

    const itemsMapped = items
        .filter(r => existingOrderIds.has(r.order_id) && prodIds.has(toInt(r.product_id)))
        .map(r => ({
            id: r.id,
            orderId: r.order_id,
            productId: toInt(r.product_id),
            name: '',  // snapshot not in old table — filled blank
            image: '',
            price: toFloat(r.price),
            quantity: toInt(r.quantity, 1),
            status: toStr(r.product_status).slice(0, 50),
            courierId: r.courier_id || null,
            trackingCode: toStr(r.tracking_code),
            returnNote: toStr(r.return_note),
            cancelNote: toStr(r.cancel_note),
        }));

    const itemsImported = await insertMany('orderItem', itemsMapped);
    log(`  Order items: ${itemsImported} / ${items.length} imported`);

    // Bump PG sequences
    await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"orders"', 'id'), GREATEST((SELECT MAX(id) FROM "orders"), 1))`
    );
    await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"product_to_order"', 'id'), GREATEST((SELECT MAX(id) FROM "product_to_order"), 1))`
    );

    log('Done ✅');
    await cleanup();
}

async function cleanup() { await prisma.$disconnect(); await MYSQL.end(); }

main().catch(e => { console.error(e); process.exit(1); });
