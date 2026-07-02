// ---------------------------------------------------------------------------
// Server-side meta injection for book pages (SEO / View-Source).
//
// The storefront is a client-rendered React app, so "View Source" (and Bing /
// social scrapers that don't run JS) only ever see the static index.html — never
// the per-book meta that react-helmet-async sets after JS runs. Apache proxies the
// 2-segment book URL (/books/:bagcheeId/:slug) to this route, which returns that
// same index.html with the book's admin meta (title / description / keywords + OG)
// injected into <head>. After JS boots, react-helmet-async takes over with the
// SAME values (BookDetail.jsx reads the same admin fields), so the two agree.
//
// Safety: ANY failure (book not found, DB error, bad HTML) falls back to the plain
// index.html, so a book page can never break because of this route.
// ---------------------------------------------------------------------------
import fs from 'fs';
import prisma from '../lib/prisma.js';

// Path to the deployed CRA build's index.html (overridable for other environments).
const INDEX_HTML_PATH = process.env.SSR_INDEX_HTML || '/var/www/html/bagchee-react/index.html';

// Cache index.html in memory; re-read only when the file changes (i.e. a UI redeploy).
let _indexCache = { mtimeMs: -1, html: '' };
function getIndexHtml() {
    const { mtimeMs } = fs.statSync(INDEX_HTML_PATH);
    if (mtimeMs !== _indexCache.mtimeMs) {
        _indexCache = { mtimeMs, html: fs.readFileSync(INDEX_HTML_PATH, 'utf8') };
    }
    return _indexCache.html;
}

const escAttr = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const stripTags = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const SITE = 'https://www.bagchee.com';

// Slug — MUST match api/scripts/generateSitemaps.js toSlug so a book's canonical URL is
// identical to its sitemap URL (a canonical that disagrees with the sitemap confuses Google).
const toSlug = (s = '') =>
    String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Build schema.org Product JSON-LD for a book so Google can show price / availability /
// rating rich results. Mirrors the storefront's selling-price rule (realPrice when it
// undercuts the MRP). Returns null when there's nothing useful to emit.
function buildProductJsonLd(p, url) {
    if (!p || !p.title) return null;
    const mrp  = Number(p.price) || 0;
    const real = Number(p.realPrice) || 0;
    const sell = (real > 0 && real < mrp) ? real : mrp;

    const desc = (p.metaDescription && p.metaDescription.trim())
        ? p.metaDescription.trim()
        : stripTags(p.synopsis).slice(0, 300);

    const ld = { '@context': 'https://schema.org/', '@type': 'Product', name: p.title };
    if (p.defaultImage) ld.image = p.defaultImage;
    if (desc)           ld.description = desc;
    if (p.bagcheeId)    ld.sku = p.bagcheeId;

    const isbn = String(p.isbn13 || '').replace(/[^0-9]/g, '');
    if (/^\d{13}$/.test(isbn)) ld.gtin13 = isbn;

    const publisher = p.publisher?.title || '';
    if (publisher) ld.brand = { '@type': 'Brand', name: publisher };

    if (sell > 0) {
        ld.offers = {
            '@type': 'Offer',
            url,
            priceCurrency: 'USD',
            price: sell.toFixed(2),
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition',
        };
    }

    const rating = Number(p.rating) || 0;
    const count  = Number(p.ratedTimes) || 0;
    if (rating > 0 && count > 0) {
        ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: rating.toFixed(1), reviewCount: count };
    }
    return ld;
}

