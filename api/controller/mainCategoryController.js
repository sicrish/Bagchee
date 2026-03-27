import prisma from '../lib/prisma.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// Old code used raw fs/mv for image upload — replaced with saveFileLocal utility.
// Field mapping: active(string)→active(Boolean), all others same.

export const saveCategory = async (req, res) => {
    try {
        const { title, link, active, order } = req.body;
        let imagePath = '';
        if (req.files && req.files.image) {
            try { imagePath = await saveFileLocal(req.files.image, 'main-categories'); }
            catch (err) { return res.status(400).json({ status: false, msg: err.message }); }
        }
        const newCategory = await prisma.mainCategory.create({
            data: {
                title,
                link: link || '',
                active: active === 'true' || active === true,
                order: Number(order) || 0,
                image: imagePath
            }
        });
        res.status(201).json({ status: true, msg: 'Category created successfully', data: newCategory });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const listCategories = async (req, res) => {
    try {
        const categories = await prisma.mainCategory.findMany({ orderBy: { order: 'asc' } });
        res.status(200).json({ status: true, data: categories });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Fetch failed' });
    }
};

export const getCategoryById = async (req, res) => {
    try {
        const category = await prisma.mainCategory.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!category) return res.status(404).json({ status: false, msg: 'Category not found' });
        res.json({ status: true, data: category });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const category = await prisma.mainCategory.findUnique({ where: { id } });
        if (!category) return res.status(404).json({ status: false, msg: 'Category not found' });
        const { title, link, active, order } = req.body;
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (link !== undefined) updateData.link = link;
        if (active !== undefined) updateData.active = active === 'true' || active === true;
        if (order !== undefined) updateData.order = Number(order);
        if (req.files && req.files.image) {
            try {
                if (category.image) await deleteFileLocal(category.image);
                updateData.image = await saveFileLocal(req.files.image, 'main-categories');
            } catch (err) { return res.status(400).json({ status: false, msg: err.message }); }
        }
        const updated = await prisma.mainCategory.update({ where: { id }, data: updateData });
        res.json({ status: true, msg: 'Category updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const category = await prisma.mainCategory.findUnique({ where: { id } });
        if (!category) return res.status(404).json({ status: false, msg: 'Category not found' });
        if (category.image) await deleteFileLocal(category.image);
        await prisma.mainCategory.delete({ where: { id } });
        res.json({ status: true, msg: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};
