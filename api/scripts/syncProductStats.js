/**
 * syncProductStats.js
 * Updates soldCount (ordered_items) and inrPrice (inr_price) for ALL products
 * by reading from the old MySQL DB and batch-updating Neon.
 *
 * Fixes:
 *   - Bestsellers showing 79 instead of 3890 (soldCount was 0 for migrated products)
 *   - INR price showing USD conversion instead of stored admin price
 *
 * Run on VPS:  node /opt/bagchee/api/scripts/syncProductStats.js
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
const toInt   = (v, d = 0) => { if (v == null || v === '') return d; const n = parseInt(v); return Number.isFinite(n) ? Math.max(-2147483648, Math.min(2147483647, n)) : d; };
const toFloat = (v, d = 0) => { if (v == null || v === '') return d; const n = parseFloat(v); return Number.isFinite(n) ? n : d; };

const BATCH = 500;

async function main() {
    log('Fetching product stats from MySQL...');
    const [rows] = await MYSQL.query(
        'SELECT product_id, ordered_items, inr_price FROM products WHERE active = 1'
    );
    log(`Fetched ${rows.length} products from MySQL.`);

    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i += BATCH) {
        const chunk = rows.slice(i, i + BATCH);
        const updates = chunk.map(p => ({
            id:        toInt(p.product_id),
            soldCount: toInt(p.ordered_items),
            inrPrice:  toFloat(p.inr_price),
        })).filter(r => r.id > 0);

        await Promise.all(updates.map(({ id, soldCount, inrPrice }) =>
            prisma.product.updateMany({
                where: { id },
                data:  { soldCount, inrPrice },
            }).then(r => { if (r.count > 0) updated++; else skipped++; })
              .catch(() => { skipped++; })
        ));

        if ((i + BATCH) % 5000 === 0 || i + BATCH >= rows.length) {
            log(`Progress: ${Math.min(i + BATCH, rows.length)} / ${rows.length} (updated=${updated}, skipped=${skipped})`);
        }
    }

    log(`Done. Updated: ${updated}, Skipped/not found: ${skipped}`);
    await prisma.$disconnect();
    await MYSQL.end();
}

main().catch(err => { console.error(err); process.exit(1); });
