/**
 * fixProductCoverImages.js
 * Scans /var/www/html/bagchee/assets/images/books to build a lookup table
 * of bagcheeId/filename → full URL, then updates products in Postgres
 * whose default_image is a bare filename (not a full URL).
 *
 * Run on VPS:
 *   cd /opt/bagchee/api && node scripts/fixProductCoverImages.js
 */

import { execSync } from 'child_process';
import prisma from '../lib/prisma.js';

const BOOKS_DIR = '/var/www/html/bagchee/assets/images/books';
const BASE_URL  = 'https://www.bagchee.com/assets/images/books';
const BATCH     = 1000;

async function main() {
    console.log('Scanning filesystem for book cover images...');

    const raw = execSync(
        `find ${BOOKS_DIR} -type f \\( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" \\)`,
        { maxBuffer: 300 * 1024 * 1024 }
    ).toString();

    // Build lookup: "bagcheeId/filename" → "year/month/bagcheeId/filename"
    const lookup = new Map();
    for (const line of raw.split('\n')) {
        if (!line.trim()) continue;
        const rel = line.replace(BOOKS_DIR + '/', '');
        const parts = rel.split('/');
        if (parts.length < 4) continue;
        const [year, , productId, filename] = parts;
        const key = `${productId}/${filename}`;
        if (!lookup.has(key) || year > lookup.get(key).split('/')[0]) {
            lookup.set(key, rel);
        }
    }
    console.log(`Filesystem lookup built: ${lookup.size} entries`);

    // Count products to fix
    const countResult = await prisma.$queryRaw`
        SELECT COUNT(*)::int AS cnt FROM products
        WHERE default_image IS NOT NULL
          AND default_image != ''
          AND default_image NOT LIKE 'http%'
    `;
    const total = countResult[0].cnt;
    console.log(`Products with bare filenames: ${total}`);
    if (total === 0) { console.log('Nothing to fix.'); await prisma.$disconnect(); return; }

    let offset = 0;
    let updated = 0;
    let notFound = 0;

    while (offset < total) {
        const rows = await prisma.$queryRaw`
            SELECT id, bagchee_id, default_image
            FROM products
            WHERE default_image IS NOT NULL
              AND default_image != ''
              AND default_image NOT LIKE 'http%'
            ORDER BY id
            LIMIT ${BATCH} OFFSET ${offset}
        `;

        for (const row of rows) {
            const bagcheeId = String(row.bagchee_id || '').replace(/^BB/i, '');
            const filename  = row.default_image;
            const key = `${bagcheeId}/${filename}`;
            const rel = lookup.get(key);
            if (rel) {
                await prisma.$executeRaw`
                    UPDATE products SET default_image = ${`${BASE_URL}/${rel}`} WHERE id = ${row.id}
                `;
                updated++;
            } else {
                notFound++;
            }
        }

        offset += BATCH;
        console.log(`Progress: ${Math.min(offset, total)}/${total} — updated: ${updated}, not found: ${notFound}`);
    }

    console.log(`\nDone. Updated: ${updated}, Not found on disk: ${notFound}`);
    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
