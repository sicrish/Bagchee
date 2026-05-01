import prisma from '../lib/prisma.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

export const save = async (req, res) => {
    try {
        if (!req.files?.desktopImage) {
            return res.status(400).json({ status: false, msg: 'Desktop image is required' });
        }
        let desktopPath = '';
        let mobilePath = '';
        try {
            desktopPath = await saveFileLocal(req.files.desktopImage, 'e-gift-card-banners');
            if (req.files?.mobileImage) {
                mobilePath = await saveFileLocal(req.files.mobileImage, 'e-gift-card-banners');
            }
        } catch (uploadError) {
            if (desktopPath) await deleteFileLocal(desktopPath);
            return res.status(400).json({ status: false, msg: uploadError.message });
        }
        const banner = await prisma.eGiftCardBanner.create({
            data: {
                desktopImage: desktopPath,
                mobileImage: mobilePath,
                isActive: req.body.isActive === 'true' || req.body.isActive === true,
                order: parseInt(req.body.order) || 0,
            }
        });
        res.status(201).json({ status: true, msg: 'Banner added successfully', data: banner });
    } catch (error) {
        console.error('eGiftCardBanner save error:', error);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const list = async (req, res) => {
    try {
        const { isActive, limit } = req.query;
        const where = {};
        if (isActive === 'true') where.isActive = true;
        if (isActive === 'false') where.isActive = false;

        const banners = await prisma.eGiftCardBanner.findMany({
            where,
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            ...(limit !== 'all' && req.query.page ? {
                skip: (parseInt(req.query.page) - 1) * parseInt(limit || 25),
                take: parseInt(limit || 25),
            } : {}),
        });
        res.status(200).json({ status: true, data: banners });
    } catch (error) {
        console.error('eGiftCardBanner list error:', error);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getOne = async (req, res) => {
    try {
        const banner = await prisma.eGiftCardBanner.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!banner) return res.status(404).json({ status: false, msg: 'Banner not found' });
        res.status(200).json({ status: true, data: banner });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateBanner = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const banner = await prisma.eGiftCardBanner.findUnique({ where: { id } });
        if (!banner) return res.status(404).json({ status: false, msg: 'Banner not found' });

        const updateData = {};
        if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive === 'true' || req.body.isActive === true;
        if (req.body.order !== undefined) updateData.order = parseInt(req.body.order) || 0;

        if (req.files?.desktopImage) {
            updateData.desktopImage = await saveFileLocal(req.files.desktopImage, 'e-gift-card-banners');
            if (banner.desktopImage) await deleteFileLocal(banner.desktopImage);
        }
        if (req.files?.mobileImage) {
            updateData.mobileImage = await saveFileLocal(req.files.mobileImage, 'e-gift-card-banners');
            if (banner.mobileImage) await deleteFileLocal(banner.mobileImage);
        }

        const updated = await prisma.eGiftCardBanner.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Banner updated successfully', data: updated });
    } catch (error) {
        console.error('eGiftCardBanner update error:', error);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteBanner = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const banner = await prisma.eGiftCardBanner.findUnique({ where: { id } });
        if (!banner) return res.status(404).json({ status: false, msg: 'Banner not found' });
        if (banner.desktopImage) await deleteFileLocal(banner.desktopImage);
        if (banner.mobileImage) await deleteFileLocal(banner.mobileImage);
        await prisma.eGiftCardBanner.delete({ where: { id } });
        res.status(200).json({ status: true, msg: 'Banner deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
