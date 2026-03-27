import prisma from '../lib/prisma.js';

// Field mapping: content→pageContent, meta_title→metaTitle,
// meta_description→metaDesc, meta_keywords→metaKeywords.

export const getTerms = async (req, res) => {
    try {
        let data = await prisma.terms.findFirst();
        if (!data) {
            data = await prisma.terms.create({ data: { title: 'Terms of Use' } });
        }
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateTerms = async (req, res) => {
    try {
        const { title, content, pageContent, meta_title, metaTitle, meta_description, metaDesc, meta_keywords, metaKeywords } = req.body;
        const payload = {
            title: title || 'Terms of Use',
            pageContent: pageContent || content || '',
            metaTitle: metaTitle || meta_title || '',
            metaDesc: metaDesc || meta_description || '',
            metaKeywords: metaKeywords || meta_keywords || ''
        };
        const first = await prisma.terms.findFirst();
        let updated;
        if (first) {
            updated = await prisma.terms.update({ where: { id: first.id }, data: payload });
        } else {
            updated = await prisma.terms.create({ data: payload });
        }
        res.status(200).json({ status: true, msg: 'Terms of Use updated!', data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
