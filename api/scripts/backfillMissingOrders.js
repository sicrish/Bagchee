/**
 * backfillMissingOrders.js  — one-time import of orders 16848–17168
 *
 * These orders were placed between late March and early April 2026.
 * The normal syncOrders.js uses WHERE order_id > maxId; since maxId has
 * already advanced past 17168, this range is permanently skipped.
 *
 * Strategy:
 *  - Import without an `id` field so PostgreSQL auto-assigns new IDs.
 *  - Preserve orderNumber = 'ORD-{mysql_id}' (e.g. 'ORD-16953').
 *  - Admin search already queries orderNumber CONTAINS — so searching
 *    "16953" will find the order even though its PG id is different.
 *
 * Run on VPS:  node /opt/bagchee/api/scripts/backfillMissingOrders.js
 * Safe to re-run: skips orders whose orderNumber already exists in PG.
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
const toInt   = (v, d = 0) => { if (v == null || v === '') return d; const n = parseInt(v); return Number.isFinite(n) ? n : d; };
const toFloat = (v, d = 0) => { if (v == null || v === '') return d; const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
const toStr   = (v, d = '') => (v == null ? d : String(v));
const toDate  = (v) => { if (!v || String(v).startsWith('0000')) return null; const d = new Date(v); return isNaN(d) ? null : d; };

const MIN_ID = 16848;
const MAX_ID = 17168;

async function main() {
    // Resolve India country IDs to exclude
    let indiaIds = new Set();
    try {
        const [cRows] = await MYSQL.query(`SELECT id FROM countries WHERE LOWER(country_name) LIKE '%india%'`);
        cRows.forEach(r => indiaIds.add(r.id));
    } catch {
        indiaIds.add(101);
    }
    log(`India country IDs to exclude: [${[...indiaIds].join(', ')}]`);

    const statusMap   = new Map((await prisma.orderStatus.findMany()).map(s => [s.id, s.name]));
    const paymentMap  = new Map((await prisma.payment.findMany()).map(p => [p.id, p.title]));
    const shippingMap = new Map((await prisma.shippingOption.findMany()).map(s => [s.id, s.title]));
    const userIds     = new Set((await prisma.user.findMany({ select: { id: true } })).map(x => x.id));
    const prodIds     = new Set((await prisma.product.findMany({ select: { id: true } })).map(x => x.id));

    const indiaIdArr  = indiaIds.size > 0 ? Array.from(indiaIds) : [0];
    const indiaPlaceholders = indiaIdArr.map(() => '?').join(',');

    log(`Fetching MySQL orders id BETWEEN ${MIN_ID} AND ${MAX_ID} (excluding India)...`);
    const [orders] = await MYSQL.query(
        `SELECT * FROM orders
         WHERE order_id BETWEEN ? AND ?
           AND (shipping_country_id NOT IN (${indiaPlaceholders}) OR shipping_country_id IS NULL)
           AND (billing_country_id  NOT IN (${indiaPlaceholders}) OR billing_country_id  IS NULL)
         ORDER BY order_id`,
        [MIN_ID, MAX_ID, ...indiaIdArr, ...indiaIdArr]
    );
    log(`Found ${orders.length} orders in MySQL`);

    // Skip any that already landed in PG (safe re-run)
    const allOrderNumbers = orders.map(o => `ORD-${o.order_id}`);
    const alreadyInPg = new Set(
        (await prisma.order.findMany({
            where: { orderNumber: { in: allOrderNumbers } },
            select: { orderNumber: true },
        })).map(o => o.orderNumber)
    );
    log(`Already in PG: ${alreadyInPg.size} — skipping those`);

    const toImport = orders.filter(o => !alreadyInPg.has(`ORD-${o.order_id}`));
    log(`To import: ${toImport.length}`);

    if (!toImport.length) { log('Nothing to import. ✅'); await cleanup(); return; }

    // Insert one by one so we capture the PG-assigned id for each order
    let imported = 0;
    const mysqlIdToPgId = new Map();  // MySQL order_id → new PG id
    for (const o of toImport) {
        try {
            const created = await prisma.order.create({
                data: {
                    // No `id` — PG auto-assigns a new one
                    orderNumber:        `ORD-${o.order_id}`,
                    customerId:         o.customer_id && userIds.has(o.customer_id) ? o.customer_id : null,
                    total:              toFloat(o.total),
                    shippingCost:       toFloat(o.shipping_cost),
                    currency:           toStr(o.currency, 'USD').toUpperCase() || 'USD',
                    paymentType:        paymentMap.get(o.payment_type) || toStr(o.payment_type),
                    shippingType:       shippingMap.get(o.shipping_type) || toStr(o.shipping_type),
                    status:             (statusMap.get(o.status) || 'pending').toLowerCase(),
                    paymentStatus:      toStr(o.payment_status, 'pending'),
                    transactionId:      toStr(o.transaction_id),
                    membership:         o.membership === 1 ? 'Yes' : 'No',
                    membershipDiscount: toFloat(o.membership_discount),
                    couponId:           null,
                    comment:            toStr(o.comment),
                    shippingEmail:      toStr(o.shipping_email),
                    shippingFirstName:  toStr(o.shipping_f_name),
                    shippingLastName:   toStr(o.shipping_l_name),
                    shippingAddress1:   toStr(o.shipping_address_1),
                    shippingAddress2:   toStr(o.shipping_address_2),
                    shippingCompany:    toStr(o.shipping_company),
                    shippingCountry:    String(o.shipping_country_id || ''),
                    shippingState:      toStr(o.shipping_state),
                    shippingCity:       toStr(o.shipping_city),
                    shippingPostcode:   toStr(o.shipping_post_code),
                    shippingPhone:      toStr(o.shipping_phone),
                    billingFirstName:   toStr(o.billing_f_name),
                    billingLastName:    toStr(o.billing_l_name),
                    billingAddress1:    toStr(o.billing_address_1),
                    billingAddress2:    toStr(o.billing_address_2),
                    billingCompany:     toStr(o.billing_company),
                    billingCountry:     String(o.billing_country_id || ''),
                    billingState:       toStr(o.billing_state),
                    billingCity:        toStr(o.billing_city),
                    billingPostcode:    toStr(o.billing_post_code),
                    billingPhone:       toStr(o.billing_phone),
                    createdAt:          toDate(o.created_at) || new Date(),
                    updatedAt:          toDate(o.updated_at) || new Date(),
                },
            });
            mysqlIdToPgId.set(o.order_id, created.id);
            imported++;
            if (imported % 50 === 0) log(`  Inserted ${imported}/${toImport.length}...`);
        } catch (e) {
            log(`  SKIP ORD-${o.order_id}: ${e.message.split('\n')[0]}`);
        }
    }
    log(`Orders imported: ${imported} / ${toImport.length}`);

    // Import order items using NEW PG order ids
    const mysqlOrderIds = Array.from(mysqlIdToPgId.keys());
    if (!mysqlOrderIds.length) { log('No orders landed — skipping items.'); await cleanup(); return; }

    const [items] = await MYSQL.query(
        `SELECT * FROM product_to_order WHERE order_id IN (?)`, [mysqlOrderIds]
    );
    log(`Found ${items.length} order items in MySQL`);

    const itemsMapped = items
        .filter(r => mysqlIdToPgId.has(r.order_id) && prodIds.has(toInt(r.product_id)))
        .map(r => ({
            // No `id` — PG auto-assigns; don't carry MySQL item IDs to avoid conflicts
            orderId:      mysqlIdToPgId.get(r.order_id),  // new PG order id
            productId:    toInt(r.product_id),
            name:         '',
            image:        '',
            price:        toFloat(r.price),
            quantity:     toInt(r.quantity, 1),
            status:       toStr(r.product_status).slice(0, 50),
            courierId:    r.courier_id || null,
            trackingCode: toStr(r.tracking_code),
            returnNote:   toStr(r.return_note),
            cancelNote:   toStr(r.cancel_note),
        }));

    let itemsImported = 0;
    for (let i = 0; i < itemsMapped.length; i += 500) {
        try {
            const r = await prisma.orderItem.createMany({ data: itemsMapped.slice(i, i + 500), skipDuplicates: true });
            itemsImported += r.count;
        } catch {
            for (const row of itemsMapped.slice(i, i + 500)) {
                try { await prisma.orderItem.create({ data: row }); itemsImported++; } catch {}
            }
        }
    }
    log(`Order items imported: ${itemsImported} / ${items.length}`);
    log('Done ✅');
    await cleanup();
}

async function cleanup() { await prisma.$disconnect(); await MYSQL.end(); }

main().catch(e => { console.error(e); process.exit(1); });
