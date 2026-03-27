import prisma from '../lib/prisma.js';

// Field mapping: Mongoose used snake_case (image_folder, bagchee_prefix).
// Prisma uses camelCase (imageFolder, bagcheePrefix).

export const saveProductType = async (req, res) => {
    try {
        const { name, image_folder, bagchee_prefix } = req.body;
        if (!name || !image_folder || !bagchee_prefix) {
            return res.status(400).json({ status: false, msg: 'All fields are required.' });
        }
        const cleanName = name.trim();

        const existing = await prisma.productType.findFirst({
            where: { name: { equals: cleanName, mode: 'insensitive' } }
        });
        if (existing) return res.status(400).json({ status: false, msg: 'This Product Type already exists.' });

        const type = await prisma.productType.create({
            data: { name: cleanName, imageFolder: image_folder.trim(), bagcheePrefix: bagchee_prefix.trim() }
        });
        res.status(201).json({ status: true, msg: 'Product Type added successfully!', data: type });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllProductTypes = async (req, res) => {
    try {
        const types = await prisma.productType.findMany({ orderBy: { name: 'asc' } });
        res.status(200).json({ status: true, data: types });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getProductTypeById = async (req, res) => {
    try {
        const type = await prisma.productType.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!type) return res.status(404).json({ status: false, msg: 'Product Type not found' });
        res.status(200).json({ status: true, data: type });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateProductType = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, image_folder, bagchee_prefix } = req.body;
        if (!name || !image_folder || !bagchee_prefix) {
            return res.status(400).json({ status: false, msg: 'All fields are required.' });
        }
        const cleanName = name.trim();

        const existing = await prisma.productType.findFirst({
            where: { name: { equals: cleanName, mode: 'insensitive' }, NOT: { id } }
        });
        if (existing) return res.status(400).json({ status: false, msg: 'Product Type with this name already exists.' });

        const updated = await prisma.productType.update({
            where: { id },
            data: { name: cleanName, imageFolder: image_folder.trim(), bagcheePrefix: bagchee_prefix.trim() }
        });
        res.status(200).json({ status: true, msg: 'Product Type updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Product Type not found' });
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

export const deleteProductType = async (req, res) => {
    try {
        await prisma.productType.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Product Type deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Product Type not found' });
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};
