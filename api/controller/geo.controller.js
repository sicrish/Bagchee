import geoip from 'geoip-lite';

export const getGeo = (req, res) => {
    // Prefer Cloudflare header (present when traffic goes through CF proxy)
    const cfCountry = (req.headers['cf-ipcountry'] || '').toUpperCase();
    if (cfCountry && cfCountry !== 'XX') {
        const isIndia = cfCountry === 'IN';
        const maintenance = isIndia && process.env.INDIA_MAINTENANCE === 'true';
        return res.json({ country: cfCountry, isIndia, maintenance });
    }

    // Fallback: local GeoIP database (handles Railway/direct-IP calls with no CF header)
    const raw = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ip = raw.split(',')[0].trim().replace(/^::ffff:/, '');
    const geo = geoip.lookup(ip);
    const country = (geo?.country || '').toUpperCase();
    const isIndia = country === 'IN';
    const maintenance = isIndia && process.env.INDIA_MAINTENANCE === 'true';
    res.json({ country: country || 'UNKNOWN', isIndia, maintenance });
};
