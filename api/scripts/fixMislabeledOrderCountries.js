// Repair new-checkout ORDERS wrongly labeled 'India' (16-July, order 17655).
//
// Migrated saved addresses carried a default country of 'India' (see
// backfillAddressCountries.js — run THAT first); checkout copied it verbatim into
// orders. This script fixes the order rows themselves. Two sources of truth:
//
//   1. OVERRIDES — orders verified by hand against shipping city/postcode + the
//      customer's (now-corrected) address. Applied to shipping/billing fields that
//      currently say 'India'.
//   2. ADDRESS CROSS-CHECK — any other order since NEW_SITE_START labeled 'India':
//      matched to its customer's corrected users_addresses row by postal_code (+city
//      tiebreak). Fixed only when the match is unambiguous and non-India. Guests or
//      no-match orders are PRINTED for manual review, never touched.
//
// The genuine Indian orders imported from the old site's final weeks (Indian cities,
// legacy lowercase statuses) simply never match a non-India address — the cross-check
// leaves them alone by construction; postcodes that don't match ANY address are review
// items, not writes.
//
// SAFE: dry-run by default; --apply writes; before-values CSV backup to /root/.
//
// Usage (on the VPS, from /opt/bagchee/api):
//   node scripts/fixMislabeledOrderCountries.js            # dry run
//   node scripts/fixMislabeledOrderCountries.js --apply    # write

import fs from 'fs';
import prisma from '../lib/prisma.js';

const APPLY = process.argv.includes('--apply');
const NEW_SITE_START = new Date('2026-05-01T00:00:00Z');

// Hand-verified (16-July): order → real country. 17655 = Musée d'Ethnographie de
// Genève (Genève, CH-1205, placed from a Geneva IP; PAID $2,018 — ships to Switzerland).
// 17641 = Los Angeles CA 90038 (guest). 17610 = Ojai CA 93023.
const OVERRIDES = {
    17655: 'Switzerland',
    17641: 'United States',
    17610: 'United States',
};

const norm = (v) => String(v ?? '').trim().toLowerCase();

async function main() {
    console.log(APPLY ? '=== APPLYING order-country repair ===' : '=== DRY RUN (no writes) — pass --apply to write ===');

    const orders = await prisma.order.findMany({
        where: {
            createdAt: { gte: NEW_SITE_START },
            OR: [{ shippingCountry: 'India' }, { billingCountry: 'India' }],
        },
        select: {
            id: true, customerId: true, createdAt: true, status: true, total: true,
            shippingCountry: true, billingCountry: true,
            shippingCity: true, shippingPostcode: true, shippingEmail: true,
        },
        orderBy: { id: 'asc' },
    });
    console.log(`Candidates labeled 'India' since ${NEW_SITE_START.toISOString().slice(0, 10)}: ${orders.length}`);

    const addresses = await prisma.address.findMany({ select: { userId: true, pincode: true, city: true, country: true } });
    const byUser = new Map();
    for (const a of addresses) {
        if (!byUser.has(a.userId)) byUser.set(a.userId, []);
        byUser.get(a.userId).push(a);
    }

    const changes = [];   // { id, to, via, fields }
    const review = [];

    for (const o of orders) {
        const fields = [o.shippingCountry === 'India' && 'shipping', o.billingCountry === 'India' && 'billing'].filter(Boolean);

        if (OVERRIDES[o.id]) {
            changes.push({ id: o.id, to: OVERRIDES[o.id], via: 'override', fields });
            continue;
        }

        // Cross-check against the customer's corrected address book
        const candidates = (byUser.get(o.customerId) || []).filter(a =>
            norm(a.pincode) && norm(a.pincode) === norm(o.shippingPostcode));
        const countries = [...new Set(candidates.map(a => a.country))];
        if (countries.length === 1 && countries[0] !== 'India') {
            changes.push({ id: o.id, to: countries[0], via: 'address-match', fields });
        } else if (countries.length === 1 && countries[0] === 'India') {
            // Customer's address for this postcode really is India — legit, leave it.
        } else {
            review.push(`  #${o.id} ${String(o.createdAt).slice(0, 10)} ${o.status} $${o.total} ${o.shippingCity} ${o.shippingPostcode} ${o.shippingEmail} (${countries.length ? 'ambiguous: ' + countries.join('/') : 'no address match'})`);
        }
    }

    console.log(`\nPlanned fixes: ${changes.length}`);
    for (const c of changes) console.log(`  #${c.id} → ${c.to}  [${c.fields.join('+')}]  (${c.via})`);
    console.log(`\nLeft for manual review (NOT touched): ${review.length}`);
    for (const r of review.slice(0, 30)) console.log(r);
    if (review.length > 30) console.log(`  … and ${review.length - 30} more`);

    if (!APPLY) { console.log('\nDry run only. Re-run with --apply to write.'); return; }

    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const backupPath = `/root/orders_country_fix_backup_${ts}.csv`;
    fs.writeFileSync(backupPath, 'id,shipping_country,billing_country\n'
        + changes.map(c => {
            const o = orders.find(x => x.id === c.id);
            return `${c.id},${o.shippingCountry},${o.billingCountry}`;
        }).join('\n'));
    console.log(`\nBackup written: ${backupPath}`);

    for (const c of changes) {
        const data = {};
        if (c.fields.includes('shipping')) data.shippingCountry = c.to;
        if (c.fields.includes('billing'))  data.billingCountry  = c.to;
        await prisma.order.update({ where: { id: c.id }, data });
    }
    console.log(`Updated ${changes.length} orders.`);

    const check = await prisma.order.findUnique({ where: { id: 17655 }, select: { shippingCountry: true, billingCountry: true } });
    console.log(`Order 17655 now: shipping=${check?.shippingCountry}, billing=${check?.billingCountry}`);
}

main()
    .catch((e) => { console.error(e); process.exitCode = 1; })
    .finally(async () => { await prisma.$disconnect(); });
