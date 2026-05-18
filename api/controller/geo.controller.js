export const getGeo = (req, res) => {
    const country = (req.headers['cf-ipcountry'] || '').toUpperCase();
    const isIndia = country === 'IN';
    const maintenance = isIndia && process.env.INDIA_MAINTENANCE === 'true';
    res.json({ country: country || 'UNKNOWN', isIndia, maintenance });
};
