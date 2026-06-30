// Set the REAL per-option GBP shipping prices supplied by the client (2026-06-30).
//
// Supersedes the placeholder defaults from scripts/backfillGbpShipping.js (USD * 0.78).
// Client-confirmed pound prices, mapped to the live shipping rows by id (titles shown for
// verification — id 5's title carries no "express" keyword, so id mapping is authoritative):
//
//   id 4  "12-15 Days Standard Worldwide Shipping"   → £9.00   (Standard)
//   id 3  "10-12 Days Expedited Worldwide Shipping"  → £12.00  (Expedited)
//   id 5  "3-5 Days Worldwide Delivery"              → £36.00  (Express)
//
// SAFE + IDEMPOTENT:
//   • Sets each listed option's priceGbp to the exact client value (overwrites the old
//     placeholder default / 0). Re-running is a no-op once the values are in place.
//   • Touches ONLY priceGbp — never priceUsd/priceEur/priceInr or any other field.
//   • Prints any extra shipping rows not in the map so they can be reviewed by hand.
//
// Usage (run on the VPS, from /opt/bagchee/api):
//   node scripts/setGbpShippingReal.js            # dry run — shows what WOULD change, no writes
//   node scripts/setGbpShippingReal.js --apply    # perform the update

import prisma from '../lib/prisma.js';

const APPLY = process.argv.includes('--apply');
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Authoritative id → real GBP price (client-confirmed 2026-06-30). Label is for display only.
const GBP_BY_ID = {
    4: { gbp: 9.0, label: 'Standard' },
    3: { gbp: 12.0, label: 'Expedited' },
    5: { gbp: 36.0, label: 'Express' },
};

async function main() {
    console.log(APPLY ? '=== APPLYING real GBP shipping prices ===' : '=== DRY RUN (no writes) — pass --apply to write ===');
    const options = await prisma.shippingOption.findMany({ orderBy: { ord: 'asc' } });

    for (const o of options) {
        const target = GBP_BY_ID[o.id];
        if (!target) {
            console.log(`    #${o.id} "${o.title}"  priceGbp=${o.priceGbp}  (not in map — review by hand if it needs GBP)`);
            continue;
        }
        const want = round2(target.gbp);
        const current = round2(o.priceGbp);
        const change = current === want ? '(already set)' : `${current} → ${want}`;
        console.log(`    #${o.id} ${target.label}  "${o.title}"  priceGbp ${change}`);
        if (APPLY && current !== want) {
            await prisma.shippingOption.update({ where: { id: o.id }, data: { priceGbp: want } });
        }
    }

    console.log(APPLY ? '\nDone.' : '\nDry run complete. Re-run with --apply to write.');
}

main()
    .catch((e) => { console.error('Set-GBP error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
