// One-time, idempotent: repoint legacy PHP `meta_tags.page_url` values at the real
// React routes, so the admin meta-tags manager AND the SSR /render/page injector
// (ssr.controller.js renderPageMeta) both drive the correct live pages.
//
// Before this, only `/` matched a React route, so per-page admin meta never reached
// the storefront (every other row pointed at a dead `/foo/index` PHP path).
//
// Run ON THE VPS (production DB = local Postgres, not the local Neon dev URL):
//   cd /opt/bagchee/api && node scripts/remapMetaTagUrls.js
//
// Safe to re-run: already-remapped rows are skipped, and a row is never moved onto a
// page_url that another row already owns.
import prisma from '../lib/prisma.js';

// legacy PHP page_url  →  live React route
const MAP = {
    '/deals/index':        '/sale',
    '/membership/index':   '/membership',
    '/gift_cards/index':   '/gift-card-detail',
    '/shipping/index':     '/shipping-info',
    '/help/index':         '/help',
    '/testimonials/index': '/testimonials',
    '/contacts/index':     '/contact-us',
    '/application/index':  '/about-us',
    // '/' (home, id 31) already matches its React route — left untouched.
};

async function main() {
    let changed = 0, skipped = 0, missing = 0;
    for (const [legacy, next] of Object.entries(MAP)) {
        const row = await prisma.metaTag.findFirst({
            where: { pageUrl: { equals: legacy, mode: 'insensitive' } },
        });
        if (!row) { console.log(`· no row for ${legacy} — skip`); missing++; continue; }

        const clash = await prisma.metaTag.findFirst({
            where: { pageUrl: { equals: next, mode: 'insensitive' }, id: { not: row.id } },
        });
        if (clash) {
            console.log(`! ${next} already owned by id ${clash.id} — leaving ${legacy} (id ${row.id}) as-is`);
            skipped++;
            continue;
        }

        await prisma.metaTag.update({ where: { id: row.id }, data: { pageUrl: next } });
        console.log(`✓ id ${row.id}: ${legacy} → ${next}`);
        changed++;
    }
    console.log(`\nDone. ${changed} remapped, ${skipped} skipped, ${missing} missing.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
