import prisma from '../lib/prisma.js';

// Field mapping note: Mongoose used `status` (string 'active'/'inactive') and `order`.
// Prisma uses `active` (Boolean) and `ord`.

export const saveLabel = async (req, res) => {
    try {
        const { title, status, order } = req.body;
        if (!title || title.trim() === '') {
            return res.status(400).json({ status: false, msg: 'Title is required.' });
        }
        const cleanTitle = title.trim();

        const existing = await prisma.label.findFirst({
            where: { title: { equals: cleanTitle, mode: 'insensitive' } }
        });
        if (existing) return res.status(400).json({ status: false, msg: 'Label with this title already exists.' });

        const label = await prisma.label.create({
            data: {
                title: cleanTitle,
                active: status !== 'inactive',
                ord: Number(order) || 0
            }
        });
        res.status(201).json({ status: true, msg: 'Label added successfully!', data: label });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllLabels = async (req, res) => {
    try {
        const labels = await prisma.label.findMany({ orderBy: { ord: 'asc' } });
        res.status(200).json({ status: true, data: labels });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getLabelById = async (req, res) => {
    try {
        const label = await prisma.label.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!label) return res.status(404).json({ status: false, msg: 'Label not found' });
        res.status(200).json({ status: true, data: label });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateLabel = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, status, order } = req.body;
        if (!title || title.trim() === '') {
            return res.status(400).json({ status: false, msg: 'Title is required.' });
        }
        const cleanTitle = title.trim();

        const existing = await prisma.label.findFirst({
            where: { title: { equals: cleanTitle, mode: 'insensitive' }, NOT: { id } }
        });
        if (existing) return res.status(400).json({ status: false, msg: 'Label title already exists.' });

        const updated = await prisma.label.update({
            where: { id },
            data: { title: cleanTitle, active: status !== 'inactive', ord: Number(order) || 0 }
        });
        res.status(200).json({ status: true, msg: 'Label updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Label not found' });
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

export const deleteLabel = async (req, res) => {
    try {
        await prisma.label.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Label deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Label not found' });
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};
