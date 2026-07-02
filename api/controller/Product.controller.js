import prisma from '../lib/prisma.js';
import { cache } from '../lib/cache.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

const THIRTY_MIN = 30 * 60 * 1000;
const getCachedSettings = () => cache.get('settings', THIRTY_MIN, () =>
    prisma.settings.findFirst({ orderBy: { id: 'desc' } })
);

const cleanArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) {
        if (data.length === 1 && typeof data[0] === 'string' && data[0].startsWith('[')) {
            try { return JSON.parse(data[0]); } catch (e) { return data; }
        }
        return data;
    }
    if (typeof data === 'string') {
        try { return JSON.parse(data); }
        catch (e) { return data.split(',').map(s => s.trim()).filter(Boolean); }
    }
    return [];
};

const parseBoolean = (value) => {
    const s = String(value).toLowerCase();
    return s === 'active' || s === 'true' || value === true;
};

// Parse a raw value (string | number | array) to a deduplicated array of valid Ints
const toIntArray = (raw) =>
    [...new Set(cleanArray(raw).map(v => parseInt(v)).filter(n => !isNaN(n)))];

// Resolve an array of IDs or title strings to integer IDs using the given Prisma model.
// Values that are valid integers are used directly; strings are batch-looked up by title.
const resolveToIds = async (model, raw) => {
    const values = cleanArray(raw);
    if (!values.length) return [];
    const intIds = [];
    const titleStrings = [];
    for (const v of values) {
        const asInt = parseInt(v);
        if (!isNaN(asInt)) intIds.push(asInt);
        else titleStrings.push(String(v));
    }
    if (titleStrings.length) {
        const found = await model.findMany({
            where: { title: { in: titleStrings, mode: 'insensitive' } },
            select: { id: true },
        });
        intIds.push(...found.map(r => r.id));
    }
    return [...new Set(intIds)];
};

// Save multiple uploaded files, return [{image, order}]
const processDynamicImages = async (files, orders, folderName) => {
    const fileArr  = Array.isArray(files)  ? files  : (files  ? [files]  : []);
    const orderArr = Array.isArray(orders) ? orders : (orders ? [orders] : []);
    const result = [];
    for (let i = 0; i < fileArr.length; i++) {
        try {
            const path = await saveFileLocal(fileArr[i], folderName);
            result.push({ image: path, order: Number(orderArr[i]) || 0 });
        } catch (err) {
            console.error('Image upload error:', err.message);
        }
    }
    return result;
};

// Build a Prisma WHERE clause from query-string filters.
// Returns { AND: [...conditions] } so callers can push extra conditions.
const buildWhereClause = (query, { includeInactive = false } = {}) => {
    const conditions = [];
    if (!includeInactive) conditions.push({ isActive: true });

    const {
        keyword, minPrice, maxPrice, categoryId, categories, categoriesMatchAll,
        formats, languages, authors, publishers, series, tag, tags,
        title, bagchee_id, isbn10, isbn13, product_type,
        isFeatured, isNewRelease, isRecommended, isExclusive,
        rating, daysOld, inrOnly
    } = query;

    if (keyword) {
        const kwParts = keyword.trim().split(/\s+/);
        const authorConditions = [
            { fullName:  { contains: keyword, mode: 'insensitive' } },
            { firstName: { contains: keyword, mode: 'insensitive' } },
            { lastName:  { contains: keyword, mode: 'insensitive' } },
        ];
        // "Lokesh Chandra" → also try first word vs rest match
        if (kwParts.length >= 2) {
            authorConditions.push({
                AND: [
                    { firstName: { contains: kwParts[0],                    mode: 'insensitive' } },
                    { lastName:  { contains: kwParts.slice(1).join(' '),     mode: 'insensitive' } },
                ]
            });
        }
        conditions.push({ OR: [
            { title:     { contains: keyword, mode: 'insensitive' } },
            { isbn13:    { contains: keyword, mode: 'insensitive' } },
            { isbn10:    { contains: keyword, mode: 'insensitive' } },
            { bagcheeId: { contains: keyword, mode: 'insensitive' } },
            { publisher: { title: { contains: keyword, mode: 'insensitive' } } },
            { series:    { title: { contains: keyword, mode: 'insensitive' } } },
            { authors:   { some: { author: { OR: authorConditions } } } },
        ]});
    }

    if (title)     conditions.push({ title:     { contains: title,     mode: 'insensitive' } });
    if (isbn10)    conditions.push({ isbn10:    { contains: isbn10,    mode: 'insensitive' } });
    if (isbn13)    conditions.push({ isbn13:    { contains: isbn13,    mode: 'insensitive' } });
    if (bagchee_id) conditions.push({ bagcheeId: { equals: bagchee_id, mode: 'insensitive' } });
    if (product_type) conditions.push({ productType: product_type });

    if (categories) {
        const ids = categories.split(',').map(c => parseInt(c.trim())).filter(n => !isNaN(n));
        if (ids.length) {
            // "book belongs to category X" — matches its leading category OR a tagged category
            const inCategory = (id) => ({ OR: [
                { leadingCategoryId: id },
                { categories: { some: { categoryId: id } } }
            ]});
            if (categoriesMatchAll === 'true' && ids.length > 1) {
                // Intersection (AND): book must belong to EVERY selected category. Used when a
                // customer ticks multiple sub-category checkboxes and wants only the books filed
                // under all of them. Opt-in via ?categoriesMatchAll=true — the DEFAULT below stays
                // OR/union because the category-page parent-slug fallback unions duplicate
                // same-slug category rows, and Sale/related/etc. expect union too.
                ids.forEach(id => conditions.push(inCategory(id)));
            } else {
                // Union (default): book in ANY of the selected categories.
                conditions.push({ OR: [
                    { leadingCategoryId: { in: ids } },
                    { categories: { some: { categoryId: { in: ids } } } }
                ]});
            }
        }
    } else if (categoryId) {
        const cId = parseInt(categoryId);
        if (!isNaN(cId)) conditions.push({ OR: [
            { leadingCategoryId: cId },
            { categories: { some: { categoryId: cId } } }
        ]});
    }

    if (minPrice || maxPrice) {
        const p = {};
        if (minPrice) p.gte = Number(minPrice);
        if (maxPrice) p.lte = Number(maxPrice);
        conditions.push({ price: p });
    }

    if (formats) {
        const ids = formats.split(',').map(f => parseInt(f.trim())).filter(n => !isNaN(n));
        if (ids.length) conditions.push({ formats: { some: { formatId: { in: ids } } } });
    }
    if (languages) {
        const ids = languages.split(',').map(l => parseInt(l.trim())).filter(n => !isNaN(n));
        if (ids.length) conditions.push({ OR: [
            { languages: { some: { languageId: { in: ids } } } }
        ]});
    }
    if (authors) {
        const ids = authors.split(',').map(a => parseInt(a.trim())).filter(n => !isNaN(n));
        if (ids.length) conditions.push({ authors: { some: { authorId: { in: ids } } } });
    }
    if (publishers) {
        const ids = publishers.split(',').map(p => parseInt(p.trim())).filter(n => !isNaN(n));
        if (ids.length) conditions.push({ publisherId: { in: ids } });
    }
    if (series) {
        const ids = series.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (ids.length) conditions.push({ seriesId: { in: ids } });
    }

    const tagFilter = tag || tags;
    if (tagFilter) {
        const tagIds = tagFilter.split(',').map(t => parseInt(t.trim())).filter(n => !isNaN(n));
        if (tagIds.length) {
            conditions.push({ tags: { some: { tagId: { in: tagIds } } } });
        } else {
            // Treat as tag title slug
            conditions.push({ tags: { some: { tag: { title: { contains: tagFilter, mode: 'insensitive' } } } } });
        }
    }

    if (isFeatured   === 'true') conditions.push({ isFeatured:   true });
    if (isNewRelease === 'true') conditions.push({ isNewRelease: true });
    if (isRecommended=== 'true') conditions.push({ isRecommended: true });
    if (isExclusive  === 'true') conditions.push({ isExclusive:  true });

    if (rating) conditions.push({ rating: { gte: Number(rating) } });
    if (daysOld) {
        const from = new Date();
        from.setDate(from.getDate() - Number(daysOld));
        conditions.push({ createdAt: { gte: from } });
    }

    if (inrOnly === 'true') conditions.push({ inrPrice: { gt: 0 } });

    return { AND: conditions };
};

