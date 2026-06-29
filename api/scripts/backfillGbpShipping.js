// One-time backfill for the 29-June multi-currency batch.
//
// Two safe, idempotent steps:
//   1. ShippingOption.priceGbp — newly added column. Seed a sensible default
//      (round(priceUsd * 0.78), matching the EUR/GBP fallback rate) for every row whose
//      priceGbp is still 0, so GBP shipping never shows £0.00 before the client enters the
//      real per-option pound prices in /admin/shipping-options. Rows that already have a
//      non-zero priceGbp are left untouched.
//   2. order_statuses — ensure an "In Progress" row exists so admins can also pick it
//      manually from the Order Status dropdown (paid orders already display it because the
//      current status is always added to the dropdown, but the row makes it selectable).
//
// SAFE + IDEMPOTENT:
//   • Only fills priceGbp where it is currently 0 — never overwrites an admin-entered value.
//   • Creates the status row only if missing (case-insensitive check).
//   • Re-running changes nothing once applied.
//
// Usage (run on the VPS, from /opt/bagchee/api):
//   node scripts/backfillGbpShipping.js            # dry run — shows what WOULD change, no writes
//   node scripts/backfillGbpShipping.js --apply    # perform the backfill

import prisma from '../lib/prisma.js';

const APPLY = process.argv.includes('--apply');
const GBP_RATE = 0.78; // matches FALLBACK in api/lib/exchangeRates.js and the frontend default
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

async function backfillShippingGbp() {
    const options = await prisma.shippingOption.findMany({ orderBy: { ord: 'asc' } });
    const toFill = options.filter((o) => !(Number(o.priceGbp) > 0));
    console.log(`\n[1] ShippingOption.priceGbp — ${options.length} options, ${toFill.length} need a default:`);
    for (const o of toFill) {
        const gbp = round2(Number(o.priceUsd) * GBP_RATE);
        console.log(`    #${o.id} "${o.title}"  USD ${o.priceUsd} → GBP ${gbp}`);
        if (APPLY) {
            await prisma.shippingOption.update({ where: { id: o.id }, data: { priceGbp: gbp } });
        }
    }
    if (!toFill.length) console.log('    (nothing to fill)');
}

async function ensureInProgressStatus() {
    const existing = await prisma.orderStatus.findFirst({
        where: { name: { equals: 'In Progress', mode: 'insensitive' } },
    });
    console.log(`\n[2] order_statuses — "In Progress" row ${existing ? 'already exists (id ' + existing.id + ')' : 'MISSING'}:`);
    if (!existing) {
        console.log('    → will create "In Progress"');
        if (APPLY) {
            const created = await prisma.orderStatus.create({ data: { name: 'In Progress' } });
            console.log(`    created id ${created.id}`);
        }
    }
}

async function main() {
    console.log(APPLY ? '=== APPLYING backfill ===' : '=== DRY RUN (no writes) — pass --apply to write ===');
    await backfillShippingGbp();
    await ensureInProgressStatus();
    console.log(APPLY ? '\nDone.' : '\nDry run complete. Re-run with --apply to write.');
}

main()
    .catch((e) => { console.error('Backfill error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
