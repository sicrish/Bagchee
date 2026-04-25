import prisma from '../lib/prisma.js';

// Field mapping: content→pageContent, meta_title→metaTitle,
// meta_description→metaDesc, meta_keywords→metaKeywords.
// Dropped: slug, status (not in Prisma HelpPage schema).

export const saveHelpPage = async (req, res) => {
    try {
        const { title, content, meta_title, meta_description, meta_keywords } = req.body;
        if (!title || !content) return res.status(400).json({ status: false, msg: 'Title and Content are required.' });
        const newPage = await prisma.helpPage.create({
            data: {
                title: title.trim(),
                pageContent: content,
                metaTitle: meta_title || title.trim(),
                metaDesc: meta_description || '',
                metaKeywords: meta_keywords || ''
            }
        });
        res.status(201).json({ status: true, msg: 'Help page added successfully!', data: newPage });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllHelpPages = async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 100;
        const skip = (pageNum - 1) * pageSize;
        const [pages, total] = await Promise.all([
            prisma.helpPage.findMany({ orderBy: { id: 'asc' }, skip, take: pageSize }),
            prisma.helpPage.count()
        ]);
        res.status(200).json({ status: true, data: pages, total, totalPages: Math.ceil(total / pageSize), page: pageNum });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getHelpPageById = async (req, res) => {
    try {
        const page = await prisma.helpPage.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!page) return res.status(404).json({ status: false, msg: 'Page not found' });
        res.status(200).json({ status: true, data: page });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateHelpPage = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, content, meta_title, meta_description, meta_keywords } = req.body;
        const updateData = {};
        if (title) updateData.title = title.trim();
        if (content !== undefined) updateData.pageContent = content;
        if (meta_title !== undefined) updateData.metaTitle = meta_title;
        if (meta_description !== undefined) updateData.metaDesc = meta_description;
        if (meta_keywords !== undefined) updateData.metaKeywords = meta_keywords;
        const updated = await prisma.helpPage.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Help page updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Page not found' });
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

export const deleteHelpPage = async (req, res) => {
    try {
        await prisma.helpPage.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Help page deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Page not found' });
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};