// What to include when returning product data (full — for detail/admin views)
const PRODUCT_INCLUDE = {
    publisher:    { select: { id: true, title: true, slug: true } },
    series:       { select: { id: true, title: true } },
    authors:      { select: { id: true, authorId: true, roleId: true, author: { select: { id: true, firstName: true, lastName: true, fullName: true } } } },
    categories:   { include: { category: { select: { id: true, title: true, slug: true } } } },
    tags:         { include: { tag: { select: { id: true, title: true } } } },
    formats:      { include: { format: { select: { id: true, title: true } } } },
    languages:    { include: { language: { select: { id: true, title: true } } } },
    images:       { orderBy: { ord: 'asc' }, take: 20 },
    tocImages:    { orderBy: { ord: 'asc' }, take: 20 },
    sampleImages: { orderBy: { ord: 'asc' }, take: 20 },
};

// Lightweight include for list/grid views (smaller response, faster queries)
const PRODUCT_LIST_INCLUDE = {
    authors:    { include: { author: { select: { id: true, fullName: true } } }, take: 2 },
    categories: { include: { category: { select: { id: true, title: true } } }, take: 1 },
    formats:    { include: { format: { select: { id: true, title: true } } } },
    images:     { orderBy: { ord: 'asc' }, take: 1 },
};

// Sort option map
const SORT_MAP = {
    newest:           { createdAt: 'desc' },
    bestseller:       { soldCount:  'desc' },
    publication_date: { pubDate:    'desc' },
    price_low:        { price:      'asc'  },
    price_high:       { price:      'desc' },
    title_asc:        { title:      'asc'  },
    title_desc:       { title:      'desc' },
    rating:           { rating:     'desc' },
};

// ── Controllers ───────────────────────────────────────────────────────────────

