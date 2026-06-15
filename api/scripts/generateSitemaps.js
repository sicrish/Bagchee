/**
 * generateSitemaps.js — pre-build ALL sitemap XML files as static files.
 *
 * WHY: the live dynamic sitemap (sitemap.controller.js) generates each file from the
 * DB on every crawl. At 138k+ products that's fine when the in-memory cache is warm
 * (<35ms) but the cache is wiped on every pm2 restart (deploy), so a crawl that lands
 * cold makes single-threaded Node run the query + serialise + gzip ~11 multi-MB XML
 * strings at once → Apache 504s on the biggest files (confirmed in the access log:
 * Googlebot got 504/500 on sitemap-products/authors pages). Static files served by
 * Apache have none of that: no DB, no Node, no rate limiter, instant, burst-proof.
 *
 * This script writes the SAME URLs the dynamic controller emits, but:
 *   - cursor pagination (id > lastId) instead of OFFSET — no deep-offset scan, scales
 *   - PATH-based child filenames (sitemap-products-1.xml) — static files can't carry ?page=
 *   - a REAL per-file <lastmod> in the index (products/categories = max row date) so the
 *     files don't all share one date
 *   - ATOMIC writes (tmp + rename) and the index is written LAST, so Apache never serves
 *     a half-written file or an index pointing at a child that isn't on disk yet.
 *
 * Run on VPS (cron):  cd /opt/bagchee/api && node scripts/generateSitemaps.js
 * Output dir override: SITEMAP_OUTPUT_DIR=/tmp/x node scripts/generateSitemaps.js
 *
 * The Node routes in sitemap.controller.js stay in place as a fallback (Apache serves
 * the static file if it exists, else proxies to Node). Keep the helpers below in sync
 * with that controller if the URL shape / slug rule ever changes.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SITE_URL = (process.env.FRONTEND_URL || 'https://www.bagchee.com').split(',')[0].trim();
const PAGE_SIZE = 25000;                 // URLs per sub-sitemap (well under the 50k protocol limit)
const OUTPUT_DIR = process.env.SITEMAP_OUTPUT_DIR || '/var/www/html/bagchee-react';

const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
const today = new Date().toISOString().split('T')[0];

const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

// Slug — MUST match the frontend's canonical slug + the controller's toSlug.
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

// Atomic write: a half-written file is never visible at its final name.
const writeAtomic = (name, content) => {
    const dest = path.join(OUTPUT_DIR, name);
    const tmp = path.join(OUTPUT_DIR, `.tmp-${name}.${process.pid}`);
    fs.writeFileSync(tmp, content, 'utf8');
    fs.chmodSync(tmp, 0o644);            // world-readable so Apache (www-data) can serve it
    fs.renameSync(tmp, dest);
    return Buffer.byteLength(content);
};

// ── static pages (keep in sync with sitemap.controller.js getSitemapStatic) ──
const buildStatic = () => {
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
    const bytes = writeAtomic('sitemap-static.xml',
        urlset(staticPages.map(p => urlTag(`${SITE_URL}${p.path}`, today, p.changefreq, p.priority))));
    log(`sitemap-static.xml — ${staticPages.length} urls (${bytes} bytes)`);
    return { loc: 'sitemap-static.xml', lastmod: today };
};

const buildCategories = async () => {
    const categories = await prisma.category.findMany({
        where: { active: true, slug: { not: 'root-category' } },
        select: { slug: true, createdAt: true },
    });
    let maxDate = null;
    const urls = categories.map(c => {
        if (!c.slug) return '';
        if (c.createdAt && (!maxDate || c.createdAt > maxDate)) maxDate = c.createdAt;
        return urlTag(`${SITE_URL}/books/${c.slug}`, iso(c.createdAt), 'weekly', '0.8');
    });
    const bytes = writeAtomic('sitemap-categories.xml', urlset(urls));
    log(`sitemap-categories.xml — ${urls.filter(Boolean).length} urls (${bytes} bytes)`);
    return { loc: 'sitemap-categories.xml', lastmod: iso(maxDate) || today };
};

const buildPublishers = async () => {
    const publishers = await prisma.publisher.findMany({
        where: { slug: { not: '' }, products: { some: {} } },
        select: { slug: true },
    });
    const urls = publishers.map(p => p.slug ? urlTag(`${SITE_URL}/publisher/${p.slug}`, '', 'monthly', '0.6') : '');
    const bytes = writeAtomic('sitemap-publishers.xml', urlset(urls));
    log(`sitemap-publishers.xml — ${urls.filter(Boolean).length} urls (${bytes} bytes)`);
    return { loc: 'sitemap-publishers.xml', lastmod: today };  // no per-row date column
};

// Cursor-paginated authors. Dedupe slugs GLOBALLY (across pages) — better than the
// controller's per-page dedupe, which can repeat a name-slug on two different pages.
const buildAuthors = async () => {
    const children = [];
    const seen = new Set();
    let cursor = 0, page = 0;
    for (;;) {
        const rows = await prisma.author.findMany({
            where: { products: { some: {} }, id: { gt: cursor } },
            select: { id: true, firstName: true, lastName: true, fullName: true },
            orderBy: { id: 'asc' },
            take: PAGE_SIZE,
        });
        if (rows.length === 0) break;
        cursor = rows[rows.length - 1].id;
        page++;
        const urls = [];
        for (const a of rows) {
            const name = (a.fullName && a.fullName.trim()) || `${a.firstName || ''} ${a.lastName || ''}`.trim();
            const slug = toSlug(name);
            if (!slug || seen.has(slug)) continue;
            seen.add(slug);
            urls.push(urlTag(`${SITE_URL}/author/${slug}`, '', 'monthly', '0.5'));
        }
        const name = `sitemap-authors-${page}.xml`;
        const bytes = writeAtomic(name, urlset(urls));
        log(`${name} — ${urls.length} urls (${bytes} bytes)`);
        children.push({ loc: name, lastmod: today });
    }
    return children;
};

// Cursor-paginated products. Per-page <lastmod> = newest updatedAt in that page.
const buildProducts = async () => {
    const children = [];
    let cursor = 0, page = 0;
    for (;;) {
        const rows = await prisma.product.findMany({
            where: { isActive: true, id: { gt: cursor } },
            select: { bagcheeId: true, id: true, title: true, updatedAt: true },
            orderBy: { id: 'asc' },
            take: PAGE_SIZE,
        });
        if (rows.length === 0) break;
        cursor = rows[rows.length - 1].id;
        page++;
        let maxDate = null;
        const urls = rows.map(p => {
            const idPart = p.bagcheeId || p.id;
            if (!idPart) return '';
            if (p.updatedAt && (!maxDate || p.updatedAt > maxDate)) maxDate = p.updatedAt;
            const slug = toSlug(p.title) || 'book';
            return urlTag(`${SITE_URL}/books/${idPart}/${slug}`, iso(p.updatedAt), 'monthly', '0.6');
        });
        const name = `sitemap-products-${page}.xml`;
        const bytes = writeAtomic(name, urlset(urls));
        log(`${name} — ${urls.filter(Boolean).length} urls (${bytes} bytes)`);
        children.push({ loc: name, lastmod: iso(maxDate) || today });
    }
    return children;
};

// Remove stale paginated files from a previous run where the page count was higher
// (e.g. the catalog shrank). Never touch files we just wrote.
const cleanupStale = (prefix, keep) => {
    let removed = 0;
    for (const f of fs.readdirSync(OUTPUT_DIR)) {
        const m = f.match(new RegExp(`^${prefix}-(\\d+)\\.xml$`));
        if (m && parseInt(m[1], 10) > keep) {
            fs.unlinkSync(path.join(OUTPUT_DIR, f));
            removed++;
        }
    }
    if (removed) log(`removed ${removed} stale ${prefix}-*.xml`);
};

const main = async () => {
    const t0 = Date.now();
    if (!fs.existsSync(OUTPUT_DIR)) throw new Error(`OUTPUT_DIR does not exist: ${OUTPUT_DIR}`);
    log(`Generating sitemaps → ${OUTPUT_DIR}  (SITE_URL=${SITE_URL})`);

    // Children FIRST, index LAST — so the index never references a not-yet-written file.
    const staticChild = buildStatic();
    const catChild = await buildCategories();
    const pubChild = await buildPublishers();
    const authorChildren = await buildAuthors();
    const productChildren = await buildProducts();

    cleanupStale('sitemap-authors', authorChildren.length);
    cleanupStale('sitemap-products', productChildren.length);

    const children = [staticChild, catChild, pubChild, ...authorChildren, ...productChildren];
    const indexXml = `${xmlHeader}\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        children.map(c => `  <sitemap><loc>${xmlEscape(`${SITE_URL}/${c.loc}`)}</loc><lastmod>${c.lastmod}</lastmod></sitemap>`).join('\n') +
        '\n</sitemapindex>';
    const bytes = writeAtomic('sitemap.xml', indexXml);
    log(`sitemap.xml (index) — ${children.length} sub-sitemaps (${bytes} bytes)`);

    log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s — ${children.length} files written.`);
};

main()
    .catch((e) => { console.error('Sitemap generation FAILED:', e); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