// Pure, testable: take the index.html string + a product (or null) and return the
// HTML with meta injected. `data-rh="true"` lets react-helmet-async adopt/reconcile
// these tags on hydration instead of appending duplicates.
export function injectBookMeta(html, p, slug = '') {
    // The static shell carries homepage-only SEO headings (#ssr-home-h); strip them so
    // a book page's View Source doesn't show the homepage H1.
    html = html.replace(/<div id="ssr-home-h">[\s\S]*?<\/div>/i, '');
    if (!p) return html;

    const author = p.authors?.[0]?.author?.fullName || '';
    const title = (p.metaTitle && p.metaTitle.trim())
        ? p.metaTitle.trim()
        : `${p.title || ''}${author ? ` by ${author}` : ''} | Bagchee`;
    const description = (p.metaDescription && p.metaDescription.trim())
        ? p.metaDescription.trim()
        : stripTags(p.synopsis).slice(0, 200);
    const keywords = (p.metaKeywords && p.metaKeywords.trim()) || '';
    const image = p.defaultImage || '';
    // Canonical URL = bagcheeId + title-slug, matching the sitemap exactly (NOT the requested
    // URL's slug, so /books/BB../anything all collapse to one canonical). Also used for og:url.
    const url = `${SITE}/books/${p.bagcheeId || ''}/${toSlug(p.title) || 'book'}`;

    const tags = [
        description && `<meta name="description" content="${escAttr(description)}" data-rh="true"/>`,
        keywords && `<meta name="keywords" content="${escAttr(keywords)}" data-rh="true"/>`,
        `<meta property="og:title" content="${escAttr(title)}" data-rh="true"/>`,
        description && `<meta property="og:description" content="${escAttr(description)}" data-rh="true"/>`,
        image && `<meta property="og:image" content="${escAttr(image)}" data-rh="true"/>`,
        `<meta property="og:type" content="book" data-rh="true"/>`,
        `<meta property="og:url" content="${escAttr(url)}" data-rh="true"/>`,
        p.isbn13 && `<meta property="books:isbn" content="${escAttr(p.isbn13)}" data-rh="true"/>`,
    ].filter(Boolean).join('');

    // Canonical + robots(index,follow). NON-data-rh on purpose: react-helmet-async doesn't
    // render <link rel=canonical> / <meta robots> client-side, so omitting data-rh means it
    // won't strip them on hydration — they persist in the DOM AND in View-Source for crawlers.
    // Canonical = the bagcheeId+slug URL (matches the sitemap), so every /books/:id/<anything>
    // variant collapses to one indexed URL.
    const seoTags =
        `<link rel="canonical" href="${escAttr(url)}"/>` +
        `<meta name="robots" content="index, follow"/>`;

    // schema.org Product JSON-LD (price / availability / rating rich results). `<` is
    // unicode-escaped so a stray "</script>" in any field can't break out of the tag.
    const ld = buildProductJsonLd(p, url);
    const ldScript = ld
        ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`
        : '';

    let out = html;
    if (/<title>[\s\S]*?<\/title>/i.test(out)) {
        out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title data-rh="true">${escAttr(title)}</title>`);
    } else {
        out = out.replace(/<head>/i, `<head><title data-rh="true">${escAttr(title)}</title>`);
    }
    // Inject the rest of the meta + canonical/robots + JSON-LD right before </head>.
    out = out.replace(/<\/head>/i, `${tags}${seoTags}${ldScript}</head>`);
    return out;
}

// Small in-memory cache of rendered HTML per bagcheeId to absorb crawler bursts.
const _renderCache = new Map();
const RENDER_TTL_MS = 60 * 1000;

export async function renderBookMeta(req, res) {
    let html;
    try {
        html = getIndexHtml();
    } catch {
        // index.html unreadable — nothing we can serve from here.
        return res.status(500).type('html').send('Service unavailable');
    }

    try {
        const bagcheeId = String(req.params.bagcheeId || '').trim();
        const key = bagcheeId.toLowerCase();

        const hit = _renderCache.get(key);
        if (hit && (Date.now() - hit.t) < RENDER_TTL_MS) {
            return res.type('html').send(hit.html);
        }

        const product = await prisma.product.findFirst({
            where: { bagcheeId: { equals: bagcheeId, mode: 'insensitive' } },
            select: {
                bagcheeId: true, title: true,
                metaTitle: true, metaDescription: true, metaKeywords: true,
                synopsis: true, defaultImage: true, isbn13: true,
                price: true, realPrice: true, rating: true, ratedTimes: true,
                publisher: { select: { title: true } },
                authors: { take: 1, select: { author: { select: { fullName: true } } } },
            },
        });

        const out = injectBookMeta(html, product, req.params.slug);
        if (product) _renderCache.set(key, { t: Date.now(), html: out });
        return res.type('html').send(out);
    } catch {
        // Any failure → serve the plain SPA shell so the page never breaks.
        return res.type('html').send(html);
    }
}

