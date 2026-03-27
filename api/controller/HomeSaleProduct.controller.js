import prisma from '../lib/prisma.js';

// Old used MongoDB ObjectId ref `product`. Now uses productId (Int FK).
// Field: `active` (not isActive!) — matches Prisma HomeSaleProduct schema.
// SCHEMA-CHECK: HomeSaleProduct has no Prisma @relation to Product — fetched separately.

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
        if (!productId) return res.status(400).json({ status: false, msg: 'Product ID is required' });
        const mainProduct = await findProductByCode(String(productId).trim());
        if (!mainProduct) return res.status(404).json({ status: false, msg: 'Product not found in inventory!' });
        const existing = await prisma.homeSaleProduct.findFirst({ where: { productId: mainProduct.id } });
        if (existing) return res.status(400).json({ status: false, msg: 'This product is already listed in Home Sale.' });
        const newItem = await prisma.homeSaleProduct.create({
            data: { productId: mainProduct.id, active: isActive === 'yes' || isActive === true, order: Number(order) || 0 }
        });
        res.status(201).json({ status: true, msg: 'Connected & Added successfully', data: newItem });
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
            prisma.homeSaleProduct.findMany({ orderBy: { order: 'asc' }, skip: isExport ? 0 : skip, take: pageSize }),
            prisma.homeSaleProduct.count()
        ]);
        const productIds = items.map(i => i.productId);
        const products = productIds.length > 0
            ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, title: true, bagcheeId: true, defaultImage: true } })
            : [];
        const productMap = Object.fromEntries(products.map(p => [p.id, p]));
        const formattedData = items.map(item => ({
            id: item.id,
            productId: productMap[item.productId]?.bagcheeId || 'N/A',
            title: productMap[item.productId]?.title || 'Product Deleted',
            image: productMap[item.productId]?.defaultImage || '',
            isActive: item.active,
            order: item.order
        }));
        res.status(200).json({ status: true, data: formattedData, total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getOne = async (req, res) => {
    try {
        const item = await prisma.homeSaleProduct.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!item) return res.status(404).json({ status: false, msg: 'Not found' });
        const product = await prisma.product.findUnique({ where: { id: item.productId }, select: { bagcheeId: true, title: true } });
        res.status(200).json({ status: true, data: { id: item.id, productId: product?.bagcheeId || '', title: product?.title || '', isActive: item.active, order: item.order } });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const update = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { productId, isActive, order } = req.body;
        const item = await prisma.homeSaleProduct.findUnique({ where: { id } });
        if (!item) return res.status(404).json({ status: false, msg: 'Entry not found' });
        const updateData = {};
        if (productId) {
            const mainProduct = await findProductByCode(String(productId).trim());
            if (!mainProduct) return res.status(404).json({ status: false, msg: 'Product not found in inventory' });
            updateData.productId = mainProduct.id;
        }
        if (isActive !== undefined) updateData.active = (isActive === 'yes' || isActive === true);
        if (order !== undefined) updateData.order = Number(order);
        await prisma.homeSaleProduct.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Updated successfully' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const remove = async (req, res) => {
    try {
        await prisma.homeSaleProduct.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Removed from Home Sale' });
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
            select: { id: true, title: true, price: true, bagcheeId: true, isbn13: true, defaultImage: true },
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
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            prisma.homeSaleProduct.findMany({ where: { active: true }, orderBy: { order: 'asc' }, skip, take: limit }),
            prisma.homeSaleProduct.count({ where: { active: true } })
        ]);
        const productIds = items.map(i => i.productId);
        const products = productIds.length > 0
            ? await prisma.product.findMany({ where: { id: { in: productIds }, isActive: true }, select: { id: true, title: true, price: true, inrPrice: true, realPrice: true, discount: true, defaultImage: true, isbn13: true, bagcheeId: true, authors: { select: { author: { select: { id: true, firstName: true, lastName: true, fullName: true } } } } } })
            : [];
        const productMap = Object.fromEntries(products.map(p => [p.id, p]));
        const validItems = items.filter(i => productMap[i.productId]).map(i => ({ ...i, product: productMap[i.productId] }));
        res.status(200).json({ status: true, data: validItems, total, page, limit });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
