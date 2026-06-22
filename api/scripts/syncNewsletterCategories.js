/**
 * syncNewsletterCategories.js
 * Reads newsletter_subscriber_categories from MySQL and updates the
 * categories[] array on each NewsletterSubscriber in Neon.
 *
 * Run on VPS:  node /opt/bagchee/api/scripts/syncNewsletterCategories.js
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import mysql from 'mysql2/promise';

const prisma = new PrismaClient();
const MYSQL = await mysql.createPool({
    host: '127.0.0.1', user: 'bagchee_migrator', password: 'migrator_pw',
    database: 'bagchee', connectionLimit: 5,
});

const log = (m) => console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`);
const BATCH = 500;

async function main() {
    // 1. Fetch all subscriber→category_title mappings in one query
    log('Fetching subscriber categories from MySQL...');
    const [rows] = await MYSQL.query(`
        SELECT nsc.newsletter_subscriber_id AS sub_id,
               c.category_title             AS cat_title
        FROM   newsletter_subscriber_categories nsc
        JOIN   categories c ON c.category_id = nsc.category_id
        WHERE  c.category_title IS NOT NULL AND c.category_title != ''
    `);
    log(`  ${rows.length} subscriber-category links found`);

    // 2. Group category titles by subscriber ID
    const bySubscriber = new Map();
    for (const row of rows) {
        const id = row.sub_id;
        if (!bySubscriber.has(id)) bySubscriber.set(id, new Set());
        bySubscriber.get(id).add(row.cat_title);
    }
    log(`  ${bySubscriber.size} unique subscribers with categories`);

    // 3. Update Neon in batches
    const entries = Array.from(bySubscriber.entries());
    let updated = 0, skipped = 0;

    for (let i = 0; i < entries.length; i += BATCH) {
        const batch = entries.slice(i, i + BATCH);
        await Promise.all(batch.map(async ([subId, catSet]) => {
            try {
                const result = await prisma.newsletterSubscriber.updateMany({
                    where: { id: subId },
                    data:  { categories: Array.from(catSet) },
                });
                if (result.count > 0) updated++;
                else skipped++;
            } catch {
                skipped++;
            }
        }));

        if ((i + BATCH) % 5000 === 0 || i + BATCH >= entries.length) {
            log(`  Progress: ${Math.min(i + BATCH, entries.length)} / ${entries.length}`);
        }
    }

    log(`Done ✅  Updated: ${updated}  Skipped (not in Neon): ${skipped}`);
    await cleanup();
}

async function cleanup() { await prisma.$disconnect(); await MYSQL.end(); }
main().catch(e => { console.error(e); process.exit(1); });
