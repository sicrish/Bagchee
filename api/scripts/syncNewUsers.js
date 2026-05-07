/**
 * syncNewUsers.js  —  #6 + #7
 * Imports users added to the old MySQL site AFTER the last migration.
 * Also imports their addresses and wishlist items.
 *
 * Run on VPS:  node /opt/bagchee/api/scripts/syncNewUsers.js
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
const toInt    = (v, d = 0) => { if (v == null || v === '') return d; const n = parseInt(v); return Number.isFinite(n) ? n : d; };
const toStr    = (v, d = '') => (v == null ? d : String(v));
const toNullStr= (v) => (v == null || v === '' ? null : String(v));
const toDate   = (v) => { if (!v || String(v).startsWith('0000')) return null; const d = new Date(v); return isNaN(d) ? null : d; };
// created_on in the old MySQL users table is a Unix timestamp integer
const unixToDate = (v) => { if (!v) return null; const n = parseInt(v); if (!n) return null; const d = new Date(n * 1000); return isNaN(d) ? null : d; };

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
    // Find the highest user id already in Neon
    const maxRow = await prisma.user.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
    const maxId = maxRow?.id ?? 0;
    log(`Max user id already in Neon: ${maxId}. Fetching new ones from MySQL...`);

    // --- 1. Users ---
    const [newUsers] = await MYSQL.query('SELECT * FROM users WHERE id > ?', [maxId]);
    log(`Found ${newUsers.length} new users in MySQL`);

    if (newUsers.length === 0) { log('Nothing to sync.'); await cleanup(); return; }

    const mapped = newUsers.map(u => ({
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
        role: 'user',
        status: toInt(u.active, 1),
        membership: u.membership === 1 ? 'active' : 'inactive',
        membershipStart: toDate(u.membership_start),
        membershipEnd: toDate(u.membership_end),
        isGuest: toBool(u.is_guest),
        createdAt: unixToDate(u.created_on) || new Date(),
    }));

    const imported = await insertMany('user', mapped);
    log(`  Users: ${imported} / ${newUsers.length} imported`);

    // Build set of successfully imported user IDs (email dupes may have been skipped)
    const newIds = new Set(newUsers.map(u => u.id));
    const actuallyImported = new Set(
        (await prisma.user.findMany({
            where: { id: { in: Array.from(newIds) } },
            select: { id: true },
        })).map(x => x.id)
    );

    if (actuallyImported.size === 0) { log('No users actually landed in Neon (all dupes?).'); await cleanup(); return; }

    // --- 2. Addresses for new users ---
    const idList = Array.from(actuallyImported);
    const [addresses] = await MYSQL.query(
        `SELECT * FROM users_addresses WHERE user_id IN (?)`, [idList]
    );

    const addrMapped = addresses
        .filter(a => actuallyImported.has(a.user_id))
        .map(a => ({
            id: a.id,
            userId: a.user_id,
            firstName: toStr(a.first_name),
            lastName: toStr(a.last_name),
            street: toStr(a.address),
            address2: toStr(a.address_2),
            city: toStr(a.city),
            state: toStr(a.state),
            pincode: toStr(a.postal_code),
            phone: toStr(a.phone),
            company: toStr(a.company),
            isDefault: toBool(a.is_default),
        }));

    const addrImported = await insertMany('address', addrMapped);
    log(`  Addresses: ${addrImported} / ${addresses.length} imported`);

    // --- 3. Wishlist items for new users ---
    const prodIds = new Set((await prisma.product.findMany({ select: { id: true } })).map(x => x.id));

    const [wishlistRows] = await MYSQL.query(
        `SELECT * FROM product_to_wishlist WHERE user_id IN (?)`, [idList]
    );

    const wlMapped = wishlistRows
        .filter(r => actuallyImported.has(r.user_id) && prodIds.has(toInt(r.product_id)))
        .map(r => ({ userId: r.user_id, productId: toInt(r.product_id) }));

    const wlImported = await insertMany('wishlist', wlMapped);
    log(`  Wishlist items: ${wlImported} / ${wishlistRows.length} imported`);

    // Bump PG sequence
    await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"users"', 'id'), GREATEST((SELECT MAX(id) FROM "users"), 1))`
    );
    await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"users_addresses"', 'id'), GREATEST((SELECT MAX(id) FROM "users_addresses"), 1))`
    );

    log('Done ✅');
    await cleanup();
}

async function cleanup() { await prisma.$disconnect(); await MYSQL.end(); }

main().catch(e => { console.error(e); process.exit(1); });
