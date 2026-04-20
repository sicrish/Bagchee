import { PrismaClient } from '@prisma/client';

const CDN = 'https://www.bagchee.com';
const BOOK_BASE = `${CDN}/assets/images/books`;
const UPLOAD_BASE = `${CDN}/uploads`;

const isHttp = (v) => typeof v === 'string' && /^https?:\/\//.test(v);

const yyyymm = (d) => {
    if (!d) return null;
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return null;
    return `${dt.getUTCFullYear()}/${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
};

// Prefix a bare filename with the generic /uploads/ CDN path.
// Skips empty values, already-qualified URLs, and relative/absolute paths starting with '/'.
const toUploadUrl = (file) => {
    if (!file || typeof file !== 'string') return file;
    if (isHttp(file) || file.startsWith('/')) return file;
    return `${UPLOAD_BASE}/${file}`;
};

// Product images live under /assets/images/books/YYYY/MM/PID/<file>
const toBookUrl = (file, ym, pid) => {
    if (!file || typeof file !== 'string' || isHttp(file)) return file;
    if (!ym || !pid) return file;
    return `${BOOK_BASE}/${ym}/${pid}/${file}`;
};

// --- Model-specific image-field rewrites ------------------------------------
// Each entry: modelShape → { fields: [...plain image fields to prefix with /uploads/] }
// Detected heuristically on the result object's keys.

const simpleUploadFields = {
    // HomeSlider
    desktopImage: true,
    mobileImage: true,
    // Author / Actor / Artist / User
    picture: true,
    profileImage: true,
    // Banner (home_banners)
    bgImageName: true,
    overlayImageName: true,
    // SideBannerOne / SideBannerTwo
    image1: true,
    image2: true,
    // SubCategory icon
    iconName: true,
};

// Models where `image` means an admin-uploaded CDN file (not a product image).
// We inspect by the object's field shape to decide if `image` should be prefixed
// with /uploads/. Product-related structures use their own rewriter.
const isUploadShape = (node) => {
    if (!node || typeof node !== 'object') return false;
    // Product has defaultImage — never treat as upload shape
    if ('defaultImage' in node || 'defaultTocImage' in node) return false;
    // One of the explicit plain-upload fields present?
    for (const k of Object.keys(simpleUploadFields)) {
        if (k in node) return true;
    }
    // Plain `image` field alongside title/order/active/link suggests banner/category/etc.
    if ('image' in node && typeof node.image === 'string') {
        if ('title' in node || 'link' in node || 'order' in node || 'active' in node) {
            return true;
        }
    }
    return false;
};

const rewriteUploadShape = (node) => {
    for (const k of Object.keys(simpleUploadFields)) {
        if (k in node && typeof node[k] === 'string') {
            node[k] = toUploadUrl(node[k]);
        }
    }
    if ('image' in node && typeof node.image === 'string') {
        node.image = toUploadUrl(node.image);
    }
};

// --- Product rewriting (uses date-based path) -------------------------------
const rewriteProduct = (p) => {
    const ym = yyyymm(p.createdAt);
    const pid = p.id;
    if (!ym || !pid) return;
    if (p.defaultImage) p.defaultImage = toBookUrl(p.defaultImage, ym, pid);
    if (p.defaultTocImage) p.defaultTocImage = toBookUrl(p.defaultTocImage, ym, pid);
    for (const rel of ['images', 'tocs', 'sampleImages']) {
        if (Array.isArray(p[rel])) {
            for (const r of p[rel]) {
                if (r && r.file) r.file = toBookUrl(r.file, ym, pid);
            }
        }
    }
};

const isProductShape = (node) =>
    node &&
    typeof node === 'object' &&
    'id' in node &&
    'createdAt' in node &&
    ('defaultImage' in node || 'images' in node || 'defaultTocImage' in node);

// --- Recursive walker -------------------------------------------------------
const walk = (node) => {
    if (!node || typeof node !== 'object') return node;
    if (Array.isArray(node)) {
        for (const item of node) walk(item);
        return node;
    }
    if (isProductShape(node)) {
        rewriteProduct(node);
    } else if (isUploadShape(node)) {
        rewriteUploadShape(node);
    }
    for (const k of Object.keys(node)) {
        const v = node[k];
        if (v && typeof v === 'object') walk(v);
    }
    return node;
};

// --- Auto-inject id+createdAt when caller selects product image fields ------
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
