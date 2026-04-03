import prisma from '../lib/prisma.js';

const SITE_URL = process.env.FRONTEND_URL || 'https://www.bagchee.com';
const PAGE_SIZE = 10000; // Max URLs per sitemap file

const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';

const toSlug = (title = '') =>
    title.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

const urlTag = (loc, lastmod, changefreq, priority) => `
  <url>
    <loc>${loc}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    ${changefreq ? `<changefreq>${changefreq}</changefreq>` : ''}
    ${priority ? `<priority>${priority}</priority>` : ''}
  </url>`;

// GET /sitemap.xml — sitemap index pointing to sub-sitemaps
export const getSitemapIndex = async (req, res) => {
    try {
        const apiBase = `${req.protocol}://${req.get('host')}`;

        const totalProducts = await prisma.products.count({ where: { isActive: true } });
        const productPages = Math.ceil(totalProducts / PAGE_SIZE);

        const sitemaps = [
            `${apiBase}/sitemap-static.xml`,
            `${apiBase}/sitemap-categories.xml`,
        ];
        for (let i = 1; i <= productPages; i++) {
            sitemaps.push(`${apiBase}/sitemap-products.xml?page=${i}`);
        }

        const xml = `${xmlHeader}
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(loc => `  <sitemap><loc>${loc}</loc></sitemap>`).join('\n')}
</sitemapindex>`;

        res.header('Content-Type', 'application/xml');
        res.header('Cache-Control', 'public, max-age=3600'); // 1-hour cache
        res.send(xml);
    } catch (err) {
        res.status(500).send('Error generating sitemap');
    }
};

// GET /sitemap-static.xml — static pages
export const getSitemapStatic = (req, res) => {
    const staticPages = [
        { path: '/',                   changefreq: 'daily',   priority: '1.0' },
        { path: '/books',              changefreq: 'daily',   priority: '0.9' },
        { path: '/bestsellers',        changefreq: 'daily',   priority: '0.9' },
        { path: '/sale',               changefreq: 'daily',   priority: '0.9' },
        { path: '/recommended',        changefreq: 'weekly',  priority: '0.8' },
        { path: '/new-arrivals',       changefreq: 'daily',   priority: '0.8' },
        { path: '/membership',         changefreq: 'monthly', priority: '0.7' },
        { path: '/about-us',           changefreq: 'monthly', priority: '0.6' },
        { path: '/contact-us',         changefreq: 'monthly', priority: '0.5' },
        { path: '/browse-categories',  changefreq: 'weekly',  priority: '0.7' },
        { path: '/privacy-policy',     changefreq: 'yearly',  priority: '0.3' },
        { path: '/terms-conditions',   changefreq: 'yearly',  priority: '0.3' },
        { path: '/help',               changefreq: 'monthly', priority: '0.5' },
        { path: '/services',           changefreq: 'monthly', priority: '0.5' },
        { path: '/publishers-authors', changefreq: 'monthly', priority: '0.5' },
        { path: '/testimonials',       changefreq: 'monthly', priority: '0.4' },
    ];

    const today = new Date().toISOString().split('T')[0];

    const xml = `${xmlHeader}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(p => urlTag(`${SITE_URL}${p.path}`, today, p.changefreq, p.priority)).join('')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=86400'); // 24-hour cache
    res.send(xml);
};

// GET /sitemap-categories.xml — all active categories
export const getSitemapCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true },
        });

        const xml = `${xmlHeader}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categories.map(cat => {
    const slug = cat.slug ? cat.slug.split('/').pop() : null;
    if (!slug) return '';
    const lastmod = cat.updatedAt ? cat.updatedAt.toISOString().split('T')[0] : '';
    return urlTag(`${SITE_URL}/books/${slug}`, lastmod, 'weekly', '0.8');
}).join('')}
</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.header('Cache-Control', 'public, max-age=3600');
        res.send(xml);
    } catch (err) {
        res.status(500).send('Error generating categories sitemap');
    }
};

// GET /sitemap-products.xml?page=1 — paginated products
export const getSitemapProducts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);

        const products = await prisma.products.findMany({
            where: { isActive: true },
            select: { bagcheeId: true, id: true, title: true, updatedAt: true },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            orderBy: { id: 'asc' },
        });

        const xml = `${xmlHeader}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${products.map(p => {
    const idPart = p.bagcheeId || p.id;
    const slug = toSlug(p.title) || 'product';
    const lastmod = p.updatedAt ? p.updatedAt.toISOString().split('T')[0] : '';
    return urlTag(`${SITE_URL}/books/${idPart}/${slug}`, lastmod, 'monthly', '0.6');
}).join('')}
</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.header('Cache-Control', 'public, max-age=3600');
        res.send(xml);
    } catch (err) {
        res.status(500).send('Error generating products sitemap');
    }
};
