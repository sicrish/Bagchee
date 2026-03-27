import prisma from '../lib/prisma.js';

// Coupon: active is Boolean (old Mongoose had string 'active'/'inactive').
// code is @unique in schema — P2002 handles duplicates on create.
// Fields explicitly mapped from Prisma Coupon schema.

const parseBool = (v) => v === true || v === 'true' || v === '1';

export const saveCoupon = async (req, res) => {
    try {
        const { code, title, validFrom, validTo, active, fixAmount, amount,
            minimumBuy, priceOverOnly, newCustomerOnly, membersOnly, nextOrderOnly,
            bestsellerOnly, recommendedOnly, newArrivalsOnly, getThirdFree } = req.body;

        if (!code || code.trim() === '') {
            return res.status(400).json({ status: false, msg: 'Coupon Code is required.' });
        }
        if (!validFrom || !validTo) {
            return res.status(400).json({ status: false, msg: 'validFrom and validTo are required.' });
        }
        const fromDate = new Date(validFrom);
        const toDate   = new Date(validTo);
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return res.status(400).json({ status: false, msg: 'Invalid date format.' });
        }
        if (toDate <= fromDate) {
            return res.status(400).json({ status: false, msg: 'validTo must be after validFrom.' });
        }
        const cleanCode = code.trim().toUpperCase();

        const newCoupon = await prisma.coupon.create({
            data: {
                code: cleanCode,
                title: title || '',
                validFrom: fromDate,
                validTo: toDate,
                active: parseBool(active),
                fixAmount: parseBool(fixAmount),
                amount: Number(amount) || 0,
                minimumBuy: Number(minimumBuy) || 0,
                priceOverOnly: Number(priceOverOnly) || 0,
                newCustomerOnly: parseBool(newCustomerOnly),
                membersOnly: parseBool(membersOnly),
                nextOrderOnly: parseBool(nextOrderOnly),
                bestsellerOnly: parseBool(bestsellerOnly),
                recommendedOnly: parseBool(recommendedOnly),
                newArrivalsOnly: parseBool(newArrivalsOnly),
                getThirdFree: parseBool(getThirdFree)
            }
        });
        res.status(201).json({ status: true, msg: 'Coupon created successfully!', data: newCoupon });
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ status: false, msg: 'Coupon Code already exists.' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllCoupons = async (req, res) => {
    try {
        const pageNum = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.max(1, parseInt(req.query.limit) || 25);
        const skip = (pageNum - 1) * pageSize;
        const [coupons, total] = await Promise.all([
            prisma.coupon.findMany({ orderBy: { id: 'desc' }, skip, take: pageSize }),
            prisma.coupon.count()
        ]);
        res.status(200).json({
            status: true, data: coupons, total,
            page: pageNum, limit: pageSize,
            totalPages: Math.ceil(total / pageSize)
        });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getActiveCoupons = async (req, res) => {
    try {
        const now = new Date();
        const coupons = await prisma.coupon.findMany({
            where: { active: true, validFrom: { lte: now }, validTo: { gte: now } },
            select: { id: true, code: true, amount: true, fixAmount: true }
        });
        res.status(200).json({ status: true, data: coupons });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getCouponById = async (req, res) => {
    try {
        const coupon = await prisma.coupon.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!coupon) return res.status(404).json({ status: false, msg: 'Coupon not found' });
        res.status(200).json({ status: true, data: coupon });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateCoupon = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { code, title, validFrom, validTo, active, fixAmount, amount,
            minimumBuy, priceOverOnly, newCustomerOnly, membersOnly, nextOrderOnly,
            bestsellerOnly, recommendedOnly, newArrivalsOnly, getThirdFree } = req.body;

        const updateData = {};

        if (code) {
            const cleanCode = code.trim().toUpperCase();
            // Check duplicate code against other coupons
            const existing = await prisma.coupon.findFirst({ where: { code: cleanCode, NOT: { id } } });
            if (existing) return res.status(400).json({ status: false, msg: 'This Coupon Code is already in use.' });
            updateData.code = cleanCode;
        }
        if (title !== undefined) updateData.title = title;
        if (validFrom) {
            const d = new Date(validFrom);
            if (isNaN(d.getTime())) return res.status(400).json({ status: false, msg: 'Invalid validFrom date.' });
            updateData.validFrom = d;
        }
        if (validTo) {
            const d = new Date(validTo);
            if (isNaN(d.getTime())) return res.status(400).json({ status: false, msg: 'Invalid validTo date.' });
            updateData.validTo = d;
        }
        if (updateData.validFrom && updateData.validTo && updateData.validTo <= updateData.validFrom) {
            return res.status(400).json({ status: false, msg: 'validTo must be after validFrom.' });
        }
        if (active !== undefined) updateData.active = parseBool(active);
        if (fixAmount !== undefined) updateData.fixAmount = parseBool(fixAmount);
        if (amount !== undefined) updateData.amount = Number(amount);
        if (minimumBuy !== undefined) updateData.minimumBuy = Number(minimumBuy);
        if (priceOverOnly !== undefined) updateData.priceOverOnly = Number(priceOverOnly);
        if (newCustomerOnly !== undefined) updateData.newCustomerOnly = parseBool(newCustomerOnly);
        if (membersOnly !== undefined) updateData.membersOnly = parseBool(membersOnly);
        if (nextOrderOnly !== undefined) updateData.nextOrderOnly = parseBool(nextOrderOnly);
        if (bestsellerOnly !== undefined) updateData.bestsellerOnly = parseBool(bestsellerOnly);
        if (recommendedOnly !== undefined) updateData.recommendedOnly = parseBool(recommendedOnly);
        if (newArrivalsOnly !== undefined) updateData.newArrivalsOnly = parseBool(newArrivalsOnly);
        if (getThirdFree !== undefined) updateData.getThirdFree = parseBool(getThirdFree);

        const updated = await prisma.coupon.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Coupon updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Coupon not found' });
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

export const deleteCoupon = async (req, res) => {
    try {
        await prisma.coupon.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Coupon deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Coupon not found' });
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};

// POST /coupons/apply
// Body: { code, cartTotal }
// Preview endpoint — validates coupon eligibility and returns discount info.
// NOTE: actual discount is always recalculated server-side in saveOrder.
// cartTotal here is only used to check minimumBuy eligibility and show estimated discount.
export const applyCoupon = async (req, res) => {
    try {
        const { code, cartTotal } = req.body;
        if (!code) return res.status(400).json({ status: false, msg: 'Coupon code is required' });

        const total = Math.max(0, Number(cartTotal) || 0);
        if (!total) return res.status(400).json({ status: false, msg: 'cartTotal is required' });

        const cleanCode = code.trim().toUpperCase();
        const coupon = await prisma.coupon.findUnique({ where: { code: cleanCode } });

        if (!coupon) return res.status(404).json({ status: false, msg: 'Invalid coupon code' });
        if (!coupon.active) return res.status(400).json({ status: false, msg: 'This coupon is not active' });

        const now = new Date();
        if (now < coupon.validFrom) return res.status(400).json({ status: false, msg: 'This coupon is not valid yet' });
        if (now > coupon.validTo)   return res.status(400).json({ status: false, msg: 'This coupon has expired' });

        if (coupon.minimumBuy > 0 && total < coupon.minimumBuy) {
            return res.status(400).json({
                status: false,
                msg: `Minimum cart value of ${coupon.minimumBuy} required for this coupon`
            });
        }

        // Estimated discount for UI display only — saveOrder recalculates this authoritatively
        const discount = coupon.fixAmount
            ? Math.min(coupon.amount, total)
            : Math.round((total * coupon.amount / 100) * 100) / 100;

        res.status(200).json({
            status: true,
            msg: 'Coupon applied successfully',
            data: {
                couponId:  coupon.id,
                code:      coupon.code,
                discount,
                fixAmount: coupon.fixAmount,
                amount:    coupon.amount,
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
