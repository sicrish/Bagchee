// Backfill users_addresses.country from the old MySQL site (16-July, order 17655).
//
// The migration copied the address book but never resolved the old `country_id` into
// a name, so 23,896 of 23,902 PG rows carry the schema default 'India' — including a
// Geneva museum whose PAID order then shipped labeled India. The old MariaDB `bagchee`
// DB (still on this VPS) holds the truth: users_addresses.country_id + the countries map.
//
// Two passes, both ONLY over PG rows whose country is exactly 'India' (rows a user
// already fixed by hand are never touched; an old row that really is India writes
// 'India' again — a no-op):
//   1. id-join: PG id == old id (ids were preserved; user_id must ALSO match, else skip)
//   2. recreated rows (edit = delete+re-create, so id > old max): match the same user's
//      old rows by postal_code (trimmed, case-insensitive); apply only when every match
//      agrees on one country.
//
// SAFE: dry-run by default; --apply writes. Before writing, a full backup CSV of every
// row about to change (id, old country value) goes to /root/ for rollback.
//
// Usage (on the VPS, from /opt/bagchee/api):
//   node scripts/backfillAddressCountries.js            # dry run
//   node scripts/backfillAddressCountries.js --apply    # write
//
// Rollback: UPDATE users_addresses SET country='India' WHERE id IN (backup csv ids);

import fs from 'fs';
import prisma from '../lib/prisma.js';
import mysql from 'mysql2/promise';

const APPLY = process.argv.includes('--apply');
const MYSQL = await mysql.createPool({
    host: '127.0.0.1', user: 'bagchee_migrator', password: 'migrator_pw',
    database: 'bagchee', connectionLimit: 5, dateStrings: false,
});

const norm = (v) => String(v ?? '').trim().toLowerCase();

async function main() {
    console.log(APPLY ? '=== APPLYING address-country backfill ===' : '=== DRY RUN (no writes) — pass --apply to write ===');

    // Old-site truth: every old address with its resolved country name
    const [oldRows] = await MYSQL.query(`
        SELECT a.id, a.user_id, a.postal_code, a.city, c.name AS country
        FROM users_addresses a
        LEFT JOIN countries c ON c.country_id = a.country_id
    `);
    const oldById = new Map(oldRows.map(r => [r.id, r]));
    const oldByUser = new Map();
    for (const r of oldRows) {
        if (!oldByUser.has(r.user_id)) oldByUser.set(r.user_id, []);
        oldByUser.get(r.user_id).push(r);
    }
    console.log(`Old MySQL: ${oldRows.length} address rows (${oldRows.filter(r => r.country).length} with a resolvable country)`);

    const pgRows = await prisma.address.findMany({ select: { id: true, userId: true, pincode: true, city: true, country: true } });
    const targets = pgRows.filter(r => r.country === 'India');
    console.log(`PG: ${pgRows.length} rows, ${targets.length} currently 'India' (only these are candidates)\n`);

    const changes = [];        // { id, from, to, via }
    const skipped = { userMismatch: [], noSource: [], ambiguous: [] };

    for (const pg of targets) {
        const old = oldById.get(pg.id);
        if (old && old.user_id === pg.userId) {
            // Pass 1 — direct id match
            if (old.country && old.country !== 'India') changes.push({ id: pg.id, from: pg.country, to: old.country, via: 'id' });
            continue; // old says India/unknown → leave as-is
        }
        if (old && old.user_id !== pg.userId) { skipped.userMismatch.push(pg.id); continue; }

        // Pass 2 — recreated row: same user's old rows, postal_code match
        const candidates = (oldByUser.get(pg.userId) || []).filter(o =>
            o.country && norm(o.postal_code) && norm(o.postal_code) === norm(pg.pincode));
        const countries = [...new Set(candidates.map(o => o.country))];
        if (countries.length === 1) {
            if (countries[0] !== 'India') changes.push({ id: pg.id, from: pg.country, to: countries[0], via: 'user+postcode' });
        } else if (countries.length > 1) {
            skipped.ambiguous.push(pg.id);
        } else {
            skipped.noSource.push(pg.id);
        }
    }

    // Report
    const byCountry = {};
    for (const c of changes) byCountry[c.to] = (byCountry[c.to] || 0) + 1;
    console.log(`Planned changes: ${changes.length} rows  (pass1 id-join: ${changes.filter(c => c.via === 'id').length}, pass2 user+postcode: ${changes.filter(c => c.via === 'user+postcode').length})`);
    console.log('Target country distribution:', Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 15));
    console.log(`Left as 'India' — no old source: ${skipped.noSource.length}, ambiguous: ${skipped.ambiguous.length}, id/user mismatch: ${skipped.userMismatch.length}`);
    for (const s of changes.slice(0, 8)) console.log(`  sample: #${s.id} India → ${s.to} (${s.via})`);
    const geneva = changes.find(c => c.id === 35805);
    console.log(geneva ? `✓ 35805 (Geneva museum) → ${geneva.to}` : '⚠ 35805 NOT in change set — check pass 2 inputs');

    if (!APPLY) { console.log('\nDry run only. Re-run with --apply to write.'); return; }

    // Backup CSV (before-values) then write, grouped by target country
    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const backupPath = `/root/addresses_country_backup_${ts}.csv`;
    fs.writeFileSync(backupPath, 'id,old_country\n' + changes.map(c => `${c.id},${c.from}`).join('\n'));
    console.log(`\nBackup written: ${backupPath} (${changes.length} rows)`);

    const byTarget = new Map();
    for (const c of changes) {
        if (!byTarget.has(c.to)) byTarget.set(c.to, []);
        byTarget.get(c.to).push(c.id);
    }
    let done = 0;
    for (const [country, ids] of byTarget) {
        const res = await prisma.address.updateMany({ where: { id: { in: ids }, country: 'India' }, data: { country } });
        done += res.count;
    }
    console.log(`Updated ${done} rows.`);

    // Post-checks
    const still = await prisma.address.count({ where: { country: 'India' } });
    const g = await prisma.address.findUnique({ where: { id: 35805 }, select: { country: true, city: true } });
    console.log(`Rows still 'India' (genuine + unresolvable): ${still}`);
    console.log(`Row 35805 now: ${g?.country} (${g?.city})`);
}

main()
    .catch((e) => { console.error(e); process.exitCode = 1; })
    .finally(async () => { await prisma.$disconnect(); await MYSQL.end(); });
