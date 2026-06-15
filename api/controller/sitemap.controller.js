import prisma from '../lib/prisma.js';
import { cache } from '../lib/cache.js';

// All sitemap URLs use the canonical www host so crawlers index ONE host.
const SITE_URL = (process.env.FRONTEND_URL || 'https://www.bagchee.com').split(',')[0].trim();
const PAGE_SIZE = 25000;             // URLs per sub-sitemap (well under the 50k protocol limit)
const SIX_HOURS = 6 * 60 * 60 * 1000; // in-memory cache TTL — absorbs crawler bursts, no per-hit DB load

const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';

// Slug from a title/name. MUST match the frontend's canonical slug (header.jsx /
// ProductCard) so the sitemap emits the SAME URLs the site links to — otherwise a
// crawler sees two URLs for one page. The book/category page itself is fetched by
// bagcheeId/slug-lookup, so the slug is descriptive, but it must still be consistent.
const toSlug = (s = '') =>
    String(s).toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

const xmlEscape = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const iso = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');

const urlTag = (loc, lastmod, changefreq, priority) =>
    `  <url><loc>${xmlEscape(loc)}</loc>` +
    (lastmod ? `<lastmod>${lastmod}</lastmod>` : '') +
    (changefreq ? `<changefreq>${changefreq}</changefreq>` : '') +
    (priority ? `<priority>${priority}</priority>` : '') +
    '</url>';

const urlset = (urls) =>
    `${xmlHeader}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.filter(Boolean).join('\n')}\n</urlset>`;

const sendXml = (res, xml, maxAge = 3600) => {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    // Short edge cache (1h) — the heavy lifting is the in-memory `cache` (6h) that spares
    // the DB; a long CDN cache only adds staleness + a purge dependency for a resource
    // crawlers fetch a handful of times a day. Overrides app.js global no-store.
    res.header('Cache-Control', `public, max-age=${maxAge}`);
    res.send(xml);
};

// GET /sitemap.xml — index pointing to every sub-sitemap (paginated for products + authors)
export const getSitemapIndex = async (req, res) => {
    try {
        const xml = await cache.get('sitemap-index', SIX_HOURS, async () => {
            const [productCount, authorCount] = await Promise.all([
                prisma.product.count({ where: { isActive: true } }),
                prisma.author.count({ where: { products: { some: {} } } }),
            ]);
            const productPages = Math.max(1, Math.ceil(productCount / PAGE_SIZE));
            const authorPages  = Math.max(1, Math.ceil(authorCount  / PAGE_SIZE));

            const children = [
                `${SITE_URL}/sitemap-static.xml`,
                `${SITE_URL}/sitemap-categories.xml`,
                `${SITE_URL}/sitemap-publishers.xml`,
            ];
            for (let i = 1; i <= authorPages;  i++) children.push(`${SITE_URL}/sitemap-authors.xml?page=${i}`);
            for (let i = 1; i <= productPages; i++) children.push(`${SITE_URL}/sitemap-products.xml?page=${i}`);

            const today = iso(new Date());
            return `${xmlHeader}\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
                children.map(loc => `  <sitemap><loc>${xmlEscape(loc)}</loc><lastmod>${today}</lastmod></sitemap>`).join('\n') +
                '\n</sitemapindex>';
        });
        sendXml(res, xml);
    } catch (err) {
        console.error('Sitemap index error:', err.message);
        res.status(500).send('Error generating sitemap');
    }
};

// GET /sitemap-static.xml — hand-curated static pages
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
    const today = iso(new Date());
    sendXml(res, urlset(staticPages.map(p => urlTag(`${SITE_URL}${p.path}`, today, p.changefreq, p.priority))), 86400);
};

// GET /sitemap-categories.xml — active categories (/books/:slug, matches header catLink)
export const getSitemapCategories = async (req, res) => {
    try {
        const xml = await cache.get('sitemap-categories', SIX_HOURS, async () => {
            const categories = await prisma.category.findMany({
                // exclude the artificial "Root Category" placeholder node (not a real browse page)
                where: { active: true, slug: { not: 'root-category' } },
                select: { slug: true, createdAt: true }, // Category has no updatedAt column
            });
            return urlset(categories.map(c =>
                c.slug ? urlTag(`${SITE_URL}/books/${c.slug}`, iso(c.createdAt), 'weekly', '0.8') : ''
            ));
        });
        sendXml(res, xml);
    } catch (err) {
        console.error('Sitemap categories error:', err.message);
        res.status(500).send('Error generating categories sitemap');
    }
};

// GET /sitemap-publishers.xml — publishers with a slug + books (/publisher/:slug)
export const getSitemapPublishers = async (req, res) => {
    try {
        const xml = await cache.get('sitemap-publishers', SIX_HOURS, async () => {
            const publishers = await prisma.publisher.findMany({
                where: { slug: { not: '' }, products: { some: {} } },
                select: { slug: true },
            });
            return urlset(publishers.map(p =>
                p.slug ? urlTag(`${SITE_URL}/publisher/${p.slug}`, '', 'monthly', '0.6') : ''
            ));
        });
        sendXml(res, xml);
    } catch (err) {
        console.error('Sitemap publishers error:', err.message);
        res.status(500).send('Error generating publishers sitemap');
    }
};

// GET /sitemap-authors.xml?page=1 — authors with books (/author/:nameSlug). The slug is
// derived from fullName with the SAME algorithm getAuthorBySlug round-trips on.
export const getSitemapAuthors = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const xml = await cache.get(`sitemap-authors-${page}`, SIX_HOURS, async () => {
            const authors = await prisma.author.findMany({
                where: { products: { some: {} } },
                select: { firstName: true, lastName: true, fullName: true },
                skip: (page - 1) * PAGE_SIZE,
                take: PAGE_SIZE,
                orderBy: { id: 'asc' },
            });
            const seen = new Set();
            const urls = [];
            for (const a of authors) {
                const name = (a.fullName && a.fullName.trim()) || `${a.firstName || ''} ${a.lastName || ''}`.trim();
                const slug = toSlug(name);
                if (!slug || seen.has(slug)) continue; // skip blanks + collapse duplicate name-slugs
                seen.add(slug);
                urls.push(urlTag(`${SITE_URL}/author/${slug}`, '', 'monthly', '0.5'));
            }
            return urlset(urls);
        });
        sendXml(res, xml);
    } catch (err) {
        console.error('Sitemap authors error:', err.message);
        res.status(500).send('Error generating authors sitemap');
    }
};

// GET /sitemap-products.xml?page=1 — active books (/books/:bagcheeId/:slug)
export const getSitemapProducts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const xml = await cache.get(`sitemap-products-${page}`, SIX_HOURS, async () => {
            const products = await prisma.product.findMany({
                where: { isActive: true },
                select: { bagcheeId: true, id: true, title: true, updatedAt: true },
                skip: (page - 1) * PAGE_SIZE,
                take: PAGE_SIZE,
                orderBy: { id: 'asc' },
            });
            return urlset(products.map(p => {
                const idPart = p.bagcheeId || p.id;
                if (!idPart) return '';
                const slug = toSlug(p.title) || 'book';
                return urlTag(`${SITE_URL}/books/${idPart}/${slug}`, iso(p.updatedAt), 'monthly', '0.6');
            }));
        });
        sendXml(res, xml);
    } catch (err) {
        console.error('Sitemap products error:', err.message);
        res.status(500).send('Error generating products sitemap');
    }
};
