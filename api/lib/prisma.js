import { PrismaClient } from '@prisma/client';

const IMG_BASE = 'https://www.bagchee.com/assets/images/books';

const yyyymm = (d) => {
    if (!d) return null;
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return null;
    return `${dt.getUTCFullYear()}/${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
};

const isHttp = (v) => typeof v === 'string' && /^https?:\/\//.test(v);

// Rewrite a single filename into a full CDN URL using the product's id + createdAt
const rewriteFile = (file, ym, pid) => {
    if (!file || typeof file !== 'string' || isHttp(file)) return file;
    if (!ym || !pid) return file;
    return `${IMG_BASE}/${ym}/${pid}/${file}`;
};

// Walk a product object and rewrite image fields in place
const rewriteProduct = (p) => {
    if (!p || typeof p !== 'object') return p;
    const ym = yyyymm(p.createdAt);
    const pid = p.id;
    if (ym && pid) {
        if (p.defaultImage) p.defaultImage = rewriteFile(p.defaultImage, ym, pid);
        if (p.defaultTocImage) p.defaultTocImage = rewriteFile(p.defaultTocImage, ym, pid);
        for (const rel of ['images', 'tocs', 'sampleImages']) {
            if (Array.isArray(p[rel])) {
                for (const r of p[rel]) {
                    if (r && r.file) r.file = rewriteFile(r.file, ym, pid);
                }
            }
        }
    }
    // Nested product references (e.g. orderItem.product, wishlist.product)
    return p;
};

// Recursively walk any result object looking for product-shaped objects.
// Rewrites defaultImage/defaultTocImage/images[]/tocs[]/sampleImages[] anywhere.
const walk = (node) => {
    if (!node || typeof node !== 'object') return node;
    if (Array.isArray(node)) {
        for (const item of node) walk(item);
        return node;
    }
    // If this node has id + createdAt + (defaultImage or images), treat as product
    if (
        Object.prototype.hasOwnProperty.call(node, 'id') &&
        Object.prototype.hasOwnProperty.call(node, 'createdAt') &&
        (Object.prototype.hasOwnProperty.call(node, 'defaultImage') ||
            Object.prototype.hasOwnProperty.call(node, 'images') ||
            Object.prototype.hasOwnProperty.call(node, 'defaultTocImage'))
    ) {
        rewriteProduct(node);
    }
    for (const k of Object.keys(node)) {
        const v = node[k];
        if (v && typeof v === 'object') walk(v);
    }
    return node;
};

// When a caller selects defaultImage/defaultTocImage/images/tocs/sampleImages
// without id+createdAt, the rewriter can't build a URL. Inject id+createdAt
// into those selects automatically so the transform always has what it needs.
const IMAGE_SELECT_KEYS = new Set([
    'defaultImage',
    'defaultTocImage',
    'images',
    'tocs',
    'sampleImages',
]);

const ensureProductFields = (sel) => {
    if (!sel || typeof sel !== 'object') return;
    const hasImageKey = Object.keys(sel).some((k) => IMAGE_SELECT_KEYS.has(k) && sel[k]);
    if (hasImageKey) {
        if (sel.id === undefined) sel.id = true;
        if (sel.createdAt === undefined) sel.createdAt = true;
    }
};

// Walk select/include tree and patch any product-shaped selects
const patchSelectTree = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.select) {
        ensureProductFields(node.select);
        for (const k of Object.keys(node.select)) {
            const v = node.select[k];
            if (v && typeof v === 'object') patchSelectTree(v);
        }
    }
    if (node.include) {
        for (const k of Object.keys(node.include)) {
            const v = node.include[k];
            if (v && typeof v === 'object') patchSelectTree(v);
        }
    }
};

const withImageUrls = (base) =>
    base.$extends({
        name: 'imageUrlRewriter',
        query: {
            $allModels: {
                async $allOperations({ args, query }) {
                    if (args && typeof args === 'object') patchSelectTree(args);
                    const result = await query(args);
                    return walk(result);
                },
            },
        },
    });

let prisma;

if (process.env.NODE_ENV === 'production') {
    prisma = withImageUrls(new PrismaClient());
} else {
    if (!global._prisma) {
        global._prisma = withImageUrls(new PrismaClient({ log: ['warn', 'error'] }));
    }
    prisma = global._prisma;
}

export default prisma;
