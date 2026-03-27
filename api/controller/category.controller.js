import prisma from '../lib/prisma.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// Field mapping: categorytitle→title, categoryiconname→image, parentid→parentId(Int),
// active('active'/'inactive')→active(Boolean), metatitle→metaTitle, metakeywords→metaKeywords,
// metadescription→metaDesc, producttype→productType(Int).
// Dropped: parentslug, mainmodule, oldid, lft, rght, level, newslettercategory, newsletterorder (not in Prisma schema).
// Old route used POST /update — kept same exports (save, fetchCategory, updateCategory, deletecategory).

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
                parentId: req.body.parentId === 'root' || !req.body.parentId ? 0 : parseInt(req.body.parentId),
                active: req.body.active === 'active' || req.body.active === true,
                image: imageUrl,
                metaTitle: req.body.metaTitle || req.body.metatitle || null,
                metaKeywords: req.body.metaKeywords || req.body.metakeywords || null,
                metaDesc: req.body.metaDescription || req.body.metadescription || null,
                productType: Number(req.body.productType || req.body.producttype) || 0
            }
        });
        res.status(201).json({ status: true, msg: 'Category added successfully!', data: category });
    } catch (error) {
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
                prisma.$queryRaw`
                    SELECT * FROM categories
                    WHERE active = true
                    ORDER BY (CASE WHEN image IS NOT NULL AND image != '' THEN 0 ELSE 1 END), category_title ASC
                    LIMIT ${pageSize} OFFSET ${skip}
                `,
                prisma.category.count({ where: { active: true } })
            ]);
            const mapped = data.map(c => ({
                id: c.id,
                title: c.category_title,
                slug: c.slug,
                parentId: c.parent_id,
                active: c.active,
                image: c.image,
                metaTitle: c.meta_title,
                metaKeywords: c.meta_keywords,
                metaDesc: c.meta_description,
                productType: c.product_type,
                createdAt: c.createdAt
            }));
            return res.json({ status: true, data: mapped, total, totalPages: Math.ceil(total / pageSize), page: pageNum, limit: pageSize });
        }

        // All categories (for dropdowns)
        const data = await prisma.category.findMany({ orderBy: { title: 'asc' } });
        res.json({ status: true, data });
    } catch (error) {
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

        const updateData = {
            title: req.body.categorytitle || req.body.categoryTitle || existing.title,
            slug: req.body.slug ?? existing.slug,
            parentId: req.body.parentid === 'root' || !req.body.parentid ? 0 : parseInt(req.body.parentid),
            active: req.body.active === 'active' || req.body.active === true,
            image: imageUrl,
            metaTitle: req.body.metatitle || req.body.metaTitle || existing.metaTitle,
            metaKeywords: req.body.metakeywords || req.body.metaKeywords || existing.metaKeywords,
            metaDesc: req.body.metadescription || req.body.metaDescription || existing.metaDesc,
            productType: Number(req.body.producttype || req.body.productType) || existing.productType
        };

        const updated = await prisma.category.update({ where: { id }, data: updateData });
        res.json({ status: true, msg: 'Category Updated successfully!', data: updated });
    } catch (error) {
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
