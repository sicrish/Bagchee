import { resolveClientCountry } from '../lib/clientRequest.js';
import { blockedCountrySet } from '../lib/blocklist.js';

export const getGeo = async (req, res) => {
    // Cloudflare header first, else the local GeoIP database — both via the shared
    // helper so /geo and the saveOrder blocklist gate always agree on where a visitor is.
    const country = resolveClientCountry(req) || 'UNKNOWN';
    const isIndia = country === 'IN';
    const maintenance = isIndia && process.env.INDIA_MAINTENANCE === 'true';

    // Countries barred from ordering (admin blocklist, e.g. BD): they browse normally
    // but the storefront hides purchase actions — saveOrder enforces it server-side.
    let orderBlocked = false;
    try {
        orderBlocked = (await blockedCountrySet()).has(country);
    } catch { /* /geo must never fail because of the blocklist */ }

    res.json({ country, isIndia, maintenance, orderBlocked });
};
