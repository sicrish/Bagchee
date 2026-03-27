import prisma from '../lib/prisma.js';

// HomeSection fields: section(@unique), title, tagline.
// Note: Mongoose used error.code 11000 for unique violations — Prisma uses P2002.
// bulkUpdateSections: accepts items with either `id` or `_id` for backward compat.

export const getSections = async (req, res) => {
    try {
        const sections = await prisma.homeSection.findMany({ orderBy: { section: 'asc' } });
        res.json({ status: true, data: sections });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getSectionById = async (req, res) => {
    try {
        const section = await prisma.homeSection.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!section) return res.status(404).json({ status: false, msg: 'Not Found' });
        res.json({ status: true, data: section });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Invalid ID' });
    }
};

export const saveSection = async (req, res) => {
    try {
        const { section, title, tagline } = req.body;
        const newSection = await prisma.homeSection.create({ data: { section, title, tagline: tagline || '' } });
        res.json({ status: true, msg: 'Section added successfully', data: newSection });
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ status: false, msg: 'Section name already exists' });
        res.status(500).json({ status: false, msg: 'Failed to save' });
    }
};

export const updateSection = async (req, res) => {
    try {
        const { section, title, tagline } = req.body;
        const updateData = {};
        if (section !== undefined) updateData.section = section;
        if (title !== undefined) updateData.title = title;
        if (tagline !== undefined) updateData.tagline = tagline;
        await prisma.homeSection.update({ where: { id: parseInt(req.params.id) }, data: updateData });
        res.json({ status: true, msg: 'Section updated' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Not found' });
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

export const bulkUpdateSections = async (req, res) => {
    try {
        const { sections } = req.body;
        const promises = sections.map(item =>
            prisma.homeSection.update({
                where: { id: item.id || item._id },
                data: { title: item.title, tagline: item.tagline }
            })
        );
        await Promise.all(promises);
        res.json({ status: true, msg: 'Bulk update successful' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Bulk update failed' });
    }
};

export const deleteSection = async (req, res) => {
    try {
        await prisma.homeSection.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ status: true, msg: 'Section deleted' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Not found' });
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};
