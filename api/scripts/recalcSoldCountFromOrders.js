/**
 * recalcSoldCountFromOrders.js
 * Recalculates soldCount for all products from the Neon (new site) orders database.
 * Run this AFTER syncProductStats.js so old MySQL sales are already loaded.
 * This script ADDS new-site order quantities on top of existing soldCount values
 * from the old site migration.
 *
 * Usage on VPS:
 *   node /opt/bagchee/api/scripts/recalcSoldCountFromOrders.js
 *
 * Or to REPLACE soldCount entirely from new-site orders only:
 *   REPLACE_MODE=true node /opt/bagchee/api/scripts/recalcSoldCountFromOrders.js
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);
const replaceMode = process.env.REPLACE_MODE === 'true';

async function main() {
    log(`Mode: ${replaceMode ? 'REPLACE (set soldCount = new-site orders only)' : 'ADD (add new-site orders to existing soldCount)'}`);
    log('Aggregating order item quantities from Neon...');

    const rows = await prisma.$queryRaw`
        SELECT product_id, SUM(quantity)::int AS total_sold
        FROM product_to_order
        GROUP BY product_id
    `;

    log(`Found ${rows.length} products with orders on new site.`);

    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
        const productId = Number(row.product_id);
        const newSiteSold = Number(row.total_sold) || 0;
        if (!productId || productId <= 0) { skipped++; continue; }

        try {
            if (replaceMode) {
                await prisma.product.updateMany({
                    where: { id: productId },
                    data: { soldCount: newSiteSold },
                });
            } else {
                // Add new-site orders to the existing soldCount (from old MySQL migration)
                await prisma.product.updateMany({
                    where: { id: productId },
                    data: { soldCount: { increment: newSiteSold } },
                });
            }
            updated++;
        } catch {
            skipped++;
        }
    }

    log(`Done. Updated: ${updated}, Skipped: ${skipped}`);
    await prisma.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
