import geoip from 'geoip-lite';

// Client identity resolution shared by /geo and the order blocklist gate (16-July).
// Cloudflare fronts the site, so CF-Connecting-IP is the real visitor and cf-ipcountry
// their country. Direct-to-origin calls fall back to X-Forwarded-For (Apache appends the
// real client IP — mod_remoteip validated), then the socket.

const stripV4Prefix = (ip) => String(ip || '').trim().replace(/^::ffff:/, '');

export const resolveClientIp = (req) => {
    const cf = stripV4Prefix(req.headers['cf-connecting-ip']);
    if (cf) return cf;
    const xff = stripV4Prefix(String(req.headers['x-forwarded-for'] || '').split(',')[0]);
    if (xff) return xff;
    return stripV4Prefix(req.socket?.remoteAddress);
};

export const resolveClientCountry = (req) => {
    const cfCountry = String(req.headers['cf-ipcountry'] || '').toUpperCase();
    if (cfCountry && cfCountry !== 'XX') return cfCountry;
    const geo = geoip.lookup(resolveClientIp(req));
    return String(geo?.country || '').toUpperCase();
};
