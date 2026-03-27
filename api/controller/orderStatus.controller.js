import prisma from '../lib/prisma.js';

// Note: Mongoose model had `description` and `isActive` fields.
// Prisma schema only has `name`. Those extra fields are ignored.

export const createOrderStatus = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ status: false, msg: 'Status Name is required.' });
        }
        const cleanName = name.trim();

        const existing = await prisma.orderStatus.findFirst({
            where: { name: { equals: cleanName, mode: 'insensitive' } }
        });
        if (existing) return res.status(400).json({ status: false, msg: 'Order Status with this name already exists.' });

        const status = await prisma.orderStatus.create({ data: { name: cleanName } });
        res.status(201).json({ status: true, msg: 'Order Status added successfully!', data: status });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllOrderStatus = async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const skip = (pageNum - 1) * pageSize;

        const [statuses, total] = await Promise.all([
            prisma.orderStatus.findMany({ orderBy: { name: 'asc' }, skip, take: pageSize }),
            prisma.orderStatus.count()
        ]);
        res.status(200).json({ status: true, data: statuses, total, totalPages: Math.ceil(total / pageSize), page: pageNum });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getOrderStatusById = async (req, res) => {
    try {
        const data = await prisma.orderStatus.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!data) return res.status(404).json({ status: false, msg: 'Status not found' });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ status: false, msg: 'Status Name is required.' });
        }
        const cleanName = name.trim();

        const existing = await prisma.orderStatus.findFirst({
            where: { name: { equals: cleanName, mode: 'insensitive' }, NOT: { id } }
        });
        if (existing) return res.status(400).json({ status: false, msg: 'Order Status with this name already exists.' });

        const updated = await prisma.orderStatus.update({ where: { id }, data: { name: cleanName } });
        res.status(200).json({ status: true, msg: 'Order Status updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Status not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteOrderStatus = async (req, res) => {
    try {
        await prisma.orderStatus.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Order Status deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Status not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
