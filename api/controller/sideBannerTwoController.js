import prisma from '../lib/prisma.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// SideBannerTwo — identical schema to SideBannerOne: image1, link1, image2, link2, isActive, order.

export const saveBanner = async (req, res) => {
    try {
        const { link1, link2, isActive, order } = req.body;
        let image1Path = '';
        let image2Path = '';
        try {
            if (req.files?.image1) image1Path = await saveFileLocal(req.files.image1, 'side-banners');
            if (req.files?.image2) image2Path = await saveFileLocal(req.files.image2, 'side-banners');
        } catch (uploadError) {
            if (image1Path) await deleteFileLocal(image1Path);
            if (image2Path) await deleteFileLocal(image2Path);
            return res.status(400).json({ status: false, msg: 'Image upload failed: ' + uploadError.message });
        }
        const newBanner = await prisma.sideBannerTwo.create({
            data: { image1: image1Path, link1: link1 || '', image2: image2Path, link2: link2 || '', isActive: isActive === 'true' || isActive === true, order: Number(order) || 0 }
        });
        res.status(201).json({ status: true, msg: 'Side Banner 2 added successfully!', data: newBanner });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const listBanners = async (req, res) => {
    try {
        const data = await prisma.sideBannerTwo.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getBanner = async (req, res) => {
    try {
        const data = await prisma.sideBannerTwo.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!data) return res.status(404).json({ status: false, msg: 'Banner not found' });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateBanner = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { link1, link2, isActive, order } = req.body;
        const oldBanner = await prisma.sideBannerTwo.findUnique({ where: { id } });
        if (!oldBanner) return res.status(404).json({ status: false, msg: 'Banner not found' });
        const updateData = { link1: link1 ?? oldBanner.link1, link2: link2 ?? oldBanner.link2, isActive: isActive === 'true' || isActive === true, order: Number(order) || 0 };
        if (req.files?.image1) {
            updateData.image1 = await saveFileLocal(req.files.image1, 'side-banners');
            if (oldBanner.image1) await deleteFileLocal(oldBanner.image1);
        }
        if (req.files?.image2) {
            updateData.image2 = await saveFileLocal(req.files.image2, 'side-banners');
            if (oldBanner.image2) await deleteFileLocal(oldBanner.image2);
        }
        const updated = await prisma.sideBannerTwo.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Banner 2 updated successfully!', data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteBanner = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const banner = await prisma.sideBannerTwo.findUnique({ where: { id } });
        if (!banner) return res.status(404).json({ status: false, msg: 'Banner not found' });
        if (banner.image1) await deleteFileLocal(banner.image1);
        if (banner.image2) await deleteFileLocal(banner.image2);
        await prisma.sideBannerTwo.delete({ where: { id } });
        res.status(200).json({ status: true, msg: 'Banner deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
