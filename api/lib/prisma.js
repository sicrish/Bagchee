import { PrismaClient } from '@prisma/client';

const CDN = 'https://www.bagchee.com/assets/images';

const isHttp = (v) => typeof v === 'string' && /^https?:\/\//.test(v);

const yyyymm = (d) => {
    if (!d) return null;
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return null;
    return `${dt.getUTCFullYear()}/${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
};

const prefixCdn = (folder, file) => {
    if (!file || typeof file !== 'string') return file;
    if (isHttp(file) || file.startsWith('/')) return file;
    return `${CDN}/${folder}/${file}`;
};

// Product images live under /assets/images/books/YYYY/MM/PID/<file>
const toBookUrl = (file, ym, pid) => {
    if (!file || typeof file !== 'string' || isHttp(file)) return file;
    if (!ym || !pid) return file;
    return `${CDN}/books/${ym}/${pid}/${file}`;
};

// Verified CDN paths (scraped from live bagchee.com):
//   /assets/images/sliders/        — HomeSlider.desktopImage, mobileImage
//   /assets/images/home/           — MainCategory.image (home_categories table)
//   /assets/images/categories/     — Category.image
//   /assets/images/authors/        — Author.picture
//   /assets/images/books/YYYY/MM/  — Product.defaultImage + ProductImage.file
// Best-guess (same CodeIgniter layout convention):
//   /assets/images/actors/, /artists/, /publishers/, /banners/, /socials/
//   /assets/images/sideBanners/ for SideBannerOne/Two

// Detect the model by distinctive field shapes on the result object.
// Returns the CDN folder name, or null if not matched.
const detectShape = (node) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return null;
    // HomeSlider
    if ('desktopImage' in node && 'mobileImage' in node) return { folder: 'sliders', fields: ['desktopImage', 'mobileImage'] };
    // SideBannerOne / SideBannerTwo — image1/image2 with link1/link2
    if (('image1' in node || 'image2' in node) && ('link1' in node || 'link2' in node)) {
        return { folder: 'sideBanners', fields: ['image1', 'image2'] };
    }
    // Banner (home_banners) — bg_image_name, overlay_image_name
    if ('bgImageName' in node || 'overlayImageName' in node) {
        return { folder: 'banners', fields: ['bgImageName', 'overlayImageName'] };
    }
    // Author/Actor/Artist — picture + firstName/lastName + fullName
    if ('picture' in node && ('firstName' in node || 'fullName' in node || 'lastName' in node)) {
        // Can't fully distinguish author vs actor vs artist from result shape.
        // All three resolve to the same parent folder pattern, just different subfolder.
        // Default to 'authors' (most common). If you want separate folders per type,
        // the caller should pass model-specific hints.
        return { folder: 'authors', fields: ['picture'] };
    }
    // User (profile) — profileImage
    if ('profileImage' in node && 'email' in node) {
        return { folder: 'avatars', fields: ['profileImage'] };
    }
    // SubCategory icon
    if ('iconName' in node && ('categoryId' in node || 'name' in node)) {
        return { folder: 'subcategories', fields: ['iconName'] };
    }
    // MainCategory (home_categories) vs Category — both have `image` + `title` + `active`/`order`.
    // MainCategory has `link` field; Category has `parentId` / `slug` / `lft` / `rght`.
    if ('image' in node && typeof node.image === 'string') {
        if ('parentId' in node || 'lft' in node || 'rght' in node || 'slug' in node) {
            return { folder: 'categories', fields: ['image'] };
        }
        if ('link' in node || 'order' in node) {
            return { folder: 'home', fields: ['image'] };
        }
        // Publisher has `publisher_title` → mapped to `title` in schema but also has `shipInDays`
        if ('shipInDays' in node) {
            return { folder: 'publishers', fields: ['image'] };
        }
        // Social
        if ('url' in node || 'platform' in node) {
            return { folder: 'socials', fields: ['image'] };
        }
        return null;
    }
    return null;
};

const rewriteByShape = (node, shape) => {
    for (const f of shape.fields) {
        if (f in node && typeof node[f] === 'string') {
            node[f] = prefixCdn(shape.folder, node[f]);
        }
    }
};

const isProductShape = (node) =>
    node &&
    typeof node === 'object' &&
    !Array.isArray(node) &&
    'id' in node &&
    'createdAt' in node &&
    ('defaultImage' in node || 'images' in node || 'tocImage' in node);

const rewriteProduct = (p) => {
    const ym = yyyymm(p.createdAt);
    const pid = p.id;
    if (!ym || !pid) return;
    if (p.defaultImage) p.defaultImage = toBookUrl(p.defaultImage, ym, pid);
    if (p.tocImage) p.tocImage = toBookUrl(p.tocImage, ym, pid);
    if (p.defaultTocImage) p.defaultTocImage = toBookUrl(p.defaultTocImage, ym, pid);
    for (const rel of ['images', 'tocs', 'sampleImages']) {
        if (Array.isArray(p[rel])) {
            for (const r of p[rel]) {
                if (r && r.file) r.file = toBookUrl(r.file, ym, pid);
            }
        }
    }
};

// Recursive walker — detects product or upload shapes anywhere in the result tree.
const walk = (node) => {
    if (!node || typeof node !== 'object') return node;
    if (Array.isArray(node)) {
        for (const item of node) walk(item);
        return node;
    }
    if (isProductShape(node)) {
        rewriteProduct(node);
    } else {
        const shape = detectShape(node);
        if (shape) rewriteByShape(node, shape);
    }
    for (const k of Object.keys(node)) {
        const v = node[k];
        if (v && typeof v === 'object') walk(v);
    }
    return node;
};

// Auto-inject id+createdAt into product selects that request image fields.
const IMAGE_SELECT_KEYS = new Set([
    'defaultImage',
    'defaultTocImage',
    'tocImage',
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