// ---------------------------------------------------------------------------
// Server-side meta injection for the HOME page + a curated allow-list of static
// pages (membership / sale / about-us / contact-us / gift-card-detail / …).
//
// Same Apache→Node rail as the book route, but driven by the admin `meta_tags`
// table (MetaTag model) keyed by the React path. Apache proxies each allow-listed
// route to /render/page?path=<react-path>, so View Source / Bing / social scrapers
// see the admin-managed title/description/keywords instead of the generic static
// index.html. Any failure → plain SPA shell (the page can never break from this).
//
// Field mapping mirrors WebsiteLayout.jsx so the SSR tags and the after-JS
// react-helmet-async tags agree (data-rh reconciliation → no duplicates / flash):
//   <title>           ← title (fallback metaTitle)
//   <meta name=title> ← metaTitle
//   description        ← metaDesc      keywords ← metaKeywords
//   og:title           ← metaTitle (fallback title)   og:description ← metaDesc
// ---------------------------------------------------------------------------
export function injectPageMeta(html, meta, path = '') {
    // Keep the homepage H1/H2 SEO block (#ssr-home-h) on the home page; strip elsewhere.
    if (path !== '/') {
        html = html.replace(/<div id="ssr-home-h">[\s\S]*?<\/div>/i, '');
    }

    // Canonical + robots(index,follow) are independent of the admin meta row — every
    // allow-listed page (incl. home, and pages with no meta_tags row) should still advertise
    // a self-canonical and index,follow. NON-data-rh so react-helmet-async leaves them in
    // place (it never renders canonical/robots client-side → nothing to reconcile/duplicate).
    const url = `${SITE}${path === '/' ? '/' : path}`;
    const seoTags =
        `<link rel="canonical" href="${escAttr(url)}"/>` +
        `<meta name="robots" content="index, follow"/>`;

    if (!meta) return html.replace(/<\/head>/i, `${seoTags}</head>`);

    const title = (meta.title && meta.title.trim()) || (meta.metaTitle && meta.metaTitle.trim()) || '';
    const ogTitle = (meta.metaTitle && meta.metaTitle.trim()) || title;
    const description = (meta.metaDesc && meta.metaDesc.trim()) || '';
    const keywords = (meta.metaKeywords && meta.metaKeywords.trim()) || '';

    const tags = [
        ogTitle && `<meta name="title" content="${escAttr(ogTitle)}" data-rh="true"/>`,
        description && `<meta name="description" content="${escAttr(description)}" data-rh="true"/>`,
        keywords && `<meta name="keywords" content="${escAttr(keywords)}" data-rh="true"/>`,
        ogTitle && `<meta property="og:title" content="${escAttr(ogTitle)}" data-rh="true"/>`,
        description && `<meta property="og:description" content="${escAttr(description)}" data-rh="true"/>`,
        `<meta property="og:type" content="website" data-rh="true"/>`,
        `<meta property="og:url" content="${escAttr(url)}" data-rh="true"/>`,
    ].filter(Boolean).join('');

    let out = html;
    if (title) {
        if (/<title>[\s\S]*?<\/title>/i.test(out)) {
            out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title data-rh="true">${escAttr(title)}</title>`);
        } else {
            out = out.replace(/<head>/i, `<head><title data-rh="true">${escAttr(title)}</title>`);
        }
    }
    out = out.replace(/<\/head>/i, `${tags}${seoTags}</head>`);
    return out;
}

const _pageCache = new Map();

export async function renderPageMeta(req, res) {
    let html;
    try {
        html = getIndexHtml();
    } catch {
        return res.status(500).type('html').send('Service unavailable');
    }
    try {
        let path = String(req.query.path || '/').trim();
        if (!path.startsWith('/')) path = `/${path}`;
        const key = path.toLowerCase();

        const hit = _pageCache.get(key);
        if (hit && (Date.now() - hit.t) < RENDER_TTL_MS) {
            return res.type('html').send(hit.html);
        }

        const meta = await prisma.metaTag.findFirst({
            where: { pageUrl: { equals: path, mode: 'insensitive' } },
        });

        const out = injectPageMeta(html, meta, path);
        _pageCache.set(key, { t: Date.now(), html: out });
        return res.type('html').send(out);
    } catch {
        return res.type('html').send(html);
    }
}

// ---------------------------------------------------------------------------
// Server-side meta injection for category listing pages (/books/:slug).
//
// Same Apache→Node rail as the book/page routes above, but the meta lives on the
// Category row itself (meta_title / meta_keywords / meta_description — edited at
// /admin/edit-category/:id), NOT in the meta_tags table. Apache proxies the
// 1-segment /books/:slug URL here; 2-segment book URLs keep hitting the book rail.
//
// Duplicate-slug landmine: the same title+slug exists as separate Category rows,
// one per product-type branch (e.g. "ayurveda" under Videos, CD Roms AND Books),
// and the row-level productType column is 0 on almost every row, so it cannot
// disambiguate. The only reliable rule is parentId ancestry: prefer the row whose
// branch root is Books (slug "books"). ProductListing.jsx applies the SAME rule
// for its after-JS Helmet meta, so SSR and client agree (data-rh reconciliation —
// no duplicate tags, no title flash).
//
// 🚫 NO canonical / robots here, ON PURPOSE. Listing URLs carry filter/sort/page
// params; a self-canonical on them is a duplicate-content risk. This is a
// deliberate SEO non-decision — inject ONLY title/description/keywords/OG.
// ---------------------------------------------------------------------------

// Generic-fallback tail — MUST match buildListingMeta() in ProductListing.jsx.
const LISTING_META_TAIL = 'Best prices and free worldwide delivery on Indian & international books at Bagchee.';

function isBooksBranch(cat, byId) {
    let cur = cat, guard = 0;
    while (cur && guard++ < 15) {
        if ((cur.slug || '').toLowerCase() === 'books'
            || (cur.title || '').trim().toLowerCase() === 'books') return true;
        cur = cur.parentId ? byId.get(cur.parentId) : null;
    }
    return false;
}

// Among duplicate same-slug rows, pick the one whose meta we show: Books-branch
// first, then rows that actually carry admin meta, then lowest id (deterministic).
// Keep in sync with pickCategoryMetaSource in ProductListing.jsx.
export function pickCategoryMetaSource(matches, byId) {
    if (!matches.length) return null;
    const hasMeta = (c) => Boolean(
        (c.metaTitle || '').trim() || (c.metaDesc || '').trim() || (c.metaKeywords || '').trim()
    );
    const score = (c) => (isBooksBranch(c, byId) ? 2 : 0) + (hasMeta(c) ? 1 : 0);
    return [...matches].sort((a, b) => (score(b) - score(a)) || (a.id - b.id))[0];
}

// Pure, testable: index.html string + a Category row (or null) + the requested
// public slug → HTML with the category's meta injected. Fallback strings MUST
// mirror buildListingMeta() in ProductListing.jsx so View-Source equals the
// after-JS tags.
export function injectCategoryMeta(html, cat, urlSlug = '') {
    // Not the homepage — strip the homepage-only SEO headings from the shell.
    html = html.replace(/<div id="ssr-home-h">[\s\S]*?<\/div>/i, '');
    if (!cat) return html;

    const catTitle = (cat.title || '').trim();
    const title = (cat.metaTitle && cat.metaTitle.trim())
        ? cat.metaTitle.trim()
        : `${catTitle} Books | Bagchee`;
    const description = (cat.metaDesc && cat.metaDesc.trim())
        ? cat.metaDesc.trim()
        : `Browse ${catTitle} books at Bagchee. ${LISTING_META_TAIL}`;
    const keywords = (cat.metaKeywords && cat.metaKeywords.trim()) || '';
    // og:url = the public URL as requested (DB slugs can be path-like, "a/b" —
    // the public route only ever carries the last segment).
    const url = `${SITE}/books/${urlSlug || (cat.slug || '').split('/').pop()}`;

    const tags = [
        description && `<meta name="description" content="${escAttr(description)}" data-rh="true"/>`,
        keywords && `<meta name="keywords" content="${escAttr(keywords)}" data-rh="true"/>`,
        `<meta property="og:title" content="${escAttr(title)}" data-rh="true"/>`,
        description && `<meta property="og:description" content="${escAttr(description)}" data-rh="true"/>`,
        `<meta property="og:type" content="website" data-rh="true"/>`,
        `<meta property="og:url" content="${escAttr(url)}" data-rh="true"/>`,
    ].filter(Boolean).join('');

    let out = html;
    if (/<title>[\s\S]*?<\/title>/i.test(out)) {
        out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title data-rh="true">${escAttr(title)}</title>`);
    } else {
        out = out.replace(/<head>/i, `<head><title data-rh="true">${escAttr(title)}</title>`);
    }
    return out.replace(/<\/head>/i, `${tags}</head>`);
}

