import prisma from '../lib/prisma.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// Field mapping: subcategoryname→name, subcategoryiconname→iconName, categoryId stays.
// Old controller used raw fs/mv and JSON.parse(condition_obj) — replaced with standard CRUD.
// active (Boolean, default true) — not in old controller but in Prisma schema.

export const save = async (req, res) => {
    try {
        const { subcategoryname, categoryId } = req.body;
        if (!req.files || !req.files.subcategoryicon) {
            return res.status(400).json({ status: false, msg: 'SubCategory icon image is required' });
        }
        let iconPath = '';
        try {
            iconPath = await saveFileLocal(req.files.subcategoryicon, 'subcaticons');
        } catch (uploadError) {
            return res.status(400).json({ status: false, msg: 'File upload failed: ' + uploadError.message });
        }
        const subCategory = await prisma.subCategory.create({
            data: { name: subcategoryname || '', categoryId: parseInt(categoryId), iconName: iconPath }
        });
        res.status(201).json({ status: true, msg: 'SubCategory added successfully', data: subCategory });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const fetch = async (req, res) => {
    try {
        const { categoryId, active } = req.query;
        const where = {};
        if (categoryId) where.categoryId = parseInt(categoryId);
        if (active !== undefined && active !== '') where.active = active === 'true' || active === 'yes';
        const subList = await prisma.subCategory.findMany({ where, orderBy: { id: 'asc' } });
        res.status(200).json({ status: true, data: subList });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getSubCategoryById = async (req, res) => {
    try {
        const data = await prisma.subCategory.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!data) return res.status(404).json({ status: false, msg: 'Not found' });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const update = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { subcategoryname, categoryId, active } = req.body;
        const old = await prisma.subCategory.findUnique({ where: { id } });
        if (!old) return res.status(404).json({ status: false, msg: 'Resource not found' });
        const updateData = {};
        if (subcategoryname !== undefined) updateData.name = subcategoryname;
        if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId);
        if (active !== undefined) updateData.active = active === 'true' || active === true;
        if (req.files?.subcategoryicon) {
            try {
                const newPath = await saveFileLocal(req.files.subcategoryicon, 'subcaticons');
                if (old.iconName) await deleteFileLocal(old.iconName);
                updateData.iconName = newPath;
            } catch (err) {
                return res.status(400).json({ status: false, msg: 'File upload failed' });
            }
        }
        await prisma.subCategory.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Update successful' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Resource not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteSubCategory = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const subCat = await prisma.subCategory.findUnique({ where: { id } });
        if (!subCat) return res.status(404).json({ status: false, msg: 'Resource not found' });
        if (subCat.iconName) await deleteFileLocal(subCat.iconName);
        await prisma.subCategory.delete({ where: { id } });
        res.status(200).json({ status: true, msg: 'SubCategory deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