// POST /products
export const save = async (req, res) => {
    try {
        const catId    = parseInt(req.body.categoryId || req.body.leading_category);
        const authorId = parseInt(req.body.author     || req.body.author_id);

        if (!catId || isNaN(catId))    return res.status(400).json({ msg: 'Category is required' });

        const coverFile = req.files?.producticon || req.files?.default_image;
        const coverPath = coverFile ? await saveFileLocal(coverFile, 'products') : null;
        const tocFile   = req.files?.tocImage || req.files?.toc_image;
        const tocPath   = tocFile ? await saveFileLocal(tocFile, 'products') : null;

        const [tocImages, relatedImages, sampleImages] = await Promise.all([
            processDynamicImages(req.files?.toc_images,     req.body.toc_images_order,     'products'),
            processDynamicImages(req.files?.related_images, req.body.related_images_order, 'products'),
            processDynamicImages(req.files?.sample_images,  req.body.sample_images_order,  'products'),
        ]);

        // Deduplicated ID arrays for junction tables
        const authorRolesMap = (() => { try { return JSON.parse(req.body.author_roles || '{}'); } catch { return {}; } })();
        const authorIds   = [...new Set([...(!isNaN(authorId) ? [authorId] : []), ...toIntArray(req.body.authors)])];
        const categoryIds = [...new Set([catId,    ...toIntArray(req.body.product_categories)])];
        const tagIds      = await resolveToIds(prisma.tag, req.body.product_tags);
        const formatIds   = await resolveToIds(prisma.format, req.body.product_formats);
        const languageIds = await resolveToIds(prisma.language, req.body.product_languages);
        const actorIds    = toIntArray(req.body.actors);
        const artistIds   = toIntArray(req.body.artists);

        const publisherId = parseInt(req.body.publisher) || null;
        const seriesId    = parseInt(req.body.series)    || null;

        const product = await prisma.product.create({
            data: {
                title:          req.body.title,
                productType:    req.body.product_type    || 'book',
                isbn10:         req.body.isbn10          || '',
                isbn13:         req.body.isbn13 || req.body.isbn || '',
                language:       req.body.language        || 'English',
                price:          Number(req.body.price)   || 0,
                inrPrice:       Number(req.body.inr_price)  || 0,
                realPrice:      Number(req.body.real_price) || 0,
                discount:       Number(req.body.discount)   || 0,
                publisherId:    isNaN(publisherId) ? null : publisherId,
                seriesId:       isNaN(seriesId)    ? null : seriesId,
                seriesNumber:   req.body.series_number || null,
                leadingCategoryId: catId,
                pages:          (req.body.pages || req.body.total_pages) ? (parseInt(req.body.pages || req.body.total_pages) || null) : null,
                weight:         req.body.weight   || null,
                edition:        req.body.edition  || null,
                volume:         req.body.volume   || null,
                pubDate:        req.body.pub_date || null,
                synopsis:       req.body.synopsis      || '',
                criticsNote:    req.body.critics_note  || req.body.criticsNote  || '',
                searchText:     req.body.search_text   || req.body.searchText   || '',
                notes:            req.body.notes             || null,
                source:           req.body.source            || null,
                relatedProducts:  req.body.related_products  || null,
                defaultImage:   coverPath,
                tocImage:       tocPath,
                stock:          req.body.stock === 'inactive' ? 'inactive' : 'active',
                availability:   Number(req.body.availability) || 0,
                isActive:       parseBoolean(req.body.active),
                isFeatured:     parseBoolean(req.body.isFeatured),
                isNewRelease:   parseBoolean(req.body.new_release),
                newReleaseUntil: req.body.new_release_until ? new Date(req.body.new_release_until) : null,
                isRecommended:  parseBoolean(req.body.recommended),
                upcoming:       parseBoolean(req.body.upcoming),
                upcomingDate:   req.body.upcoming === 'active' && req.body.upcoming_date
                                    ? new Date(req.body.upcoming_date) : null,
                isExclusive:    parseBoolean(req.body.exclusive),
                exclusiveFor:   req.body.exclusive_for || null,
                rating:         Number(req.body.rating)      || 0,
                ratedTimes:     Number(req.body.rated_times) || 0,
                shipDays:       req.body.ship_days    ? String(req.body.ship_days).trim()    || null : null,
                deliverDays:    req.body.deliver_days ? String(req.body.deliver_days).trim() || null : null,
                pagesDesc:      req.body.pages_desc || req.body.pages || null,
                metaTitle:      req.body.meta_title       || null,
                metaKeywords:   req.body.meta_keywords    || null,
                metaDescription:req.body.meta_description || null,

                // Junction tables
                ...(authorIds.length && { authors: { create: authorIds.map(id => ({ authorId: id, roleId: parseInt(authorRolesMap[String(id)]) || 1 })) } }),
                categories: { create: categoryIds.map(id => ({ categoryId: id })) },
                ...(tagIds.length    && { tags:      { create: tagIds.map(id    => ({ tagId:      id })) } }),
                ...(formatIds.length && { formats:   { create: formatIds.map(id => ({ formatId:   id })) } }),
                ...(languageIds.length && { languages: { create: languageIds.map(id => ({ languageId: id })) } }),
                ...(actorIds.length  && { actors:    { create: actorIds.map(id  => ({ actorId:   id })) } }),
                ...(artistIds.length && { artists:   { create: artistIds.map(id => ({ artistId:  id })) } }),

                // Image tables
                ...(relatedImages.length && { images:       { create: relatedImages.map(i => ({ file: i.image, ord: i.order })) } }),
                ...(tocImages.length     && { tocImages:    { create: tocImages.map(i     => ({ file: i.image, ord: i.order })) } }),
                ...(sampleImages.length  && { sampleImages: { create: sampleImages.map(i  => ({ file: i.image, ord: i.order })) } }),
            }
        });

        // Set bagcheeId after creation (needs the auto-incremented id)
        const updated = await prisma.product.update({
            where: { id: product.id },
            data:  { bagcheeId: `BB${product.id}` },
            include: PRODUCT_INCLUDE
        });

        cache.invalidate('filter-options');
        res.status(201).json({ status: true, msg: 'Product saved successfully', data: updated });
    } catch (error) {
        console.error('Save Error:', error);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// PUT /products/:id
export const update = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!id || isNaN(id)) return res.status(400).json({ status: false, msg: 'Product ID is required' });

        const existing = await prisma.product.findUnique({ where: { id }, include: { images: true, tocImages: true, sampleImages: true } });
        if (!existing) return res.status(404).json({ status: false, msg: 'Product not found' });

        const updateData = {};

        // ── Scalars ──────────────────────────────────────────────────────────
        if (req.body.title        !== undefined) updateData.title       = req.body.title;
        if (req.body.product_type !== undefined) updateData.productType = req.body.product_type;
        if (req.body.isbn10       !== undefined) updateData.isbn10      = req.body.isbn10;
        if (req.body.isbn13       !== undefined) updateData.isbn13      = req.body.isbn13;
        if (req.body.language     !== undefined) updateData.language    = req.body.language;
        if (req.body.synopsis     !== undefined) updateData.synopsis    = req.body.synopsis;
        if (req.body.critics_note !== undefined) updateData.criticsNote = req.body.critics_note;
        if (req.body.search_text  !== undefined) updateData.searchText  = req.body.search_text;
        if (req.body.notes              !== undefined) updateData.notes            = req.body.notes;
        if (req.body.source             !== undefined) updateData.source           = req.body.source;
        if (req.body.related_products   !== undefined) updateData.relatedProducts  = req.body.related_products || null;
        if (req.body.meta_title       !== undefined) updateData.metaTitle       = req.body.meta_title;
        if (req.body.meta_keywords    !== undefined) updateData.metaKeywords    = req.body.meta_keywords;
        if (req.body.meta_description !== undefined) updateData.metaDescription = req.body.meta_description;
        if (req.body.weight       !== undefined) updateData.weight      = req.body.weight;
        if (req.body.edition      !== undefined) updateData.edition     = req.body.edition;
        if (req.body.volume       !== undefined) updateData.volume      = req.body.volume;
        if (req.body.pub_date     !== undefined) updateData.pubDate     = req.body.pub_date;
        if (req.body.series_number!== undefined) updateData.seriesNumber= req.body.series_number;
        if (req.body.binding      !== undefined) updateData.binding     = req.body.binding;
        if (req.body.new_release_until !== undefined)
            updateData.newReleaseUntil = req.body.new_release_until ? new Date(req.body.new_release_until) : null;

        // ── Numbers ───────────────────────────────────────────────────────────
        if (req.body.price        !== undefined) updateData.price       = Number(req.body.price)       || 0;
        if (req.body.inr_price    !== undefined) updateData.inrPrice    = Number(req.body.inr_price)   || 0;
        if (req.body.real_price   !== undefined) updateData.realPrice   = Number(req.body.real_price)  || 0;
        if (req.body.discount     !== undefined) updateData.discount    = Number(req.body.discount)    || 0;
        if (req.body.pages        !== undefined) updateData.pages       = req.body.pages       ? (parseInt(req.body.pages)        || null) : null;
        if (req.body.total_pages  !== undefined) updateData.pages       = req.body.total_pages ? (parseInt(req.body.total_pages)  || null) : null;
        if (req.body.rating       !== undefined) updateData.rating      = Number(req.body.rating)      || 0;
        if (req.body.rated_times  !== undefined) updateData.ratedTimes  = parseInt(req.body.rated_times) || 0;
        if (req.body.ship_days    !== undefined) updateData.shipDays    = req.body.ship_days    ? String(req.body.ship_days).trim()    || null : null;
        if (req.body.deliver_days !== undefined) updateData.deliverDays = req.body.deliver_days ? String(req.body.deliver_days).trim() || null : null;
        if (req.body.pages_desc   !== undefined) updateData.pagesDesc   = req.body.pages_desc   || null;
        if (req.body.availability !== undefined) updateData.availability= parseInt(req.body.availability) || 0;

        // ── FK IDs ────────────────────────────────────────────────────────────
        if (req.body.publisher !== undefined) {
            const pId = parseInt(req.body.publisher);
            updateData.publisherId = isNaN(pId) || pId === 0 ? null : pId;
        }
        if (req.body.series !== undefined) {
            const sId = parseInt(req.body.series);
            updateData.seriesId = isNaN(sId) || sId === 0 ? null : sId;
        }
        if (req.body.categoryId || req.body.leading_category) {
            updateData.leadingCategoryId = parseInt(req.body.categoryId || req.body.leading_category) || null;
        }

        // ── Stock & Booleans ──────────────────────────────────────────────────
        if (req.body.stock !== undefined)
            updateData.stock = String(req.body.stock).toLowerCase() === 'inactive' ? 'inactive' : 'active';
        if (req.body.active      !== undefined) updateData.isActive     = parseBoolean(req.body.active);
        if (req.body.recommended !== undefined) updateData.isRecommended= parseBoolean(req.body.recommended);
        if (req.body.new_release !== undefined) updateData.isNewRelease = parseBoolean(req.body.new_release);
        if (req.body.exclusive      !== undefined) updateData.isExclusive  = parseBoolean(req.body.exclusive);
        if (req.body.exclusive_for  !== undefined) updateData.exclusiveFor = req.body.exclusive_for || null;
        if (req.body.isFeatured  !== undefined) updateData.isFeatured   = parseBoolean(req.body.isFeatured);
        if (req.body.upcoming    !== undefined) {
            updateData.upcoming     = parseBoolean(req.body.upcoming);
            updateData.upcomingDate = req.body.upcoming === 'active' && req.body.upcoming_date
                                        ? new Date(req.body.upcoming_date) : null;
        }

        // ── Main images ───────────────────────────────────────────────────────
        if (req.files?.default_image) {
            const path = await saveFileLocal(req.files.default_image, 'products');
            if (existing.defaultImage) await deleteFileLocal(existing.defaultImage);
            updateData.defaultImage = path;
        } else if (req.body.remove_default_image === 'true') {
            if (existing.defaultImage) await deleteFileLocal(existing.defaultImage);
            updateData.defaultImage = null;
        }
        if (req.files?.toc_image || req.files?.tocImage) {
            const file = req.files.toc_image || req.files.tocImage;
            const path = await saveFileLocal(file, 'products');
            if (existing.tocImage) await deleteFileLocal(existing.tocImage);
            updateData.tocImage = path;
        }

        // ── Update scalar fields ──────────────────────────────────────────────
        await prisma.product.update({ where: { id }, data: updateData });

        // ── Resolve name→ID lookups BEFORE the transaction (avoid tx timeout) ──
        const [resolvedTagIds, resolvedFormatIds, resolvedLanguageIds, newRelated, newToc, newSample] = await Promise.all([
            req.body.product_tags      !== undefined ? resolveToIds(prisma.tag,      req.body.product_tags)      : Promise.resolve(null),
            req.body.product_formats   !== undefined ? resolveToIds(prisma.format,   req.body.product_formats)   : Promise.resolve(null),
            req.body.product_languages !== undefined ? resolveToIds(prisma.language, req.body.product_languages) : Promise.resolve(null),
            processDynamicImages(req.files?.related_images, req.body.related_images_order, 'products'),
            processDynamicImages(req.files?.toc_images,     req.body.toc_images_order,     'products'),
            processDynamicImages(req.files?.sample_images,  req.body.sample_images_order,  'products'),
        ]);

        // ── Junction table replacements (sequential, no transaction to avoid timeout) ──
        // Authors
        if (req.body.authors !== undefined || req.body.author !== undefined) {
            const authorId = parseInt(req.body.author || req.body.author_id);
            const ids = [...new Set([
                ...(!isNaN(authorId) ? [authorId] : []),
                ...toIntArray(req.body.authors)
            ])];
            const rolesMap = (() => { try { return JSON.parse(req.body.author_roles || '{}'); } catch { return {}; } })();
            if (ids.length) {
                await prisma.productAuthor.deleteMany({ where: { productId: id } });
                await prisma.productAuthor.createMany({ data: ids.map(aId => ({ productId: id, authorId: aId, roleId: parseInt(rolesMap[String(aId)]) || 1 })) });
            }
        }

        // Categories
        if (req.body.product_categories !== undefined || req.body.categoryId !== undefined) {
            const catId = parseInt(req.body.categoryId || req.body.leading_category);
            const ids = [...new Set([
                ...(!isNaN(catId) ? [catId] : []),
                ...toIntArray(req.body.product_categories)
            ])];
            if (ids.length) {
                await prisma.productCategory.deleteMany({ where: { productId: id } });
                await prisma.productCategory.createMany({ data: ids.map(cId => ({ productId: id, categoryId: cId })) });
            }
        }

        // Tags
        if (resolvedTagIds !== null) {
            await prisma.productTag.deleteMany({ where: { productId: id } });
            if (resolvedTagIds.length) await prisma.productTag.createMany({ data: resolvedTagIds.map(tId => ({ productId: id, tagId: tId })) });
        }

        // Formats
        if (resolvedFormatIds !== null) {
            await prisma.productFormat.deleteMany({ where: { productId: id } });
            if (resolvedFormatIds.length) await prisma.productFormat.createMany({ data: resolvedFormatIds.map(fId => ({ productId: id, formatId: fId })) });
        }

        // Languages
        if (resolvedLanguageIds !== null) {
            await prisma.productLanguage.deleteMany({ where: { productId: id } });
            if (resolvedLanguageIds.length) await prisma.productLanguage.createMany({ data: resolvedLanguageIds.map(lId => ({ productId: id, languageId: lId })) });
        }

        // Append new images
        if (newRelated.length) await prisma.productImage.createMany({ data: newRelated.map(i => ({ productId: id, file: i.image, ord: i.order })) });
        if (newToc.length)     await prisma.productToc.createMany({ data: newToc.map(i => ({ productId: id, file: i.image, ord: i.order })) });
        if (newSample.length)  await prisma.productSampleImage.createMany({ data: newSample.map(i => ({ productId: id, file: i.image, ord: i.order })) });

        const result = await prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
        cache.invalidate('filter-options');
        cache.invalidate(`product:id:${id}`);
        if (result?.bagcheeId) cache.invalidate(`product:bid:${result.bagcheeId.toLowerCase()}`);
        cache.invalidatePrefix(`related:`);

        // Fire back-in-stock notifications if stock just changed to active
        if (updateData.stock === 'active' && existing.stock === 'inactive') {
            import('./backInStock.controller.js').then(({ notifySubscribers }) => {
                notifySubscribers(id, result.title, result.bagcheeId).catch(() => {});
            }).catch(() => {});
        }

        res.status(200).json({ status: true, msg: 'Product updated successfully', data: result });
    } catch (error) {
        console.error('Update Error [code=%s]:', error?.code || error?.name, error?.message || error);
        res.status(500).json({
            status: false,
            msg: 'Internal Server Error',
            ...(process.env.NODE_ENV !== 'production' && { detail: error?.message, code: error?.code }),
        });
    }
};

