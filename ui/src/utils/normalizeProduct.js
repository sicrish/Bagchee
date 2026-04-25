/**
 * Normalizes a product object from the Prisma/Neon backend (camelCase)
 * to also expose snake_case aliases, so legacy UI code works without changes.
 *
 * Prisma returns camelCase. The old MongoDB frontend used snake_case.
 * This function merges both so both `product.realPrice` and `product.real_price` work.
 */
export const normalizeProduct = (p) => {
    if (!p || typeof p !== 'object') return p;

    // --- Flatten author from authors[] relation ---
    let authorObj = p.author || null;
    if (!authorObj && Array.isArray(p.authors) && p.authors.length > 0) {
        const first = p.authors[0]?.author;
        if (first) {
            const parts = (first.fullName || '').split(' ');
            authorObj = {
                name:       first.fullName || '',
                first_name: first.firstName || parts[0] || '',
                last_name:  first.lastName  || parts.slice(1).join(' ') || '',
                fullName:   first.fullName || '',
                _id:        first.id,
                id:         first.id,
            };
        }
    }

    return {
        ...p,

        // --- IDs ---
        bagcheeId:   p.bagcheeId   || p.bagchee_id,
        bagchee_id:  p.bagcheeId   || p.bagchee_id,
        _id:         p._id         || p.id,
        id:          p.id          || p._id,

        // --- Pricing ---
        realPrice:   p.realPrice   ?? p.real_price   ?? 0,
        real_price:  p.realPrice   ?? p.real_price   ?? 0,
        inrPrice:    p.inrPrice    ?? p.inr_price    ?? 0,
        inr_price:   p.inrPrice    ?? p.inr_price    ?? 0,

        // --- Image ---
        defaultImage: p.defaultImage || p.default_image || '',
        default_image: p.defaultImage || p.default_image || '',
        tocImage:    p.tocImage     || p.toc_image    || '',
        toc_image:   p.tocImage     || p.toc_image    || '',
        tocImages:   p.tocImages    || p.toc_images   || [],
        toc_images:  p.tocImages    || p.toc_images   || [],

        // --- Dates ---
        pubDate:     p.pubDate      || p.pub_date     || '',
        pub_date:    p.pubDate      || p.pub_date     || '',

        // --- Counts ---
        soldCount:   p.soldCount    ?? p.sold_count   ?? 0,
        sold_count:  p.soldCount    ?? p.sold_count   ?? 0,
        ratedTimes:  p.ratedTimes   ?? p.rated_times  ?? 0,
        rated_times: p.ratedTimes   ?? p.rated_times  ?? 0,

        // --- Physical Details ---
        weight:       p.weight       || '',

        // --- Shipping ---
        shipDays:    (p.shipDays    || p.ship_days)    || 3,
        ship_days:   (p.shipDays    || p.ship_days)    || 3,
        deliverDays: (p.deliverDays || p.deliver_days) || 7,
        deliver_days:(p.deliverDays || p.deliver_days) || 7,

        // --- Content ---
        metaTitle:        p.metaTitle        || p.meta_title        || '',
        meta_title:       p.metaTitle        || p.meta_title        || '',
        metaDescription:  p.metaDescription  || p.meta_description  || '',
        meta_description: p.metaDescription  || p.meta_description  || '',
        metaKeywords:     p.metaKeywords     || p.meta_keywords     || '',
        meta_keywords:    p.metaKeywords     || p.meta_keywords     || '',
        aboutAuthorText:  p.aboutAuthorText  || p.about_author_text || '',
        about_author_text: p.aboutAuthorText || p.about_author_text || '',
        tableOfContents:  p.tableOfContents  || p.table_of_contents || '',
        table_of_contents: p.tableOfContents || p.table_of_contents || '',
        criticsNote:      p.criticsNote      || p.critics_note      || '',
        critics_note:     p.criticsNote      || p.critics_note      || '',

        // --- Category (extract first category ID for legacy UI) ---
        categoryId: p.leadingCategoryId || (Array.isArray(p.categories) && p.categories.length > 0 ? p.categories[0].categoryId || p.categories[0].category?.id : undefined),
        leadingCategoryId: p.leadingCategoryId,

        // --- Author (flattened for legacy UI) ---
        author: authorObj,
    };
};

/** Normalize an array of products */
export const normalizeProducts = (arr) =>
    Array.isArray(arr) ? arr.map(normalizeProduct) : [];
