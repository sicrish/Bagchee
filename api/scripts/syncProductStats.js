/**
 * syncProductStats.js
 * Updates soldCount, inrPrice, isNewRelease, and createdAt for ALL products
 * by reading from the old MySQL DB and batch-updating Neon.
 *
 * Fixes:
 *   - Bestsellers showing 79 instead of 3890 (soldCount was 0 for migrated products)
 *   - INR price showing USD conversion instead of stored admin price
 *   - New Arrivals showing wrong count (new_release flag and created_at out of sync)
 *
 * Run on VPS:  node /opt/bagchee/api/scripts/syncProductStats.js
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import mysql from 'mysql2/promise';

const prisma = new PrismaClient();
const MYSQL = await mysql.createPool({
    host: '127.0.0.1', user: 'bagchee_migrator', password: 'migrator_pw',
    database: 'bagchee', connectionLimit: 5, dateStrings: false,
});

const log = (m) => console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`);
const toInt   = (v, d = 0) => { if (v == null || v === '') return d; const n = parseInt(v); return Number.isFinite(n) ? Math.max(-2147483648, Math.min(2147483647, n)) : d; };
const toFloat = (v, d = 0) => { if (v == null || v === '') return d; const n = parseFloat(v); return Number.isFinite(n) ? n : d; };

const BATCH = 500;

async function main() {
    log('Fetching product stats from MySQL...');
    const [rows] = await MYSQL.query(
        'SELECT id AS product_id, ordered_items, inr_price, new_release, created_at FROM products WHERE active = 1'
    );
    log(`Fetched ${rows.length} products from MySQL.`);

    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i += BATCH) {
        const chunk = rows.slice(i, i + BATCH);
        const updates = chunk.map(p => ({
            id:           toInt(p.product_id),
            soldCount:    toInt(p.ordered_items),
            inrPrice:     toFloat(p.inr_price),
            isNewRelease: p.new_release == 1,
            createdAt:    p.created_at ? new Date(p.created_at) : null,
        })).filter(r => r.id > 0);

        await Promise.all(updates.map(({ id, soldCount, inrPrice, isNewRelease, createdAt }) => {
            const data = { soldCount, inrPrice, isNewRelease };
            if (createdAt) data.createdAt = createdAt;
            return prisma.product.updateMany({
                where: { id },
                data,
            }).then(r => { if (r.count > 0) updated++; else skipped++; })
              .catch(() => { skipped++; });
        }));

        if ((i + BATCH) % 5000 === 0 || i + BATCH >= rows.length) {
            log(`Progress: ${Math.min(i + BATCH, rows.length)} / ${rows.length} (updated=${updated}, skipped=${skipped})`);
        }
    }

    log(`Done. Updated: ${updated}, Skipped/not found: ${skipped}`);
    await prisma.$disconnect();
    await MYSQL.end();
}

main().catch(err => { console.error(err); process.exit(1); });
