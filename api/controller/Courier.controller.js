import prisma from '../lib/prisma.js';

// Field mapping: isActive → active (Boolean in Prisma)

export const saveCourier = async (req, res) => {
    try {
        const { title, trackingPage, isActive, active } = req.body;
        if (!title || title.trim() === '') return res.status(400).json({ status: false, msg: 'Courier Title is required' });
        if (!trackingPage || trackingPage.trim() === '') return res.status(400).json({ status: false, msg: 'Tracking Page URL is required' });
        const cleanTitle = title.trim();
        const existing = await prisma.courier.findFirst({ where: { title: { equals: cleanTitle, mode: 'insensitive' } } });
        if (existing) return res.status(400).json({ status: false, msg: 'Courier partner already exists' });
        let activeStatus = true;
        if (isActive !== undefined) activeStatus = (isActive === true || isActive === 'true');
        else if (active !== undefined) activeStatus = (active === 'active');
        const newCourier = await prisma.courier.create({
            data: { title: cleanTitle, trackingPage: trackingPage.trim(), active: activeStatus }
        });
        res.status(201).json({ status: true, msg: 'Courier added successfully!', data: newCourier });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllCouriers = async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const skip = (pageNum - 1) * pageSize;
        const [couriers, total] = await Promise.all([
            prisma.courier.findMany({ orderBy: { title: 'asc' }, skip, take: pageSize }),
            prisma.courier.count()
        ]);
        res.status(200).json({ status: true, data: couriers, total, totalPages: Math.ceil(total / pageSize), page: pageNum });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getCourierById = async (req, res) => {
    try {
        const courier = await prisma.courier.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!courier) return res.status(404).json({ status: false, msg: 'Courier not found' });
        res.status(200).json({ status: true, data: courier });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateCourier = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, trackingPage, isActive, active } = req.body;
        if (title) {
            const cleanTitle = title.trim();
            const existing = await prisma.courier.findFirst({ where: { title: { equals: cleanTitle, mode: 'insensitive' }, NOT: { id } } });
            if (existing) return res.status(400).json({ status: false, msg: 'Another courier already has this name.' });
        }
        let activeStatus = undefined;
        if (isActive !== undefined) activeStatus = (isActive === true || isActive === 'true');
        else if (active !== undefined) activeStatus = (active === 'active');
        const updated = await prisma.courier.update({
            where: { id },
            data: {
                ...(title && { title: title.trim() }),
                ...(trackingPage && { trackingPage: trackingPage.trim() }),
                ...(activeStatus !== undefined && { active: activeStatus })
            }
        });
        res.status(200).json({ status: true, msg: 'Courier updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Courier not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteCourier = async (req, res) => {
    try {
        await prisma.courier.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Courier deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Courier not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
