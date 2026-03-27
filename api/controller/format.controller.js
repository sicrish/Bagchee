import prisma from '../lib/prisma.js';

// Field mapping:
// Mongoose: active (string 'active'/'inactive'), category (ref ObjectId), order
// Prisma:   active (Boolean), categoryId (Int), ord

export const saveFormat = async (req, res) => {
    try {
        const { title, active, category_id, order } = req.body;
        if (!title || title.trim() === '') {
            return res.status(400).json({ status: false, msg: 'Title is required.' });
        }
        const cleanTitle = title.trim();

        const existing = await prisma.format.findFirst({
            where: { title: { equals: cleanTitle, mode: 'insensitive' } }
        });
        if (existing) return res.status(400).json({ status: false, msg: 'Format title already exists.' });

        const format = await prisma.format.create({
            data: {
                title: cleanTitle,
                active: active === 'active' || active === true,
                categoryId: parseInt(category_id) || 0,
                ord: Number(order) || 0
            }
        });
        res.status(201).json({ status: true, msg: 'Format added successfully!', data: format });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllFormats = async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const skip = (pageNum - 1) * pageSize;

        const [formats, total] = await Promise.all([
            prisma.format.findMany({ orderBy: { ord: 'asc' }, skip, take: pageSize }),
            prisma.format.count()
        ]);
        res.status(200).json({ status: true, data: formats, total, totalPages: Math.ceil(total / pageSize), page: pageNum });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getFormatById = async (req, res) => {
    try {
        const format = await prisma.format.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!format) return res.status(404).json({ status: false, msg: 'Format not found' });
        res.status(200).json({ status: true, data: format });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateFormat = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, active, category_id, order } = req.body;

        if (title) {
            const cleanTitle = title.trim();
            const existing = await prisma.format.findFirst({
                where: { title: { equals: cleanTitle, mode: 'insensitive' }, NOT: { id } }
            });
            if (existing) return res.status(400).json({ status: false, msg: 'Another format already has this title.' });
        }

        const updated = await prisma.format.update({
            where: { id },
            data: {
                title: title?.trim(),
                active: active !== undefined ? (active === 'active' || active === true) : undefined,
                categoryId: category_id !== undefined ? parseInt(category_id) || 0 : undefined,
                ord: order !== undefined ? Number(order) : undefined
            }
        });
        res.status(200).json({ status: true, msg: 'Format updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Format not found' });
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

export const deleteFormat = async (req, res) => {
    try {
        await prisma.format.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Format deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Format not found' });
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};
