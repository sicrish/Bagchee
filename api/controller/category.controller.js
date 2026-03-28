import prisma from '../lib/prisma.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

export const save = async (req, res) => {
    try {
        let imageUrl = '';
        const file = req.files?.categoryicon || req.files?.image;
        if (file) {
            try {
                imageUrl = await saveFileLocal(file, 'categories');
            } catch (uploadError) {
                return res.status(400).json({ status: false, msg: uploadError.message });
            }
        }
        const category = await prisma.category.create({
            data: {
                title: req.body.categoryTitle || req.body.categorytitle || '',
                slug: req.body.slug || null,
                parentSlug: req.body.parentSlug || req.body.parentslug || null,
                mainModule: req.body.mainModule || req.body.mainmodule || null,
                oldId: req.body.oldId || req.body.oldid || null,
                parentId: req.body.parentId === 'root' || !req.body.parentId ? 0 : parseInt(req.body.parentId),
                active: req.body.active === 'active' || req.body.active === true,
                lft: req.body.lft ? parseInt(req.body.lft) : null,
                rght: req.body.rght ? parseInt(req.body.rght) : null,
                level: req.body.level ? parseInt(req.body.level) : null,
                image: imageUrl,
                metaTitle: req.body.metaTitle || req.body.metatitle || null,
                metaKeywords: req.body.metaKeywords || req.body.metakeywords || null,
                metaDesc: req.body.metaDescription || req.body.metadescription || null,
                newsletterCategory: req.body.newsletterCategory === 'yes' || req.body.newsletterCategory === true,
                newsletterOrder: req.body.newsletterOrder ? parseInt(req.body.newsletterOrder) : null,
                productType: Number(req.body.productType || req.body.producttype) || 0
            }
        });
        res.status(201).json({ status: true, msg: 'Category added successfully!', data: category });
    } catch (error) {
        console.error('Category save error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const fetchCategory = async (req, res) => {
    try {
        const { _id, id, page, limit } = req.query;

        // Single fetch by ID
        if (_id || id) {
            const data = await prisma.category.findUnique({ where: { id: parseInt(_id || id) } });
            if (!data) return res.status(404).json({ status: false, msg: 'Not found' });
            return res.json({ status: true, data });
        }

        // Paginated list
        if (page && limit) {
            const pageNum = Number(page) || 1;
            const pageSize = Number(limit) || 6;
            const skip = (pageNum - 1) * pageSize;
            const [data, total] = await Promise.all([
                prisma.category.findMany({
                    orderBy: [{ image: 'desc' }, { title: 'asc' }],
                    where: { active: true },
                    skip,
                    take: pageSize
                }),
                prisma.category.count({ where: { active: true } })
            ]);
            return res.json({ status: true, data, total, totalPages: Math.ceil(total / pageSize), page: pageNum, limit: pageSize });
        }

        // All categories (for dropdowns)
        const data = await prisma.category.findMany({ orderBy: { title: 'asc' } });
        res.json({ status: true, data });
    } catch (error) {
        console.error('Category fetch error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateCategory = async (req, res) => {
    try {
        let id = req.body._id || req.body.id;
        if (!id) return res.status(400).json({ status: false, msg: 'ID is required' });
        if (Array.isArray(id)) id = id[0];
        id = parseInt(id);

        const existing = await prisma.category.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ status: false, msg: 'Category not found' });

        let imageUrl = existing.image;
        const file = req.files?.categoryicon || req.files?.image;
        if (file) {
            try {
                const newPath = await saveFileLocal(file, 'categories');
                if (existing.image) await deleteFileLocal(existing.image);
                imageUrl = newPath;
            } catch (uploadError) {
                return res.status(400).json({ status: false, msg: uploadError.message });
            }
        }

        const b = req.body;
        const updateData = {
            title: b.categorytitle || b.categoryTitle || existing.title,
            slug: b.slug ?? existing.slug,
            parentSlug: b.parentSlug ?? b.parentslug ?? existing.parentSlug,
            mainModule: b.mainModule ?? b.mainmodule ?? existing.mainModule,
            oldId: b.oldId ?? b.oldid ?? existing.oldId,
            parentId: b.parentId != null ? (b.parentId === 'root' || b.parentId === '' ? 0 : parseInt(b.parentId))
                     : b.parentid != null ? (b.parentid === 'root' || b.parentid === '' ? 0 : parseInt(b.parentid))
                     : existing.parentId,
            active: b.active === 'active' || b.active === true,
            lft: b.lft != null ? (b.lft === '' ? null : parseInt(b.lft)) : existing.lft,
            rght: b.rght != null ? (b.rght === '' ? null : parseInt(b.rght)) : existing.rght,
            level: b.level != null ? (b.level === '' ? null : parseInt(b.level)) : existing.level,
            image: imageUrl,
            metaTitle: b.metatitle || b.metaTitle || existing.metaTitle,
            metaKeywords: b.metakeywords || b.metaKeywords || existing.metaKeywords,
            metaDesc: b.metadescription || b.metaDescription || existing.metaDesc,
            newsletterCategory: b.newsletterCategory != null
                ? (b.newsletterCategory === 'yes' || b.newsletterCategory === true)
                : existing.newsletterCategory,
            newsletterOrder: b.newsletterOrder != null
                ? (b.newsletterOrder === '' ? null : parseInt(b.newsletterOrder))
                : existing.newsletterOrder,
            productType: Number(b.producttype || b.productType) || existing.productType
        };

        const updated = await prisma.category.update({ where: { id }, data: updateData });
        res.json({ status: true, msg: 'Category Updated successfully!', data: updated });
    } catch (error) {
        console.error('Category update error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deletecategory = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) return res.status(404).json({ status: false, msg: 'Category not found' });
        if (category.image) await deleteFileLocal(category.image);
        await prisma.category.delete({ where: { id } });
        res.status(200).json({ status: true, msg: 'Deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Category not found' });
        res.status(500).json({ status: false, msg: 'Deletion failed' });
    }
};
