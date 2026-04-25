/**
 * fixShipDeliverDays.js
 *
 * The main migration imported ship_in_days / deliver_in_days from MySQL, but
 * toInt(0, default) returns 0 (not the default), so every product whose old-DB
 * column was 0 came in as 0 in Neon.
 *
 * This script patches those products. It tries to connect to the old MySQL DB
 * first. If MySQL is reachable, it reads the real per-product values and writes
 * them; otherwise it falls back to resetting all-zero rows to (3, 7).
 *
 * Run from the api/ directory:
 *   node scripts/fixShipDeliverDays.js
 *   # or with an explicit fallback (no MySQL needed):
 *   node scripts/fixShipDeliverDays.js --fallback
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

const DEFAULT_SHIP_DAYS    = 3;
const DEFAULT_DELIVER_DAYS = 7;

// ── Fallback mode: reset all products where shipDays=0 or deliverDays=0 ──────

async function applyDefaults() {
    log('Fallback mode: setting defaults for products with 0-value ship/deliver days');

    const [shipResult, deliverResult] = await Promise.all([
        prisma.product.updateMany({
            where: { shipDays: { lte: 0 } },
            data: { shipDays: DEFAULT_SHIP_DAYS },
        }),
        prisma.product.updateMany({
            where: { deliverDays: { lte: 0 } },
            data: { deliverDays: DEFAULT_DELIVER_DAYS },
        }),
    ]);

    log(`  shipDays   reset → ${DEFAULT_SHIP_DAYS}:    ${shipResult.count} products updated`);
    log(`  deliverDays reset → ${DEFAULT_DELIVER_DAYS}: ${deliverResult.count} products updated`);
    log('Done.');
}

// ── MySQL mode: copy actual values from old DB ────────────────────────────────

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
        pool = await mysql.createPool({
            host:            process.env.OLD_DB_HOST     || '127.0.0.1',
            port:            parseInt(process.env.OLD_DB_PORT || '3306'),
            user:            process.env.OLD_DB_USER     || 'bagchee_migrator',
            password:        process.env.OLD_DB_PASS     || 'migrator_pw',
            database:        process.env.OLD_DB_NAME     || 'bagchee_old',
            connectionLimit: 3,
        });
        // quick connectivity check
        await pool.query('SELECT 1');
        log('MySQL connected');
    } catch (err) {
        log(`MySQL unreachable (${err.message.slice(0, 60)}) — switching to fallback mode`);
        return applyDefaults();
    }

    try {
        log('Reading ship_in_days / deliver_in_days from old MySQL products table…');
        const [rows] = await pool.query(
            'SELECT product_id, ship_in_days, deliver_in_days FROM products WHERE ship_in_days > 0 OR deliver_in_days > 0'
        );
        log(`  Found ${rows.length} products with non-zero values in old DB`);

        let updated = 0;
        const BATCH = 500;
        for (let i = 0; i < rows.length; i += BATCH) {
            const chunk = rows.slice(i, i + BATCH);
            await Promise.all(chunk.map(async (r) => {
                const ship    = r.ship_in_days    > 0 ? r.ship_in_days    : DEFAULT_SHIP_DAYS;
                const deliver = r.deliver_in_days > 0 ? r.deliver_in_days : DEFAULT_DELIVER_DAYS;
                try {
                    await prisma.product.update({
                        where: { id: r.product_id },
                        data: { shipDays: ship, deliverDays: deliver },
                    });
                    updated++;
                } catch {
                    // product was deleted or id mismatch — skip
                }
            }));
            if ((i + BATCH) % 5000 < BATCH) log(`  progress: ${i + BATCH}`);
        }
        log(`  Updated from old DB: ${updated} products`);

        // Now apply defaults to anything still at 0 (products that weren't in old DB rows)
        const [shipResult, deliverResult] = await Promise.all([
            prisma.product.updateMany({
                where: { shipDays: { lte: 0 } },
                data: { shipDays: DEFAULT_SHIP_DAYS },
            }),
            prisma.product.updateMany({
                where: { deliverDays: { lte: 0 } },
                data: { deliverDays: DEFAULT_DELIVER_DAYS },
            }),
        ]);
        if (shipResult.count > 0)    log(`  shipDays   fallback default applied: ${shipResult.count} products`);
        if (deliverResult.count > 0) log(`  deliverDays fallback default applied: ${deliverResult.count} products`);

        log('Done.');
    } finally {
        await pool.end();
    }
}

// ── Entry point ───────────────────────────────────────────────────────────────

const forceFallback = process.argv.includes('--fallback');

(forceFallback ? applyDefaults() : copyFromMysql())
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
