import prisma from '../lib/prisma.js';

// Prisma fields: title, boxDesc, pageContent, pageTitle, metaTitle, metaDesc, metaKeywords.
// Accepts both camelCase and snake_case from frontend for compatibility.

export const saveService = async (req, res) => {
    try {
        const b = req.body;
        if (!b.title) return res.status(400).json({ status: false, msg: 'Title is required.' });
        const newService = await prisma.service.create({
            data: {
                title: b.title,
                boxDesc: b.boxDesc || b.box_desc || '',
                pageContent: b.pageContent || b.page_content || '',
                pageTitle: b.pageTitle || b.page_title || '',
                metaTitle: b.metaTitle || b.meta_title || '',
                metaDesc: b.metaDesc || b.meta_description || '',
                metaKeywords: b.metaKeywords || b.meta_keywords || ''
            }
        });
        res.status(201).json({ status: true, msg: 'Service added successfully!', data: newService });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const listServices = async (req, res) => {
    try {
        const data = await prisma.service.findMany({ orderBy: { id: 'desc' } });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getService = async (req, res) => {
    try {
        const data = await prisma.service.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!data) return res.status(404).json({ status: false, msg: 'Service not found' });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateService = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const b = req.body;
        const updateData = {};
        if (b.title !== undefined) updateData.title = b.title;
        if (b.boxDesc !== undefined || b.box_desc !== undefined) updateData.boxDesc = b.boxDesc ?? b.box_desc;
        if (b.pageContent !== undefined || b.page_content !== undefined) updateData.pageContent = b.pageContent ?? b.page_content;
        if (b.pageTitle !== undefined || b.page_title !== undefined) updateData.pageTitle = b.pageTitle ?? b.page_title;
        if (b.metaTitle !== undefined || b.meta_title !== undefined) updateData.metaTitle = b.metaTitle ?? b.meta_title;
        if (b.metaDesc !== undefined || b.meta_description !== undefined) updateData.metaDesc = b.metaDesc ?? b.meta_description;
        if (b.metaKeywords !== undefined || b.meta_keywords !== undefined) updateData.metaKeywords = b.metaKeywords ?? b.meta_keywords;
        const updated = await prisma.service.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Service updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Service not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteService = async (req, res) => {
    try {
        await prisma.service.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Service deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Service not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
