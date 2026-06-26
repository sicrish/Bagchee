// One-time backfill — surface PRE-SPLIT customer checkout notes in the new red banner.
//
// Before the 23-June "customer comment" split, a customer's checkout note was written to
// Order.comment. New orders write it to Order.customerComment instead, and EditOrders shows
// that field as a prominent red banner. This copies the old notes across so the banner also
// shows for orders placed before the split (e.g. #17605).
//
// SAFE + REVERSIBLE:
//   • COPY, not move — Order.comment is left untouched, so nothing is lost.
//   • Restricted to orders created BEFORE the split date, so a post-split admin-only note
//     (which legitimately lives in `comment`) is never mislabelled as a customer comment.
//   • Only fills rows whose customer_comment is still empty.
//   • Undo: UPDATE orders SET customer_comment = '' WHERE created_at < '2026-06-23' ...
//
// Usage (run on the VPS, from /opt/bagchee/api):
//   node scripts/backfillCustomerComments.js            # dry run — counts + samples, no writes
//   node scripts/backfillCustomerComments.js --apply    # perform the copy

import prisma from '../lib/prisma.js';

const CUTOFF = '2026-06-23'; // split deployed 2026-06-23 — only touch orders created before it
const APPLY = process.argv.includes('--apply');

// No user input — CUTOFF is a hardcoded constant — so raw SQL here is safe.
const WHERE = `
    (customer_comment IS NULL OR customer_comment = '')
    AND comment IS NOT NULL AND comment <> ''
    AND created_at < '${CUTOFF}'
`;

async function main() {
    const [{ count }] = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS count FROM orders WHERE ${WHERE}`
    );
    console.log(`Pre-split orders with a customer note to backfill: ${count}`);

    const sample = await prisma.$queryRawUnsafe(
        `SELECT id, created_at, LEFT(comment, 80) AS comment FROM orders WHERE ${WHERE} ORDER BY id DESC LIMIT 5`
    );
    if (sample.length) {
        console.log('Sample (latest 5):');
        sample.forEach(r =>
            console.log(`  #${r.id}  ${new Date(r.created_at).toISOString().slice(0, 10)}  "${r.comment}"`)
        );
    }

    // Does the order the client referenced (#17605) qualify?
    const ex = await prisma.$queryRawUnsafe(
        `SELECT id,
                (customer_comment IS NULL OR customer_comment = '') AS empty_customer_comment,
                (comment IS NOT NULL AND comment <> '')             AS has_comment,
                (created_at < '${CUTOFF}')                          AS pre_split
         FROM orders WHERE id = 17605`
    );
    console.log('Order #17605:', ex[0] || '(not found)');

    if (!APPLY) {
        console.log('\nDRY RUN — no changes written. Re-run with --apply to copy comment → customer_comment.');
        return;
    }

    const affected = await prisma.$executeRawUnsafe(
        `UPDATE orders SET customer_comment = comment WHERE ${WHERE}`
    );
    console.log(`\n✓ Backfilled ${affected} order(s): copied comment → customer_comment.`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
