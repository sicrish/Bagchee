import prisma from '../lib/prisma.js';

// Note: Mongoose model had `categories` field — not in Prisma schema, dropped.
// Mongoose used `firstname`/`lastname` — Prisma uses `firstName`/`lastName`.

export const saveSubscriber = async (req, res) => {
    try {
        const { email, firstName, lastName, categories } = req.body;
        if (!email) return res.status(400).json({ status: false, msg: 'Email is required.' });

        const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ status: false, msg: 'Email already subscribed!' });

        const sub = await prisma.newsletterSubscriber.create({
            data: {
                email,
                firstName: firstName || '',
                lastName: lastName || '',
                categories: Array.isArray(categories) ? categories : []
            }
        });
        res.status(201).json({ status: true, msg: 'Subscribed successfully!', data: sub });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllSubscribers = async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 25;
        const skip = (pageNum - 1) * pageSize;

        const [subscribers, total] = await Promise.all([
            prisma.newsletterSubscriber.findMany({ orderBy: { id: 'desc' }, skip, take: pageSize }),
            prisma.newsletterSubscriber.count()
        ]);
        res.status(200).json({ status: true, data: subscribers, total, totalPages: Math.ceil(total / pageSize), page: pageNum });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getSubscriberById = async (req, res) => {
    try {
        const sub = await prisma.newsletterSubscriber.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!sub) return res.status(404).json({ status: false, msg: 'Subscriber not found' });
        res.status(200).json({ status: true, data: sub });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateSubscriber = async (req, res) => {
    try {
        const { email, firstName, lastName, categories } = req.body;
        const data = { email, firstName: firstName || '', lastName: lastName || '' };
        if (categories !== undefined) data.categories = Array.isArray(categories) ? categories : [];

        const updated = await prisma.newsletterSubscriber.update({
            where: { id: parseInt(req.params.id) },
            data
        });
        res.status(200).json({ status: true, msg: 'Subscriber updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Subscriber not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteSubscriber = async (req, res) => {
    try {
        await prisma.newsletterSubscriber.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Subscriber deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Subscriber not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
