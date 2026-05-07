/**
 * fixShipDeliverDays.js
 *
 * Imports ship_in_days (e.g. "1-2"), deliver_in_days (e.g. "10-18"), and
 * total_pages (e.g. "xv+244p., 22cm.") from the old MySQL bagchee DB into Neon.
 * MySQL id == Neon id (confirmed — IDs were preserved during migration).
 *
 * Run from the api/ directory:
 *   node scripts/fixShipDeliverDays.js
 *   node scripts/fixShipDeliverDays.js --fallback   (apply defaults only, no MySQL)
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

const DEFAULT_SHIP    = '3-5';
const DEFAULT_DELIVER = '10-18';

// ── Fallback: set defaults only for products with no ship data ────────────────

async function applyDefaults() {
    log('Fallback mode: setting defaults for products with missing ship/deliver days');
    const [shipResult, deliverResult] = await Promise.all([
        prisma.product.updateMany({
            where: { OR: [{ shipDays: null }, { shipDays: '' }] },
            data: { shipDays: DEFAULT_SHIP },
        }),
        prisma.product.updateMany({
            where: { OR: [{ deliverDays: null }, { deliverDays: '' }] },
            data: { deliverDays: DEFAULT_DELIVER },
        }),
    ]);
    log(`  shipDays   defaults applied: ${shipResult.count} products`);
    log(`  deliverDays defaults applied: ${deliverResult.count} products`);
    log('Done.');
}

// ── MySQL mode: copy real values from old DB ──────────────────────────────────

async function copyFromMysql() {
    let mysql;
    try {
        mysql = await import('mysql2/promise');
    } catch {
        log('mysql2 not installed — switching to fallback mode');
        return applyDefaults();
    }

    let pool;
    try {
        // Try socket auth first (for servers where root uses unix socket, no password)
        const socketPath = process.env.OLD_DB_SOCKET || '/run/mysqld/mysqld.sock';
        const useSocket = !process.env.OLD_DB_HOST && !process.env.OLD_DB_PASS;
        pool = await mysql.createPool({
            ...(useSocket
                ? { socketPath }
                : { host: process.env.OLD_DB_HOST || '127.0.0.1', port: parseInt(process.env.OLD_DB_PORT || '3306') }
            ),
            user:            process.env.OLD_DB_USER || 'root',
            password:        process.env.OLD_DB_PASS || '',
            database:        process.env.OLD_DB_NAME || 'bagchee',
            connectionLimit: 5,
        });
        await pool.query('SELECT 1');
        log('MySQL connected');
    } catch (err) {
        log(`MySQL unreachable (${err.message.slice(0, 80)}) — switching to fallback mode`);
        return applyDefaults();
    }

    try {
        log('Reading ship_in_days, deliver_in_days, total_pages from old MySQL…');
        const [rows] = await pool.query(
            `SELECT id, ship_in_days, deliver_in_days, total_pages
             FROM products
             WHERE ship_in_days != '' OR deliver_in_days != '' OR (total_pages IS NOT NULL AND total_pages != '')`
        );
        log(`  Found ${rows.length} rows with data in old DB`);

        let updated = 0, skipped = 0;
        const BATCH = 500;

        for (let i = 0; i < rows.length; i += BATCH) {
            const chunk = rows.slice(i, i + BATCH);
            await Promise.all(chunk.map(async (r) => {
                const data = {};

                const ship = r.ship_in_days ? String(r.ship_in_days).trim() : null;
                if (ship) data.shipDays = ship;

                const deliver = r.deliver_in_days ? String(r.deliver_in_days).trim() : null;
                if (deliver) data.deliverDays = deliver;

                const pages = r.total_pages ? String(r.total_pages).trim() : null;
                if (pages) data.pagesDesc = pages;

                if (!Object.keys(data).length) { skipped++; return; }

                try {
                    await prisma.product.update({ where: { id: r.id }, data });
                    updated++;
                } catch {
                    skipped++;
                }
            }));
            if (i > 0 && i % 5000 < BATCH) log(`  progress: ${i + BATCH}`);
        }

        log(`  Updated: ${updated} products, skipped/not-found: ${skipped}`);

        // Fill any remaining products that still have no ship data
        await applyDefaults();

        log('Done.');
    } finally {
        await pool.end();
    }
}

const forceFallback = process.argv.includes('--fallback');
(forceFallback ? applyDefaults() : copyFromMysql())
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
