import prisma from './prisma.js';

// Blocklist matching shared by saveOrder (the enforcement gate) and /geo (the
// storefront's browse-but-can't-order flag). The list is tiny; a short cache keeps
// both paths cheap while admin edits still bite within a minute.

let cache = { rows: [], expires: 0 };

const load = async () => {
    if (Date.now() < cache.expires) return cache.rows;
    try {
        cache = { rows: await prisma.blockedParty.findMany(), expires: Date.now() + 60_000 };
    } catch {
        // DB hiccup: keep serving the last known list, retry soon
        cache.expires = Date.now() + 30_000;
    }
    return cache.rows;
};

export const invalidateBlocklistCache = () => { cache.expires = 0; };

export const blockedCountrySet = async () =>
    new Set((await load()).filter(r => r.kind === 'country').map(r => String(r.value).toUpperCase()));

// Returns the matching entry or null. Email/country match exactly (case-insensitive);
// an ip entry ending in '.' or ':' is a prefix ("103.42.53." matches the whole /24).
export const findBlockMatch = async ({ emails = [], ip = '', country = '' }) => {
    const rows = await load();
    const emailSet = new Set(emails.filter(Boolean).map(e => String(e).trim().toLowerCase()));
    const ipNorm = String(ip || '').trim();
    const countryNorm = String(country || '').trim().toUpperCase();
    return rows.find(r => {
        const v = String(r.value || '').trim();
        if (r.kind === 'email')   return emailSet.has(v.toLowerCase());
        if (r.kind === 'country') return !!countryNorm && v.toUpperCase() === countryNorm;
        if (r.kind === 'ip')      return !!ipNorm && ((v.endsWith('.') || v.endsWith(':')) ? ipNorm.startsWith(v) : ipNorm === v);
        return false;
    }) || null;
};
