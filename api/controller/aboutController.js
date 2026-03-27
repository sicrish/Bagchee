import prisma from '../lib/prisma.js';

// Field mapping: content→pageContent, meta_title→metaTitle,
// meta_description→metaDesc, meta_keywords→metaKeywords.
// Pattern: single-record upsert (find first, update or create).

export const getAboutUs = async (req, res) => {
    try {
        let data = await prisma.about.findFirst();
        if (!data) {
            data = await prisma.about.create({ data: { title: 'About Us' } });
        }
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateAboutUs = async (req, res) => {
    try {
        const { title, content, pageContent, meta_title, metaTitle, meta_description, metaDesc, meta_keywords, metaKeywords } = req.body;
        const payload = {
            title: title || 'About Us',
            pageContent: pageContent || content || '',
            metaTitle: metaTitle || meta_title || '',
            metaDesc: metaDesc || meta_description || '',
            metaKeywords: metaKeywords || meta_keywords || ''
        };
        const first = await prisma.about.findFirst();
        let updated;
        if (first) {
            updated = await prisma.about.update({ where: { id: first.id }, data: payload });
        } else {
            updated = await prisma.about.create({ data: payload });
        }
        res.status(200).json({ status: true, msg: 'About Us updated!', data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
