import prisma from '../lib/prisma.js';

export const getDisclaimer = async (req, res) => {
    try {
        let data = await prisma.disclaimer.findFirst();
        if (!data) {
            data = await prisma.disclaimer.create({ data: { title: 'Disclaimer' } });
        }
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateDisclaimer = async (req, res) => {
    try {
        const { title, content, pageContent, meta_title, metaTitle, meta_description, metaDesc, meta_keywords, metaKeywords } = req.body;
        const payload = {
            title: title || 'Disclaimer',
            pageContent: pageContent || content || '',
            metaTitle: metaTitle || meta_title || '',
            metaDesc: metaDesc || meta_description || '',
            metaKeywords: metaKeywords || meta_keywords || '',
        };
        const first = await prisma.disclaimer.findFirst();
        let updated;
        if (first) {
            updated = await prisma.disclaimer.update({ where: { id: first.id }, data: payload });
        } else {
            updated = await prisma.disclaimer.create({ data: payload });
        }
        res.status(200).json({ status: true, msg: 'Disclaimer updated!', data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