// GET /product/related/:bagcheeId — returns related, seriesBooks, alsoBought in one shot
export const getRelatedProducts = async (req, res) => {
    try {
        const { bagcheeId } = req.params;
        const FIVE_MIN = 5 * 60 * 1000;

        const result = await cache.get(`related:${bagcheeId}`, FIVE_MIN, async () => {
            const product = await prisma.product.findFirst({
                where: { bagcheeId: { equals: bagcheeId, mode: 'insensitive' } },
                select: { id: true, leadingCategoryId: true, seriesId: true, publisherId: true, relatedProducts: true }
            });
            if (!product) return null;

            const { id, leadingCategoryId, seriesId, publisherId, relatedProducts } = product;

            // Fetch admin-selected related products first (if any)
            let adminRelated = [];
            if (relatedProducts) {
                const relIds = relatedProducts.split(',').map(s => s.trim()).filter(Boolean);
                if (relIds.length > 0) {
                    adminRelated = await prisma.product.findMany({
                        where: { bagcheeId: { in: relIds }, isActive: true },
                        include: PRODUCT_LIST_INCLUDE,
                    });
                    // Preserve admin order
                    const order = Object.fromEntries(relIds.map((rid, i) => [rid.toLowerCase(), i]));
                    adminRelated.sort((a, b) => (order[a.bagcheeId?.toLowerCase()] ?? 99) - (order[b.bagcheeId?.toLowerCase()] ?? 99));
                }
            }

            // Walk up category tree to find root category for broader related books
            let rootCategoryId = leadingCategoryId;
            if (leadingCategoryId) {
                let current = await prisma.category.findUnique({
                    where: { id: leadingCategoryId },
                    select: { id: true, parentId: true }
                });
                while (current?.parentId && current.parentId > 2) {
                    current = await prisma.category.findUnique({
                        where: { id: current.parentId },
                        select: { id: true, parentId: true }
                    });
                }
                if (current) rootCategoryId = current.id;
            }

            const [relatedRaw, seriesRaw, alsoBoughtRaw] = await Promise.all([
                rootCategoryId ? prisma.product.findMany({
                    where: { AND: [{ isActive: true }, { OR: [{ leadingCategoryId: rootCategoryId }, { categories: { some: { categoryId: rootCategoryId } } }] }, { NOT: { id } }] },
                    include: PRODUCT_LIST_INCLUDE,
                    orderBy: { soldCount: 'desc' },
                    take: 20
                }) : Promise.resolve([]),
                seriesId ? prisma.product.findMany({
                    where: { seriesId, isActive: true, NOT: { id } },
                    include: PRODUCT_LIST_INCLUDE,
                    orderBy: { id: 'asc' },
                    take: 20
                }) : Promise.resolve([]),
                publisherId ? prisma.product.findMany({
                    where: { publisherId, isActive: true, NOT: { id } },
                    include: PRODUCT_LIST_INCLUDE,
                    orderBy: { soldCount: 'desc' },
                    take: 20
                }) : Promise.resolve([]),
            ]);

            const adminRelatedIds = new Set(adminRelated.map(b => b.id));
            const filteredRelated = relatedRaw.filter(b => !adminRelatedIds.has(b.id) && b.id !== id);
            return { related: [...adminRelated, ...filteredRelated], seriesBooks: seriesRaw, alsoBought: alsoBoughtRaw };
        });

        if (!result) return res.status(404).json({ status: false, msg: 'Product not found' });
        res.status(200).json({ status: true, data: result });
    } catch (error) {
        console.error('Related products error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// GET /products  OR  GET /products/:id
export const fetch = async (req, res) => {
    try {
        // ── Single product fetch ──────────────────────────────────────────────
        if (req.params.id) {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).json({ status: false, msg: 'Invalid ID' });
            const FIVE_MIN = 5 * 60 * 1000;
            const product = await cache.get(`product:id:${id}`, FIVE_MIN, () =>
                prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE })
            );
            if (!product) return res.status(404).json({ status: false, msg: 'Product not found' });
            return res.status(200).json({ status: true, data: product });
        }

        // ── List fetch ────────────────────────────────────────────────────────
        const { page, limit, sort, showAll, id } = req.query;

        const pageNum  = Math.max(1, Number(page)  || 1);
        const pageSize = Math.min(100, Math.max(1, Number(limit) || 36));
        const skip     = (pageNum - 1) * pageSize;

        // showAll is restricted to admin — public users always see active products only
        const isAdmin = req.user?.role === 'admin';
        const where = buildWhereClause(req.query, { includeInactive: isAdmin && showAll === 'true' });

        // Direct ID lookup override
        if (id) {
            const numId = parseInt(id);
            if (!isNaN(numId)) where.AND.push({ id: numId });
        }

        const orderBy = SORT_MAP[sort] || { createdAt: 'desc' };

        // Use lightweight include for public list views, full include for admin
        const includeSet = isAdmin ? PRODUCT_INCLUDE : PRODUCT_LIST_INCLUDE;

        // Cache single-product detail fetches by bagchee_id (common from BookDetail page)
        const bagcheeIdParam = req.query.bagchee_id;
        if (bagcheeIdParam && !isAdmin) {
            const FIVE_MIN = 5 * 60 * 1000;
            const cached = await cache.get(`product:bid:${bagcheeIdParam.toLowerCase()}`, FIVE_MIN, async () =>
                prisma.product.findMany({ where, include: PRODUCT_INCLUDE, take: 1 })
            );
            return res.status(200).json({ status: true, data: cached, total: cached.length, page: 1, limit: 1, totalPages: cached.length ? 1 : 0 });
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({ where, include: includeSet, orderBy, skip, take: pageSize }),
            prisma.product.count({ where })
        ]);

        res.status(200).json({
            status: true, data: products, total,
            page: pageNum, limit: pageSize,
            totalPages: Math.ceil(total / pageSize)
        });
    } catch (error) {
        console.error('Fetch Error:', error);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// GET /product/search-suggestions?keyword=...&limit=8
// Lightweight endpoint for search autocomplete — searches books, authors, categories, series, publishers
export const searchSuggestions = async (req, res) => {
    try {
        const { keyword, limit } = req.query;
        const pageSize = Math.min(20, Math.max(1, Number(limit) || 8));

        if (!keyword || keyword.trim().length < 2) {
            return res.json({ status: true, data: [] });
        }

        const kw = keyword.trim();

        const [products, authors, categories, series, publishers, tags] = await Promise.all([
            prisma.product.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { title:     { contains: kw, mode: 'insensitive' } },
                        { isbn13:    { contains: kw, mode: 'insensitive' } },
                        { isbn10:    { contains: kw, mode: 'insensitive' } },
                        { bagcheeId: { contains: kw, mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    bagcheeId: true,
                    title: true,
                    isbn13: true,
                    defaultImage: true,
                    price: true,
                    realPrice: true,
                    authors: {
                        take: 1,
                        select: { author: { select: { firstName: true, lastName: true } } },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: pageSize,
            }),
            prisma.author.findMany({
                where: { OR: [
                    { fullName:  { contains: kw, mode: 'insensitive' } },
                    { firstName: { contains: kw, mode: 'insensitive' } },
                    { lastName:  { contains: kw, mode: 'insensitive' } },
                ]},
                select: { id: true, firstName: true, lastName: true, fullName: true },
                take: 5,
            }),
            prisma.category.findMany({
                where: { active: true, title: { contains: kw, mode: 'insensitive' } },
                select: { id: true, title: true, slug: true },
                // Over-fetch as a dedup pool: the same category exists as duplicate
                // same-slug rows, one per product-type branch (e.g. "Ayurveda" ×3).
                // Deduped by slug below, then capped back to 5.
                orderBy: { id: 'asc' },
                take: 15,
            }),
            prisma.series.findMany({
                where: { title: { contains: kw, mode: 'insensitive' } },
                select: { id: true, title: true },
                take: 5,
            }),
            prisma.publisher.findMany({
                where: { title: { contains: kw, mode: 'insensitive' } },
                select: { id: true, title: true, slug: true },
                take: 5,
            }),
            prisma.tag.findMany({
                where: { title: { contains: kw, mode: 'insensitive' } },
                select: { id: true, title: true },
                take: 5,
            }),
        ]);

        const data = [];

        authors.forEach(a => data.push({
            id: a.id,
            title: a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim(),
            type: 'author',
        }));

        products.forEach(p => {
            const firstAuthor = p.authors?.[0]?.author;
            data.push({
                id: p.id,
                bagcheeId: p.bagcheeId,
                title: p.title,
                isbn13: p.isbn13,
                defaultImage: p.defaultImage,
                price: Number(p.price),
                realPrice: Number(p.realPrice),
                author: firstAuthor ? { firstName: firstAuthor.firstName, lastName: firstAuthor.lastName || '' } : null,
                type: 'book',
            });
        });

        // Collapse duplicate same-slug category rows (one per product-type branch) —
        // the dropdown links every category to /books/<slug>, so the dupes all led to
        // the same page anyway. Distinct slugs (e.g. Music / Music CD / World Music)
        // stay separate suggestions.
        const seenCatKeys = new Set();
        let catCount = 0;
        categories.forEach(c => {
            const key = (c.slug || '').trim().toLowerCase()
                || (c.title || '').trim().toLowerCase().replace(/\s+/g, ' ');
            if (catCount >= 5 || seenCatKeys.has(key)) return;
            seenCatKeys.add(key);
            catCount += 1;
            data.push({ id: c.id, title: c.title, slug: c.slug, type: 'category' });
        });
        series.forEach(s => {
            const seriesSlug = s.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            data.push({ id: s.id, title: s.title, slug: seriesSlug, type: 'series' });
        });
        publishers.forEach(p => data.push({ id: p.id, title: p.title, slug: p.slug, type: 'publisher' }));
        tags.forEach(t => data.push({ id: t.id, title: t.title, type: 'tag' }));

        res.json({ status: true, data });
    } catch (error) {
        console.error('Search Suggestions Error:', error);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// DELETE /products/:id
export const deleteProduct = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ status: false, msg: 'Invalid ID' });

        const product = await prisma.product.findUnique({
            where: { id },
            include: { images: true, tocImages: true, sampleImages: true }
        });
        if (!product) return res.status(404).json({ status: false, msg: 'Product not found' });

        // Block deletion if the product has order history — deactivate instead
        const orderCount = await prisma.orderItem.count({ where: { productId: id } });
        if (orderCount > 0) {
            return res.status(409).json({
                status: false,
                msg: `Cannot delete a product with ${orderCount} associated order(s). Set it to inactive instead.`
            });
        }

        // Delete image files
        const filesToDelete = [
            product.defaultImage,
            product.tocImage,
            ...product.images.map(i => i.file),
            ...product.tocImages.map(i => i.file),
            ...product.sampleImages.map(i => i.file),
        ].filter(Boolean);

        await Promise.allSettled(filesToDelete.map(f => deleteFileLocal(f)));

        // Cascade in schema handles junction tables
        const bagcheeId = product.bagcheeId;
        await prisma.product.delete({ where: { id } });
        cache.invalidate('filter-options');
        cache.invalidate(`product:id:${id}`);
        if (bagcheeId) cache.invalidate(`product:bid:${bagcheeId.toLowerCase()}`);
        cache.invalidatePrefix(`related:`);
        res.status(200).json({ status: true, msg: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Error deleting' });
    }
};

// Map a raw format title to its customer-facing book label, or null for non-book
// formats. Books are only ever Hardcover or Paperback (admin stores "Softcover");
// everything else (Music CD, MP3, Handicraft, …) is dropped from the sidebar filter.
// Keep in sync with `canonicalFormatLabel` in ui/src/utils/normalizeProduct.js.
const canonicalBookFormat = (raw) => {
    const s = (raw || '').toString().trim().toLowerCase();
    if (!s) return null;
    if (s.includes('hard')) return 'Hardcover';
    if (s.includes('soft') || s.includes('paper')) return 'Paperback';
    return null;
};

// GET /products/filter-options  — sidebar filter data (cached 1 hour)
export const getFilterOptions = async (req, res) => {
    try {
        const ONE_HOUR = 60 * 60 * 1000;
        const data = await cache.get('filter-options', ONE_HOUR, async () => {
            const [rawFormats, languages, priceStats, authors, publishers, series] = await Promise.all([
                prisma.format.findMany({
                    where:   { products: { some: {} } },
                    select:  { id: true, title: true },
                    orderBy: { title: 'asc' }
                }),
                prisma.language.findMany({
                    where:   { products: { some: {} } },
                    select:  { id: true, title: true },
                    orderBy: { title: 'asc' }
                }),
                prisma.product.findFirst({
                    where:   { isActive: true },
                    select:  { price: true },
                    orderBy: { price: 'desc' }
                }),
                prisma.author.findMany({
                    where:   { products: { some: {} } },
                    select:  { id: true, firstName: true, lastName: true, fullName: true },
                    orderBy: { firstName: 'asc' },
                    take:    500
                }),
                prisma.publisher.findMany({
                    where:   { products: { some: {} } },
                    select:  { id: true, title: true },
                    orderBy: { title: 'asc' },
                    take:    500
                }),
                prisma.series.findMany({
                    where:   { products: { some: {} } },
                    select:  { id: true, title: true },
                    orderBy: { title: 'asc' },
                    take:    500
                }),
            ]);

            // Consolidate the raw format rows into the only two book formats the storefront
            // exposes — Hardcover and Paperback. Each bucket carries a comma-joined list of
            // its underlying format ids (e.g. "2") so the existing `formats=<ids>` filter
            // (formatId IN [...]) still matches every book tagged with any member format.
            const formatBuckets = {}; // canonical label -> [ids]
            for (const f of rawFormats) {
                const label = canonicalBookFormat(f.title);
                if (!label) continue;
                (formatBuckets[label] = formatBuckets[label] || []).push(f.id);
            }
            const formats = ['Hardcover', 'Paperback']
                .filter(label => formatBuckets[label])
                .map(label => ({ id: formatBuckets[label].join(','), title: label }));

            return { formats, languages, maxPrice: priceStats?.price ?? 10000, authors, publishers, series };
        });

        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// GET /products/filter-facets — sidebar facets (authors / publishers / series) SCOPED to the
// current listing context, so e.g. the Art & Architecture page shows the top-selling authors
// OF Art & Architecture books rather than the whole catalogue's authors.
//
// Mirrors the listing exactly: it reuses buildWhereClause (categories / publisher / series /
// keyword — the same params the listing fetch sends) plus the listing-type condition (?scope=
// new-arrivals|bestsellers|recommended|sale). Ranked by units sold (soldCount), top 15.
// The frontend sends only the STRUCTURAL scope params (not the user's transient author/format/
// price ticks), so the facet lists stay stable while filtering. Cached 15 min per context.
const FACET_LIMIT = 15;
const AUTHOR_ROW_CAP = 30000; // safety cap for the in-memory author roll-up on huge scopes

export const getFilterFacets = async (req, res) => {
    try {
        const scope = String(req.query.scope || '').toLowerCase();
        const where = buildWhereClause(req.query);

        // Add the listing-type condition, matching getRecommended/getBestSellers/etc.
        if (scope === 'recommended') {
            where.AND.push({ isRecommended: true });
        } else if (scope === 'bestsellers') {
            const settings = await getCachedSettings();
            where.AND.push({ soldCount: { gte: settings?.bestSellerThreshold ?? 1 } });
        } else if (scope === 'sale') {
            const settings = await getCachedSettings();
            where.AND.push({ discount: { gt: 0 } });
            where.AND.push({ discount: { gte: settings?.saleThreshold ?? 0 } });
        } else if (scope === 'new-arrivals') {
            const settings = await getCachedSettings();
            const days = Math.max(1, Number(settings?.newArrivalTime || 30));
            const today = new Date();
            const dateFrom = new Date(today);
            dateFrom.setDate(dateFrom.getDate() - days);
            where.AND.push({ OR: [
                { isNewRelease: true, newReleaseUntil: { gte: today } },
                { createdAt: { gte: dateFrom } },
            ] });
        }

        const FIFTEEN_MIN = 15 * 60 * 1000;
        const cacheKey = `facets:${scope}:${req.query.categories || ''}:${req.query.publishers || ''}:${req.query.series || ''}:${req.query.keyword || ''}`;

        const data = await cache.get(cacheKey, FIFTEEN_MIN, async () => {
            // Publishers & series: top by summed sales (direct groupBy with _sum).
            const [pubGroups, serGroups, authorRows] = await Promise.all([
                prisma.product.groupBy({
                    by: ['publisherId'],
                    where: { ...where, publisherId: { not: null } },
                    _sum: { soldCount: true },
                    orderBy: { _sum: { soldCount: 'desc' } },
                    take: FACET_LIMIT,
                }),
                prisma.product.groupBy({
                    by: ['seriesId'],
                    where: { ...where, seriesId: { not: null } },
                    _sum: { soldCount: true },
                    orderBy: { _sum: { soldCount: 'desc' } },
                    take: FACET_LIMIT,
                }),
                // Authors are M:N — roll up summed sales per author in memory over the scoped
                // product↔author rows (capped), then take the top by sales.
                prisma.productAuthor.findMany({
                    where: { product: where },
                    select: { authorId: true, product: { select: { soldCount: true } } },
                    take: AUTHOR_ROW_CAP,
                }),
            ]);

            const authSales = new Map();
            for (const r of authorRows) {
                authSales.set(r.authorId, (authSales.get(r.authorId) || 0) + (r.product?.soldCount || 0));
            }
            const topAuthorIds = [...authSales.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, FACET_LIMIT)
                .map(([id]) => id);

            const pubIds = pubGroups.map(g => g.publisherId).filter(Boolean);
            const serIds = serGroups.map(g => g.seriesId).filter(Boolean);

            const [pubRows, serRows, authNameRows] = await Promise.all([
                pubIds.length ? prisma.publisher.findMany({ where: { id: { in: pubIds } }, select: { id: true, title: true } }) : [],
                serIds.length ? prisma.series.findMany({ where: { id: { in: serIds } }, select: { id: true, title: true } }) : [],
                topAuthorIds.length ? prisma.author.findMany({ where: { id: { in: topAuthorIds } }, select: { id: true, firstName: true, lastName: true, fullName: true } }) : [],
            ]);

            const pubById = new Map(pubRows.map(p => [p.id, p]));
            const serById = new Map(serRows.map(s => [s.id, s]));
            const authById = new Map(authNameRows.map(a => [a.id, a]));

            return {
                authors:    topAuthorIds.map(id => authById.get(id)).filter(Boolean),
                publishers: pubIds.map(id => pubById.get(id)).filter(Boolean),
                series:     serIds.map(id => serById.get(id)).filter(Boolean),
            };
        });

        res.status(200).json({ status: true, data });
    } catch (error) {
        console.error('getFilterFacets error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// GET /products/recommended
export const getRecommended = async (req, res) => {
    try {
        const page  = Math.max(1, Number(req.query.page)  || 1);
        const limit = Math.max(1, Number(req.query.limit) || 6);
        const skip  = (page - 1) * limit;
        const random = req.query.random === 'true';

        const where = buildWhereClause(req.query);
        where.AND.push({ isRecommended: true });

        if (random) {
            const pool = await prisma.product.findMany({
                where,
                include: PRODUCT_LIST_INCLUDE,
                orderBy: { createdAt: 'desc' },
                take: 100,
            });
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            const total = pool.length;
            const products = pool.slice(skip, skip + limit);
            return res.status(200).json({ status: true, data: products, total, page, limit });
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: PRODUCT_LIST_INCLUDE,
                orderBy: { createdAt: 'desc' },
                skip, take: limit
            }),
            prisma.product.count({ where })
        ]);

        res.status(200).json({ status: true, data: products, total, page, limit });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// GET /products/bestsellers
export const getBestSellers = async (req, res) => {
    try {
        const page  = Math.max(1, Number(req.query.page)  || 1);
        const limit = Math.max(1, Number(req.query.limit) || 6);
        const skip  = (page - 1) * limit;

        const settings  = await getCachedSettings();
        const threshold = settings?.bestSellerThreshold ?? 1;

        const where = buildWhereClause(req.query);
        where.AND.push({ soldCount: { gte: threshold } });

        const [products, total] = await Promise.all([
            prisma.product.findMany({ where, include: PRODUCT_LIST_INCLUDE, orderBy: [{ soldCount: 'desc' }, { createdAt: 'desc' }], skip, take: limit }),
            prisma.product.count({ where })
        ]);

        res.status(200).json({ status: true, data: products, total, page, limit });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// GET /products/new-arrivals
export const getNewArrivals = async (req, res) => {
    try {
        const page  = Math.max(1, Number(req.query.page)  || 1);
        const limit = Math.max(1, Number(req.query.limit) || 12);
        const skip  = (page - 1) * limit;

        const today    = new Date();
        const settings = await getCachedSettings();
        const days     = Math.max(1, Number(settings?.newArrivalTime || 30));
        const dateFrom = new Date(today);
        dateFrom.setDate(dateFrom.getDate() - days);

        // Auto-expire new releases whose explicit date has passed (non-blocking)
        prisma.product.updateMany({
            where: { isNewRelease: true, newReleaseUntil: { lt: today, not: null } },
            data:  { isNewRelease: false, newReleaseUntil: null }
        }).catch(() => {});

        const where = buildWhereClause(req.query);
        where.AND.push({
            OR: [
                // admin-promoted: explicit expiry date not yet passed
                { isNewRelease: true, newReleaseUntil: { gte: today } },
                // all books created within the date window (matches old site behaviour)
                { createdAt: { gte: dateFrom } },
            ],
        });

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: PRODUCT_LIST_INCLUDE,
                orderBy: { createdAt: 'desc' },
                skip, take: limit
            }),
            prisma.product.count({ where })
        ]);

        res.status(200).json({ status: true, data: products, total, page, limit });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// GET /products/sale
export const getSaleProducts = async (req, res) => {
    try {
        const page  = Math.max(1, Number(req.query.page)  || 1);
        const limit = Math.max(1, Number(req.query.limit) || 12);
        const skip  = (page - 1) * limit;

        const settings  = await getCachedSettings();
        const threshold = settings?.saleThreshold ?? 0;

        const conditions = [
            { isActive: true },
            { discount: { gt: 0 } },
            { discount: { gte: threshold } },
        ];

        const { categoryId, categories, sort, inrOnly } = req.query;

        if (categories) {
            const ids = categories.split(',').map(c => parseInt(c.trim())).filter(n => !isNaN(n));
            if (ids.length) conditions.push({ OR: [
                { leadingCategoryId: { in: ids } },
                { categories: { some: { categoryId: { in: ids } } } }
            ]});
        } else if (categoryId) {
            const cId = parseInt(categoryId);
            if (!isNaN(cId)) conditions.push({ OR: [
                { leadingCategoryId: cId },
                { categories: { some: { categoryId: cId } } }
            ]});
        }

        if (inrOnly === 'true') conditions.push({ inrPrice: { gt: 0 } });

        const orderBy = sort === 'discount_high'
            ? { discount: 'desc' }
            : (SORT_MAP[sort] || { createdAt: 'desc' });

        const where = { AND: conditions };
        const [products, total] = await Promise.all([
            prisma.product.findMany({ where, include: PRODUCT_LIST_INCLUDE, orderBy, skip, take: limit }),
            prisma.product.count({ where })
        ]);

        res.status(200).json({
            status: true,
            msg: `Showing products with discount >= ${threshold}%`,
            data: products, total, page, limit
        });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getSaleCategories = async (req, res) => {
    try {
        const settings  = await getCachedSettings();
        const threshold = settings?.saleThreshold ?? 0;

        const saleProducts = await prisma.product.findMany({
            where: { AND: [{ isActive: true }, { discount: { gt: 0 } }, { discount: { gte: threshold } }] },
            select: { leadingCategoryId: true, categories: { select: { categoryId: true } } }
        });

        const ids = new Set();
        for (const p of saleProducts) {
            if (p.leadingCategoryId) ids.add(p.leadingCategoryId);
            for (const c of p.categories) ids.add(c.categoryId);
        }

        res.status(200).json({ status: true, data: Array.from(ids) });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getNewArrivalCategories = async (req, res) => {
    try {
        const settings = await getCachedSettings();
        const days     = Math.max(1, Number(settings?.newArrivalTime || 30));
        const today    = new Date();
        const dateFrom = new Date(today);
        dateFrom.setDate(dateFrom.getDate() - days);

        const products = await prisma.product.findMany({
            where: {
                AND: [
                    { isActive: true },
                    { OR: [
                        { isNewRelease: true, newReleaseUntil: { gte: today } },
                        { createdAt: { gte: dateFrom } },
                    ]},
                ]
            },
            select: { leadingCategoryId: true, categories: { select: { categoryId: true } } }
        });

        const ids = new Set();
        for (const p of products) {
            if (p.leadingCategoryId) ids.add(p.leadingCategoryId);
            for (const c of p.categories) ids.add(c.categoryId);
        }

        res.status(200).json({ status: true, data: Array.from(ids) });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
