import prisma from '../lib/prisma.js';

// Field mapping: Mongoose used `order`. Prisma uses `ord`.

export const saveLanguage = async (req, res) => {
    try {
        const { title, order } = req.body;
        if (!title || title.trim() === '') {
            return res.status(400).json({ status: false, msg: 'Title is required.' });
        }
        const cleanTitle = title.trim();

        const existing = await prisma.language.findFirst({
            where: { title: { equals: cleanTitle, mode: 'insensitive' } }
        });
        if (existing) return res.status(400).json({ status: false, msg: 'Language already exists.' });

        const lang = await prisma.language.create({
            data: { title: cleanTitle, ord: Number(order) || 0 }
        });
        res.status(201).json({ status: true, msg: 'Language added successfully!', data: lang });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllLanguages = async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 25;
        const skip = (pageNum - 1) * pageSize;

        const [languages, total] = await Promise.all([
            prisma.language.findMany({ orderBy: { ord: 'asc' }, skip, take: pageSize }),
            prisma.language.count()
        ]);
        res.status(200).json({ status: true, data: languages, total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getLanguageById = async (req, res) => {
    try {
        const lang = await prisma.language.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!lang) return res.status(404).json({ status: false, msg: 'Language not found' });
        res.status(200).json({ status: true, data: lang });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateLanguage = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, order } = req.body;
        if (!title || title.trim() === '') {
            return res.status(400).json({ status: false, msg: 'Title is required.' });
        }
        const cleanTitle = title.trim();

        const existing = await prisma.language.findFirst({
            where: { title: { equals: cleanTitle, mode: 'insensitive' }, NOT: { id } }
        });
        if (existing) return res.status(400).json({ status: false, msg: 'Language with this name already exists.' });

        const updated = await prisma.language.update({
            where: { id },
            data: { title: cleanTitle, ord: Number(order) || 0 }
        });
        res.status(200).json({ status: true, msg: 'Language updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Language not found' });
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

export const deleteLanguage = async (req, res) => {
    try {
        await prisma.language.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Language deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Language not found' });
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};
