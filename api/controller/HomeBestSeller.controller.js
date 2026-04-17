import prisma from '../lib/prisma.js';

// Old used MongoDB ObjectId ref `product`. Now uses productId (Int FK).
// Product lookup by bagcheeId/isbn13/isbn10 — same logic, just Prisma field names.
// SCHEMA-CHECK: HomeBestSeller has no Prisma relation to Product (no @relation defined).
// Product data fetched separately via productId array lookup.
// fetchForHome: auto-bestseller logic uses Product.soldCount — kept same approach.

const findProductByCode = async (code) => {
    const numId = parseInt(code);
    if (!isNaN(numId)) {
        const byId = await prisma.product.findUnique({ where: { id: numId } });
        if (byId) return byId;
    }
    return prisma.product.findFirst({
        where: { OR: [{ bagcheeId: code }, { isbn13: code }, { isbn10: code }] }
    });
};

export const save = async (req, res) => {
    try {
        const { productId, isActive, order } = req.body;
        if (!productId) return res.status(400).json({ status: false, msg: 'Product ID required' });
        const mainProduct = await findProductByCode(String(productId).trim());
        if (!mainProduct) return res.status(404).json({ status: false, msg: 'Product not found' });
        const existing = await prisma.homeBestSeller.findFirst({ where: { productId: mainProduct.id } });
        if (existing) return res.status(400).json({ status: false, msg: 'Already in Best Sellers' });
        const newItem = await prisma.homeBestSeller.create({
            data: { productId: mainProduct.id, isActive: isActive === 'yes' || isActive === true, order: Number(order) || 0 }
        });
        res.status(201).json({ status: true, msg: 'Added to Best Seller', data: newItem });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const list = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const isExport = limit === 'all';
        const pageNum = Number(page) || 1;
        const pageSize = isExport ? 100000 : (Number(limit) || 25);
        const skip = (pageNum - 1) * pageSize;
        const [items, total] = await Promise.all([
            prisma.homeBestSeller.findMany({ orderBy: { order: 'asc' }, skip: isExport ? 0 : skip, take: pageSize }),
            prisma.homeBestSeller.count()
        ]);
        const productIds = items.map(i => i.productId);
        const products = productIds.length > 0
            ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, title: true, bagcheeId: true, defaultImage: true } })
            : [];
        const productMap = Object.fromEntries(products.map(p => [p.id, p]));
        const manualData = items.map(item => ({
            id: item.id,
            productId: productMap[item.productId]?.bagcheeId || 'N/A',
            title: productMap[item.productId]?.title || 'Product Deleted',
            image: productMap[item.productId]?.defaultImage || '',
            isActive: item.isActive,
            order: item.order,
            source: 'manual',
            soldCount: 0,
            createdAt: item.createdAt
        }));

        // Also fetch auto best sellers (by soldCount) excluding manual picks
        const autoProducts = await prisma.product.findMany({
            where: { isActive: true, soldCount: { gt: 0 }, id: { notIn: productIds.length > 0 ? productIds : [0] } },
            orderBy: { soldCount: 'desc' },
            take: 50,
            select: { id: true, title: true, bagcheeId: true, defaultImage: true, soldCount: true }
        });
        const autoData = autoProducts.map((p, i) => ({
            id: `auto-${p.id}`,
            productId: p.bagcheeId || 'N/A',
            title: p.title,
            image: p.defaultImage || '',
            isActive: true,
            order: manualData.length + i + 1,
            source: 'auto',
            soldCount: p.soldCount,
            createdAt: null
        }));

        const combined = [...manualData, ...autoData];
        res.status(200).json({ status: true, data: combined, total: combined.length, page: pageNum, limit: pageSize, totalPages: 1 });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getOne = async (req, res) => {
    try {
        const item = await prisma.homeBestSeller.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!item) return res.status(404).json({ status: false, msg: 'Not found' });
        const product = await prisma.product.findUnique({ where: { id: item.productId }, select: { bagcheeId: true, title: true } });
        res.status(200).json({ status: true, data: { id: item.id, productId: product?.bagcheeId || '', title: product?.title || '', isActive: item.isActive, order: item.order } });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const update = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { productId, isActive, order } = req.body;
        const item = await prisma.homeBestSeller.findUnique({ where: { id } });
        if (!item) return res.status(404).json({ status: false, msg: 'Entry not found' });
        const updateData = {};
        if (productId) {
            const mainProduct = await findProductByCode(String(productId).trim());
            if (!mainProduct) return res.status(404).json({ status: false, msg: 'Product not found in inventory' });
            updateData.productId = mainProduct.id;
        }
        if (isActive !== undefined) updateData.isActive = (isActive === 'yes' || isActive === true);
        if (order !== undefined) updateData.order = Number(order);
        await prisma.homeBestSeller.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Updated successfully' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const remove = async (req, res) => {
    try {
        await prisma.homeBestSeller.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Removed successfully' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Not found' });
        res.status(500).json({ status: false, msg: 'Error deleting' });
    }
};

export const searchMainInventory = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(200).json({ status: true, data: [] });
        const products = await prisma.product.findMany({
            where: { OR: [{ title: { contains: q, mode: 'insensitive' } }, { bagcheeId: { contains: q, mode: 'insensitive' } }, { isbn13: { contains: q, mode: 'insensitive' } }, { isbn10: { contains: q, mode: 'insensitive' } }] },
            select: { id: true, title: true, bagcheeId: true, isbn13: true, isbn10: true, defaultImage: true },
            take: 10
        });
        res.status(200).json({ status: true, data: products });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const fetchForHome = async (req, res) => {
    try {
        let { page, limit } = req.query;
        page = Number(page) || 1;
        limit = Number(limit) || 6;
        // Manual admin picks (active only)
        const manualEntries = await prisma.homeBestSeller.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
        const manualProductIds = manualEntries.map(e => e.productId);
        const manualProducts = manualProductIds.length > 0
            ? await prisma.product.findMany({ where: { id: { in: manualProductIds }, isActive: true }, select: { id: true, title: true, price: true, inrPrice: true, realPrice: true, discount: true, defaultImage: true, isbn13: true, bagcheeId: true, soldCount: true, authors: { select: { author: { select: { id: true, firstName: true, lastName: true, fullName: true } } } } } })
            : [];
        // Auto best sellers (by soldCount, excluding manual picks)
        const autoProducts = await prisma.product.findMany({
            where: { isActive: true, soldCount: { gt: 0 }, id: { notIn: manualProductIds } },
            orderBy: { soldCount: 'desc' },
            take: 50,
            select: { id: true, title: true, price: true, inrPrice: true, realPrice: true, discount: true, defaultImage: true, isbn13: true, bagcheeId: true, soldCount: true, authors: { select: { author: { select: { id: true, firstName: true, lastName: true, fullName: true } } } } }
        });
        const combined = [...manualProducts, ...autoProducts];
        const startIndex = (page - 1) * limit;
        const paginatedData = combined.slice(startIndex, startIndex + limit);
        res.status(200).json({ status: true, data: paginatedData, total: combined.length, page, limit, sectionTitle: 'Best Sellers', sectionTagline: 'Our most popular picks' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
