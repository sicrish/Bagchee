import prisma from '../lib/prisma.js';

// GET /meta-tags/list
export const listMetaTags = async (req, res) => {
    try {
        const { page = 1, limit = 25, pageUrl = '', title = '', metaTitle = '' } = req.query;
        const pageNum  = Math.max(1, parseInt(page));
        const pageSize = Math.min(100000, Math.max(1, parseInt(limit)));
        const skip     = (pageNum - 1) * pageSize;

        const where = {
            ...(pageUrl   && { pageUrl:    { contains: pageUrl,   mode: 'insensitive' } }),
            ...(title     && { title:      { contains: title,     mode: 'insensitive' } }),
            ...(metaTitle && { metaTitle:  { contains: metaTitle, mode: 'insensitive' } }),
        };

        const [data, total] = await Promise.all([
            prisma.metaTag.findMany({ where, skip, take: pageSize, orderBy: { id: 'desc' } }),
            prisma.metaTag.count({ where })
        ]);

        res.json({ status: true, data, total, totalPages: Math.ceil(total / pageSize), page: pageNum });
    } catch (error) {
        console.error('MetaTag list error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// GET /meta-tags/get/:id
export const getMetaTag = async (req, res) => {
    try {
        const item = await prisma.metaTag.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!item) return res.status(404).json({ status: false, msg: 'Not found' });
        res.json({ status: true, data: item });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// POST /meta-tags/save
export const saveMetaTag = async (req, res) => {
    try {
        const { id, pageUrl, title, metaTitle, metaDesc, metaKeywords } = req.body;
        if (!pageUrl) return res.status(400).json({ status: false, msg: 'Page URL is required.' });

        const data = {
            pageUrl:      pageUrl.trim(),
            title:        title?.trim()        || '',
            metaTitle:    metaTitle?.trim()    || '',
            metaDesc:     metaDesc?.trim()     || '',
            metaKeywords: metaKeywords?.trim() || '',
        };

        let item;
        if (id) {
            item = await prisma.metaTag.update({ where: { id: parseInt(id) }, data });
        } else {
            item = await prisma.metaTag.create({ data });
        }

        res.status(id ? 200 : 201).json({ status: true, msg: id ? 'Updated successfully!' : 'Saved successfully!', data: item });
    } catch (error) {
        console.error('MetaTag save error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// GET /meta-tags/page?url=/some-page  (PUBLIC — used by frontend to inject meta tags)
export const getMetaTagByPage = async (req, res) => {
    try {
        const pageUrl = (req.query.url || '').trim();
        if (!pageUrl) return res.json({ status: true, data: null });

        const item = await prisma.metaTag.findFirst({
            where: { pageUrl: { equals: pageUrl, mode: 'insensitive' } }
        });
        res.json({ status: true, data: item || null });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// DELETE /meta-tags/delete/:id
export const deleteMetaTag = async (req, res) => {
    try {
        await prisma.metaTag.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ status: true, msg: 'Deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
