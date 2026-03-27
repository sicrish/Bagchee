import prisma from '../lib/prisma.js';

export const saveSeries = async (req, res) => {
    try {
        const { title } = req.body;
        if (!title || title.trim() === '') {
            return res.status(400).json({ status: false, msg: 'Title is required.' });
        }
        const cleanTitle = title.trim();

        const existing = await prisma.series.findFirst({
            where: { title: { equals: cleanTitle, mode: 'insensitive' } }
        });
        if (existing) return res.status(400).json({ status: false, msg: 'Series with this title already exists.' });

        const series = await prisma.series.create({ data: { title: cleanTitle } });
        res.status(201).json({ status: true, msg: 'Series added successfully!', data: series });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllSeries = async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const skip = (pageNum - 1) * pageSize;

        const [seriesList, total] = await Promise.all([
            prisma.series.findMany({ orderBy: { id: 'desc' }, skip, take: pageSize }),
            prisma.series.count()
        ]);
        res.status(200).json({ status: true, data: seriesList, total, totalPages: Math.ceil(total / pageSize), page: pageNum });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getSeriesById = async (req, res) => {
    try {
        const series = await prisma.series.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!series) return res.status(404).json({ status: false, msg: 'Series not found' });
        res.status(200).json({ status: true, data: series });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateSeries = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title } = req.body;
        if (!title || title.trim() === '') {
            return res.status(400).json({ status: false, msg: 'Title cannot be empty.' });
        }
        const cleanTitle = title.trim();

        const existing = await prisma.series.findFirst({
            where: { title: { equals: cleanTitle, mode: 'insensitive' }, NOT: { id } }
        });
        if (existing) return res.status(400).json({ status: false, msg: 'Series title already exists.' });

        const updated = await prisma.series.update({ where: { id }, data: { title: cleanTitle } });
        res.status(200).json({ status: true, msg: 'Series updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Series not found' });
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

export const deleteSeries = async (req, res) => {
    try {
        await prisma.series.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Series deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Series not found' });
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};
