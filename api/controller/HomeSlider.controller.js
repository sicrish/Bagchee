import prisma from '../lib/prisma.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// Fields already match Prisma schema: desktopImage, mobileImage, link, isActive, order.

export const save = async (req, res) => {
    try {
        const { link, isActive, order } = req.body;
        const desktopFile = req.files?.desktopImage;
        const mobileFile = req.files?.mobileImage;
        if (!desktopFile || !mobileFile) return res.status(400).json({ status: false, msg: 'Both Desktop and Mobile images are required' });
        let desktopPath = '', mobilePath = '';
        try {
            desktopPath = await saveFileLocal(desktopFile, 'homesliders');
            mobilePath = await saveFileLocal(mobileFile, 'homesliders');
        } catch (uploadError) { return res.status(400).json({ status: false, msg: uploadError.message }); }
        const newSlider = await prisma.homeSlider.create({
            data: {
                desktopImage: desktopPath,
                mobileImage: mobilePath,
                link: link || '',
                isActive: isActive === 'true' || isActive === 'yes' || isActive === true,
                order: Number(order) || 0
            }
        });
        res.status(201).json({ status: true, msg: 'Slider added successfully', data: newSlider });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const update = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { link, isActive, order } = req.body;
        const slider = await prisma.homeSlider.findUnique({ where: { id } });
        if (!slider) return res.status(404).json({ status: false, msg: 'Slider not found' });
        const updateData = {};
        if (link !== undefined) updateData.link = link;
        if (isActive !== undefined) updateData.isActive = (isActive === 'true' || isActive === 'yes' || isActive === true);
        if (order !== undefined) updateData.order = Number(order);
        if (req.files?.desktopImage) {
            const newPath = await saveFileLocal(req.files.desktopImage, 'homesliders');
            if (newPath) { if (slider.desktopImage) await deleteFileLocal(slider.desktopImage); updateData.desktopImage = newPath; }
        }
        if (req.files?.mobileImage) {
            const newPath = await saveFileLocal(req.files.mobileImage, 'homesliders');
            if (newPath) { if (slider.mobileImage) await deleteFileLocal(slider.mobileImage); updateData.mobileImage = newPath; }
        }
        await prisma.homeSlider.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Slider updated successfully' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const remove = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const slider = await prisma.homeSlider.findUnique({ where: { id } });
        if (!slider) return res.status(404).json({ status: false, msg: 'Slider not found' });
        if (slider.desktopImage) await deleteFileLocal(slider.desktopImage);
        if (slider.mobileImage) await deleteFileLocal(slider.mobileImage);
        await prisma.homeSlider.delete({ where: { id } });
        res.status(200).json({ status: true, msg: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Error deleting' });
    }
};

export const list = async (req, res) => {
    try {
        const { link, isActive, order, page, limit } = req.query;
        const where = {};
        if (link) where.link = { contains: link, mode: 'insensitive' };
        if (isActive && isActive !== '') where.isActive = (isActive === 'yes' || isActive === 'true');
        if (order) where.order = Number(order);
        const pageNum = Number(page) || 1;
        const pageSize = limit === 'all' ? 100000 : (Number(limit) || 25);
        const skip = (pageNum - 1) * pageSize;
        const [sliders, total] = await Promise.all([
            prisma.homeSlider.findMany({ where, orderBy: { order: 'asc' }, skip, take: pageSize }),
            prisma.homeSlider.count({ where })
        ]);
        res.status(200).json({ status: true, data: sliders, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getOne = async (req, res) => {
    try {
        const slider = await prisma.homeSlider.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!slider) return res.status(404).json({ status: false, msg: 'Slider not found' });
        res.status(200).json({ status: true, data: slider });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
