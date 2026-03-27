import prisma from '../lib/prisma.js';

// Field mapping: content→pageContent, meta_title→metaTitle,
// meta_description→metaDesc, meta_keywords→metaKeywords.

export const getData = async (req, res) => {
    try {
        const data = await prisma.authorsPublishers.findFirst();
        if (!data) return res.status(404).json({ status: false, msg: 'No record found' });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateData = async (req, res) => {
    try {
        const { title, content, pageContent, meta_title, metaTitle, meta_description, metaDesc, meta_keywords, metaKeywords } = req.body;
        const payload = {
            title: title || 'Authors & Publishers',
            pageContent: pageContent || content || '',
            metaTitle: metaTitle || meta_title || '',
            metaDesc: metaDesc || meta_description || '',
            metaKeywords: metaKeywords || meta_keywords || ''
        };
        const first = await prisma.authorsPublishers.findFirst();
        let updated;
        if (first) {
            updated = await prisma.authorsPublishers.update({ where: { id: first.id }, data: payload });
        } else {
            updated = await prisma.authorsPublishers.create({ data: payload });
        }
        res.status(200).json({ status: true, msg: 'Data updated successfully!', data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
