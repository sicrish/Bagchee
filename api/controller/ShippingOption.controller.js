import prisma from '../lib/prisma.js';

// Field mapping: max_day_limit→maxDayLimit, price_usd→priceUsd, price_eur→priceEur,
// price_inr→priceInr, order→ord, isActive/active('yes'/'no')→active(Boolean)
// displayOrder from old Mongoose model is now just `ord` in Prisma

export const saveShippingOption = async (req, res) => {
    try {
        const data = req.body;
        if (!data.title) return res.status(400).json({ status: false, msg: 'Title is required' });
        let activeStatus = true;
        if (data.active === 'yes') activeStatus = true;
        else if (data.active === 'no') activeStatus = false;
        else if (data.isActive !== undefined) activeStatus = (data.isActive === true || data.isActive === 'true');
        const newOption = await prisma.shippingOption.create({
            data: {
                title: data.title,
                maxDayLimit: Number(data.max_day_limit) || 0,
                priceUsd: Number(data.price_usd) || 0,
                priceEur: Number(data.price_eur) || 0,
                priceInr: Number(data.price_inr) || 0,
                ord: Number(data.order) || 0,
                active: activeStatus
            }
        });
        res.status(201).json({ status: true, msg: 'Shipping Option added successfully!', data: newOption });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllShippingOptions = async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const skip = (pageNum - 1) * pageSize;
        const [list, total] = await Promise.all([
            prisma.shippingOption.findMany({ orderBy: { ord: 'asc' }, skip, take: pageSize }),
            prisma.shippingOption.count()
        ]);
        res.status(200).json({ status: true, data: list, total, totalPages: Math.ceil(total / pageSize), page: pageNum });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getShippingOptionById = async (req, res) => {
    try {
        const option = await prisma.shippingOption.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!option) return res.status(404).json({ status: false, msg: 'Shipping option not found' });
        res.status(200).json({ status: true, data: option });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateShippingOption = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = req.body;
        const updateData = {};
        if (data.title) updateData.title = data.title;
        if (data.max_day_limit !== undefined) updateData.maxDayLimit = Number(data.max_day_limit);
        if (data.price_usd !== undefined) updateData.priceUsd = Number(data.price_usd);
        if (data.price_eur !== undefined) updateData.priceEur = Number(data.price_eur);
        if (data.price_inr !== undefined) updateData.priceInr = Number(data.price_inr);
        if (data.order !== undefined) updateData.ord = Number(data.order);
        if (data.active === 'yes') updateData.active = true;
        else if (data.active === 'no') updateData.active = false;
        else if (data.isActive !== undefined) updateData.active = (data.isActive === true || data.isActive === 'true');
        const updated = await prisma.shippingOption.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Shipping option updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Shipping option not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteShippingOption = async (req, res) => {
    try {
        await prisma.shippingOption.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Shipping option deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Shipping option not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
