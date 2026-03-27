import prisma from '../lib/prisma.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// Banner fields: title, description, buttonText, accentColor, bgImageName, overlayImageName, status.
// SCHEMA-CHECK: Completely redesigned schema — no generic image/link/active/order.
// status: String ('active'/'inactive'), not Boolean.

export const save = async (req, res) => {
    try {
        if (!req.files?.bgImage || !req.files?.overlayImage) {
            return res.status(400).json({ status: false, msg: 'Both Background and Overlay images are required' });
        }
        let bgPath = '';
        let overlayPath = '';
        try {
            bgPath = await saveFileLocal(req.files.bgImage, 'banners');
            overlayPath = await saveFileLocal(req.files.overlayImage, 'banners');
        } catch (uploadError) {
            if (bgPath) await deleteFileLocal(bgPath);
            return res.status(400).json({ status: false, msg: uploadError.message });
        }
        const banner = await prisma.banner.create({
            data: {
                title: req.body.title || '',
                description: req.body.description || '',
                buttonText: req.body.buttonText || 'Explore Now',
                accentColor: req.body.accentColor || 'bg-hero-primary',
                bgImageName: bgPath,
                overlayImageName: overlayPath,
                status: req.body.status || 'active'
            }
        });
        res.status(201).json({ status: true, msg: 'Banner added successfully', data: banner });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const fetch = async (req, res) => {
    try {
        const banners = await prisma.banner.findMany({ where: { status: 'active' }, orderBy: { createdAt: 'desc' } });
        if (banners.length === 0) return res.status(404).json({ status: false, msg: 'No active banners found' });
        res.status(200).json({ status: true, data: banners });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const list = async (req, res) => {
    try {
        const banners = await prisma.banner.findMany({ orderBy: { createdAt: 'desc' } });
        res.status(200).json({ status: true, data: banners });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getOne = async (req, res) => {
    try {
        const banner = await prisma.banner.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!banner) return res.status(404).json({ status: false, msg: 'Banner not found' });
        res.status(200).json({ status: true, data: banner });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateBanner = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const banner = await prisma.banner.findUnique({ where: { id } });
        if (!banner) return res.status(404).json({ status: false, msg: 'Banner not found' });
        const updateData = {};
        if (req.body.title !== undefined) updateData.title = req.body.title;
        if (req.body.description !== undefined) updateData.description = req.body.description;
        if (req.body.buttonText !== undefined) updateData.buttonText = req.body.buttonText;
        if (req.body.accentColor !== undefined) updateData.accentColor = req.body.accentColor;
        if (req.body.status !== undefined) updateData.status = req.body.status;
        if (req.files?.bgImage) {
            updateData.bgImageName = await saveFileLocal(req.files.bgImage, 'banners');
            if (banner.bgImageName) await deleteFileLocal(banner.bgImageName);
        }
        if (req.files?.overlayImage) {
            updateData.overlayImageName = await saveFileLocal(req.files.overlayImage, 'banners');
            if (banner.overlayImageName) await deleteFileLocal(banner.overlayImageName);
        }
        await prisma.banner.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Banner updated successfully' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteBanner = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const banner = await prisma.banner.findUnique({ where: { id } });
        if (!banner) return res.status(404).json({ status: false, msg: 'Banner not found' });
        if (banner.bgImageName) await deleteFileLocal(banner.bgImageName);
        if (banner.overlayImageName) await deleteFileLocal(banner.overlayImageName);
        await prisma.banner.delete({ where: { id } });
        res.status(200).json({ status: true, msg: 'Banner and associated files deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
