import prisma from '../lib/prisma.js';

// Dropped: `index` field (was auto-calculated in Mongoose — not in Prisma schema).
// Footer now orders by id asc instead.

export const saveFooter = async (req, res) => {
    try {
        const { name, title, subtitle, content } = req.body;
        const newFooter = await prisma.footer.create({
            data: { name, title, subtitle: subtitle || '', content: content || '' }
        });
        res.status(201).json({ status: true, msg: 'Footer column added successfully!', data: newFooter });
    } catch (error) {
        res.status(500).json({ status: false });
    }
};

export const listFooter = async (req, res) => {
    try {
        const [data, total] = await Promise.all([
            prisma.footer.findMany({ orderBy: { id: 'asc' } }),
            prisma.footer.count()
        ]);
        res.status(200).json({ status: true, data, total, totalPages: 1 });
    } catch (error) {
        res.status(500).json({ status: false });
    }
};

export const getFooterById = async (req, res) => {
    try {
        const data = await prisma.footer.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!data) return res.status(404).json({ status: false, msg: 'Not found' });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false });
    }
};

export const updateFooter = async (req, res) => {
    try {
        const { name, title, subtitle, content } = req.body;
        const data = await prisma.footer.update({
            where: { id: parseInt(req.params.id) },
            data: { name, title, subtitle, content }
        });
        res.status(200).json({ status: true, msg: 'Updated successfully!', data });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Not found' });
        res.status(500).json({ status: false });
    }
};

export const deleteFooter = async (req, res) => {
    try {
        await prisma.footer.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Footer column deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Column not found' });
        res.status(500).json({ status: false });
    }
};
