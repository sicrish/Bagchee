import prisma from '../lib/prisma.js';

// Field mapping: home_section_id→homeSectionId(Int), productId→productId(Int).
// active: old code stored string ('Yes'/'No') — Prisma has Boolean. Convert on write.
// SCHEMA-CHECK: HomeSectionProduct has no `product Product @relation(...)` defined.
// fetchSectionDataByName joins product data via a separate query as a workaround.

const fetchSectionDataByName = async (sectionName, res) => {
    try {
        let sectionInfo = await prisma.homeSection.findFirst({
            where: { section: { equals: sectionName, mode: 'insensitive' } }
        });
        if (!sectionInfo) {
            sectionInfo = await prisma.homeSection.create({
                data: { section: sectionName, title: '', tagline: '' }
            });
        }

        const entries = await prisma.homeSectionProduct.findMany({
            where: { homeSectionId: sectionInfo.id },
            orderBy: { order: 'asc' }
        });

        // Fetch product details separately (no Prisma relation defined on HomeSectionProduct)
        const productIds = entries.map(e => e.productId);
        const products = productIds.length > 0
            ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, title: true, defaultImage: true, price: true, bagcheeId: true } })
            : [];

        const productMap = Object.fromEntries(products.map(p => [p.id, p]));
        const data = entries.map(e => ({ ...e, product: productMap[e.productId] || null }));

        res.json({ status: true, sectionTitle: sectionInfo.title, sectionTagline: sectionInfo.tagline, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: `Failed to fetch ${sectionName}` });
    }
};

export const getSectionOneProducts = async (req, res) => { await fetchSectionDataByName('section 1', res); };
export const getSectionTwoProducts = async (req, res) => { await fetchSectionDataByName('section 2', res); };
export const getSectionThreeProducts = async (req, res) => { await fetchSectionDataByName('section 3', res); };
export const getSectionFourProducts = async (req, res) => { await fetchSectionDataByName('section 4', res); };

export const saveProductToSection = async (req, res) => {
    try {
        const { home_section_id, productId, title, active, order } = req.body;
        if (!home_section_id) return res.status(400).json({ status: false, msg: 'Section ID is required' });
        const sectionId = parseInt(home_section_id);
        const pId = parseInt(productId);
        if (isNaN(sectionId) || isNaN(pId)) return res.status(400).json({ status: false, msg: 'Invalid section or product ID' });
        const exists = await prisma.homeSectionProduct.findFirst({ where: { homeSectionId: sectionId, productId: pId } });
        if (exists) return res.status(400).json({ status: false, msg: 'This product is already in this section!' });
        // Convert active string ('Yes'/'No' or boolean) to Boolean
        const isActive = active === 'Yes' || active === true || active === 'true';
        const newEntry = await prisma.homeSectionProduct.create({
            data: { homeSectionId: sectionId, productId: pId, title: title || '', active: isActive, order: Number(order) || 0 }
        });
        res.json({ status: true, msg: 'Product linked successfully', data: newEntry });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getSectionProductById = async (req, res) => {
    try {
        const data = await prisma.homeSectionProduct.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!data) return res.status(404).json({ status: false, msg: 'Record not found' });
        res.json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Database error' });
    }
};

export const updateSectionProduct = async (req, res) => {
    try {
        const { home_section_id, productId, title, active, order } = req.body;
        const updateData = {};
        if (home_section_id !== undefined) updateData.homeSectionId = parseInt(home_section_id);
        if (productId !== undefined) updateData.productId = parseInt(productId);
        if (title !== undefined) updateData.title = title;
        if (active !== undefined) updateData.active = active === 'Yes' || active === true || active === 'true';
        if (order !== undefined) updateData.order = Number(order);
        await prisma.homeSectionProduct.update({ where: { id: parseInt(req.params.id) }, data: updateData });
        res.json({ status: true, msg: 'Link updated successfully' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Not found' });
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

export const deleteSectionProduct = async (req, res) => {
    try {
        await prisma.homeSectionProduct.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ status: true, msg: 'Product removed from section' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Not found' });
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};
