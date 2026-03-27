import prisma from '../lib/prisma.js';

export const saveTag = async (req, res) => {
    try {
        const { title } = req.body;
        if (!title || title.trim() === '') {
            return res.status(400).json({ status: false, msg: 'Tag Title is required.' });
        }
        const cleanTitle = title.trim();

        const existing = await prisma.tag.findFirst({
            where: { title: { equals: cleanTitle, mode: 'insensitive' } }
        });
        if (existing) return res.status(400).json({ status: false, msg: 'Tag already exists.' });

        const newTag = await prisma.tag.create({ data: { title: cleanTitle } });
        res.status(201).json({ status: true, msg: 'Tag added successfully!', data: newTag });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllTags = async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 25;
        const skip = (pageNum - 1) * pageSize;

        const [tags, total] = await Promise.all([
            prisma.tag.findMany({ orderBy: { id: 'desc' }, skip, take: pageSize }),
            prisma.tag.count()
        ]);

        res.status(200).json({ status: true, data: tags, total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getTagById = async (req, res) => {
    try {
        const tag = await prisma.tag.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!tag) return res.status(404).json({ status: false, msg: 'Tag not found' });
        res.status(200).json({ status: true, data: tag });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateTag = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title } = req.body;
        if (!title || title.trim() === '') {
            return res.status(400).json({ status: false, msg: 'Tag Title cannot be empty.' });
        }
        const cleanTitle = title.trim();

        const existing = await prisma.tag.findFirst({
            where: { title: { equals: cleanTitle, mode: 'insensitive' }, NOT: { id } }
        });
        if (existing) return res.status(400).json({ status: false, msg: 'Tag with this name already exists.' });

        const updated = await prisma.tag.update({ where: { id }, data: { title: cleanTitle } });
        res.status(200).json({ status: true, msg: 'Tag updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Tag not found' });
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

export const deleteTag = async (req, res) => {
    try {
        await prisma.tag.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Tag deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Tag not found' });
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};
