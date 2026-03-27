import prisma from '../lib/prisma.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// Field mapping: icon_image→image, isActive→active, isShareActive→share
// Note: Mongoose model had `order` field — Social table in Prisma has no order/ord column.
// Dropped: order field (not in Prisma schema).

export const saveSocial = async (req, res) => {
    try {
        const { title, link, isActive, isShareActive, showInFooter, showInProduct, showInCategory } = req.body;
        if (!req.files || !req.files.icon_image) return res.status(400).json({ status: false, msg: 'Icon image is required!' });
        const iconPath = await saveFileLocal(req.files.icon_image, 'socials');
        await prisma.social.create({
            data: {
                title,
                link,
                image: iconPath,
                active: isActive === 'true',
                share: isShareActive === 'true',
                showInFooter: showInFooter === 'true',
                showInProduct: showInProduct === 'true',
                showInCategory: showInCategory === 'true'
            }
        });
        res.status(201).json({ status: true, msg: 'Social media added successfully!' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' || 'Server Error' });
    }
};

export const listSocials = async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const skip = (pageNum - 1) * pageSize;
        const [data, total] = await Promise.all([
            prisma.social.findMany({ orderBy: { id: 'desc' }, skip, take: pageSize }),
            prisma.social.count()
        ]);
        res.status(200).json({ status: true, data, total, totalPages: Math.ceil(total / pageSize), page: pageNum });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getSocialById = async (req, res) => {
    try {
        const data = await prisma.social.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!data) return res.status(404).json({ status: false, msg: 'Social media not found' });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateSocial = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const social = await prisma.social.findUnique({ where: { id } });
        if (!social) return res.status(404).json({ status: false, msg: 'Not found' });
        const updateData = {};
        if (req.body.title !== undefined) updateData.title = req.body.title;
        if (req.body.link !== undefined) updateData.link = req.body.link;
        if (req.body.isActive !== undefined) updateData.active = req.body.isActive === 'true';
        if (req.body.isShareActive !== undefined) updateData.share = req.body.isShareActive === 'true';
        if (req.body.showInFooter !== undefined) updateData.showInFooter = req.body.showInFooter === 'true';
        if (req.body.showInProduct !== undefined) updateData.showInProduct = req.body.showInProduct === 'true';
        if (req.body.showInCategory !== undefined) updateData.showInCategory = req.body.showInCategory === 'true';
        if (req.files && req.files.icon_image) {
            if (social.image) await deleteFileLocal(social.image);
            updateData.image = await saveFileLocal(req.files.icon_image, 'socials');
        }
        await prisma.social.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Social updated successfully!' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteSocial = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const social = await prisma.social.findUnique({ where: { id } });
        if (!social) return res.status(404).json({ status: false, msg: 'Social media not found' });
        if (social.image) await deleteFileLocal(social.image);
        await prisma.social.delete({ where: { id } });
        res.status(200).json({ status: true, msg: 'Social deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
