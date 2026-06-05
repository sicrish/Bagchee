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

// Pure, testable: take the index.html string + a product (or null) and return the
// HTML with meta injected. `data-rh="true"` lets react-helmet-async adopt/reconcile
// these tags on hydration instead of appending duplicates.
export function injectBookMeta(html, p, slug = '') {
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
    const url = `https://www.bagchee.com/books/${encodeURIComponent(p.bagcheeId || '')}/${encodeURIComponent(slug || '')}`;

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

    let out = html;
    if (/<title>[\s\S]*?<\/title>/i.test(out)) {
        out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title data-rh="true">${escAttr(title)}</title>`);
    } else {
        out = out.replace(/<head>/i, `<head><title data-rh="true">${escAttr(title)}</title>`);
    }
    // Inject the rest of the meta right before </head>.
    out = out.replace(/<\/head>/i, `${tags}</head>`);
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