const _categoryCache = new Map();

export async function renderCategoryMeta(req, res) {
    let html;
    try {
        html = getIndexHtml();
    } catch {
        return res.status(500).type('html').send('Service unavailable');
    }
    try {
        const rawSlug = String(req.params.slug || '').trim().toLowerCase();

        const hit = _categoryCache.get(rawSlug);
        if (hit && (Date.now() - hit.t) < RENDER_TTL_MS) {
            return res.type('html').send(hit.html);
        }

        // ~225 rows — fetch all active categories and match in JS, mirroring the
        // client's slug/title matching exactly (slug equal, path-like slug ending
        // in /<slug>, or &-normalized title).
        const cats = await prisma.category.findMany({
            where: { active: true },
            select: {
                id: true, title: true, slug: true, parentId: true,
                metaTitle: true, metaKeywords: true, metaDesc: true,
            },
        });
        const byId = new Map(cats.map(c => [c.id, c]));
        const cleanUrlSlug = rawSlug.replace(/[^a-z0-9]/g, '');
        const matches = cats.filter(c => {
            const s = (c.slug || '').toLowerCase();
            if (s && (s === rawSlug || s.endsWith(`/${rawSlug}`))) return true;
            const cleanTitle = (c.title || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
            return cleanTitle.length > 0 && cleanTitle === cleanUrlSlug;
        });

        const cat = pickCategoryMetaSource(matches, byId);
        const out = injectCategoryMeta(html, cat, req.params.slug);
        // Cache only on a match — the slug is caller-controlled, so caching misses
        // would let garbage /books/<junk> URLs grow the map without bound.
        if (cat) _categoryCache.set(rawSlug, { t: Date.now(), html: out });
        return res.type('html').send(out);
    } catch {
        return res.type('html').send(html);
    }
}
