import prisma from '../lib/prisma.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Coupon type values:
//   percent_order       — % off entire order
//   percent_section     — % off qualifying section items (bestseller/new arrivals/books of month/recommended)
//   flat_amount         — fixed $ amount off
//   tiered              — amount varies by order total (tier1: amount, tier2: tier2Amount when total >= tier2MinOrder)
//   buy3get1            — cheapest item free when 3+ distinct item quantities
//   new_customer_percent — % off for new customers only
//   member_percent      — % off for members only

const parseBool  = (v) => v === true || v === 'true' || v === '1' || v === 'active';
const parseFloat2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

// ── Shared field extractor ────────────────────────────────────────────────────
const extractFields = (body) => ({
    code:             (body.code || body.coupon_code || '').trim().toUpperCase(),
    title:            body.title || '',
    couponType:       body.couponType || body.coupon_type || 'percent_order',
    validFrom:        body.validFrom || body.valid_from || null,
    validTo:          body.validTo   || body.valid_to   || null,
    active:           parseBool(body.active),
    fixAmount:        parseBool(body.fix_amount || body.fixAmount),
    amount:           parseFloat2(body.amount),
    flatDeduction:    parseFloat2(body.flatDeduction || body.flat_deduction),
    minimumBuy:       parseFloat2(body.minimumBuy   || body.minimum_buy),
    priceOverOnly:    parseFloat2(body.priceOverOnly || body.price_over_only),
    tier2MinOrder:    parseFloat2(body.tier2MinOrder || body.tier2_min_order),
    tier2Amount:      parseFloat2(body.tier2Amount   || body.tier2_amount),
    newCustomerOnly:  parseBool(body.newCustomerOnly  || body.new_customer_only),
    membersOnly:      parseBool(body.membersOnly      || body.members_only),
    nextOrderOnly:    parseBool(body.nextOrderOnly    || body.next_order_only),
    bestsellerOnly:   parseBool(body.bestsellerOnly   || body.bestseller_only),
    recommendedOnly:  parseBool(body.recommendedOnly  || body.recommended_only),
    newArrivalsOnly:  parseBool(body.newArrivalsOnly  || body.new_arrivals_only),
    booksOfMonthOnly: parseBool(body.booksOfMonthOnly || body.books_of_month_only),
    getThirdFree:     parseBool(body.getThirdFree     || body.get_third_free),
});

// ── Discount calculator (shared by applyCoupon + saveOrder) ─────────────────
// cartItems: [{ price: number, quantity: number }]  (optional, needed for buy3get1)
export const calcDiscount = (coupon, cartTotal, cartItems = []) => {
    const total = Math.max(0, Number(cartTotal) || 0);
    const type  = coupon.couponType || 'percent_order';
    let discount = 0;

    switch (type) {
        case 'percent_order':
        case 'percent_section':
        case 'new_customer_percent':
        case 'member_percent':
            // amount is a percentage
            discount = Math.round((total * (coupon.amount / 100)) * 100) / 100;
            break;

        case 'flat_amount':
            // flatDeduction is the fixed $ off; amount is also accepted for legacy
            discount = Math.min(coupon.flatDeduction || coupon.amount || 0, total);
            break;

        case 'tiered':
            if (coupon.tier2MinOrder > 0 && total >= coupon.tier2MinOrder) {
                // Tier 2: higher discount for bigger orders
                discount = coupon.tier2Amount > 0
                    ? (coupon.tier2Amount <= 100 && String(coupon.tier2Amount).includes('.') === false && coupon.tier2Amount <= total
                        ? coupon.tier2Amount   // treat as flat if it's a whole number and <= total
                        : Math.round((total * (coupon.tier2Amount / 100)) * 100) / 100)
                    : 0;
                // Simple rule: if tier2Amount > 100 treat as flat, else treat as %
                discount = coupon.tier2Amount >= 100
                    ? Math.min(coupon.tier2Amount, total)
                    : Math.round((total * (coupon.tier2Amount / 100)) * 100) / 100;
                // Actually: if tier2Amount looks like a flat value (e.g. 10) vs % (e.g. 10%):
                // We store flat values. Admin enters "$10 off above $100" so tier2Amount = 10 flat.
                // Tier amounts are FLAT amounts (not percentages).
                discount = Math.min(coupon.tier2Amount, total);
            } else {
                // Tier 1: lower discount (amount is flat)
                discount = Math.min(coupon.amount, total);
            }
            break;

        case 'buy3get1': {
            // Need at least 3 total items in cart; cheapest item is free
            const allUnits = cartItems.flatMap(i => Array(i.quantity).fill(Number(i.price) || 0));
            if (allUnits.length >= 3) {
                discount = Math.min(...allUnits); // cheapest item price
            }
            break;
        }

        default:
            // Legacy fallback: fixAmount boolean
            discount = coupon.fixAmount
                ? Math.min(coupon.amount, total)
                : Math.round((total * (coupon.amount / 100)) * 100) / 100;
    }

    // Always add flatDeduction on top (for flat_amount type this is the main value, but allow stacking)
    if (type !== 'flat_amount' && coupon.flatDeduction > 0) {
        discount += Math.min(coupon.flatDeduction, total - discount);
    }

    return Math.max(0, Math.round(discount * 100) / 100);
};

// ── CREATE ───────────────────────────────────────────────────────────────────
export const saveCoupon = async (req, res) => {
    try {
        const f = extractFields(req.body);
        if (!f.code) return res.status(400).json({ status: false, msg: 'Coupon Code is required.' });
        if (!f.validFrom || !f.validTo) return res.status(400).json({ status: false, msg: 'Valid From and Valid To are required.' });

        const fromDate = new Date(f.validFrom);
        const toDate   = new Date(f.validTo);
        if (isNaN(fromDate) || isNaN(toDate)) return res.status(400).json({ status: false, msg: 'Invalid date format.' });
        if (toDate <= fromDate) return res.status(400).json({ status: false, msg: 'Valid To must be after Valid From.' });

        const coupon = await prisma.coupon.create({
            data: {
                code: f.code, title: f.title, couponType: f.couponType,
                validFrom: fromDate, validTo: toDate, active: f.active,
                fixAmount: f.fixAmount, amount: f.amount, flatDeduction: f.flatDeduction,
                minimumBuy: f.minimumBuy, priceOverOnly: f.priceOverOnly,
                tier2MinOrder: f.tier2MinOrder, tier2Amount: f.tier2Amount,
                newCustomerOnly: f.newCustomerOnly, membersOnly: f.membersOnly,
                nextOrderOnly: f.nextOrderOnly, bestsellerOnly: f.bestsellerOnly,
                recommendedOnly: f.recommendedOnly, newArrivalsOnly: f.newArrivalsOnly,
                booksOfMonthOnly: f.booksOfMonthOnly, getThirdFree: f.getThirdFree,
            }
        });
        res.status(201).json({ status: true, msg: 'Coupon created!', data: coupon });
    } catch (err) {
        if (err.code === 'P2002') return res.status(400).json({ status: false, msg: 'Coupon Code already exists.' });
        console.error(err);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// ── LIST (admin) ──────────────────────────────────────────────────────────────
export const getAllCoupons = async (req, res) => {
    try {
        const pageNum  = Math.max(1, parseInt(req.query.page)  || 1);
        const pageSize = Math.max(1, parseInt(req.query.limit) || 25);
        const skip = (pageNum - 1) * pageSize;
        const [coupons, total] = await Promise.all([
            prisma.coupon.findMany({ orderBy: { id: 'desc' }, skip, take: pageSize }),
            prisma.coupon.count()
        ]);
        res.json({ status: true, data: coupons, total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) });
    } catch (err) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// ── ACTIVE (checkout) ─────────────────────────────────────────────────────────
export const getActiveCoupons = async (req, res) => {
    try {
        const now = new Date();
        const coupons = await prisma.coupon.findMany({
            where: { active: true, validFrom: { lte: now }, validTo: { gte: now } },
            select: {
                id: true, code: true, title: true, couponType: true,
                amount: true, flatDeduction: true, fixAmount: true,
                minimumBuy: true, tier2MinOrder: true, tier2Amount: true,
                newCustomerOnly: true, membersOnly: true,
                bestsellerOnly: true, recommendedOnly: true, newArrivalsOnly: true, booksOfMonthOnly: true,
                getThirdFree: true, validFrom: true, validTo: true,
            }
        });
        res.json({ status: true, data: coupons });
    } catch (err) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// ── GET BY ID ─────────────────────────────────────────────────────────────────
export const getCouponById = async (req, res) => {
    try {
        const coupon = await prisma.coupon.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!coupon) return res.status(404).json({ status: false, msg: 'Coupon not found' });
        res.json({ status: true, data: coupon });
    } catch (err) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// ── UPDATE ────────────────────────────────────────────────────────────────────
export const updateCoupon = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ status: false, msg: 'Invalid ID' });

        const f = extractFields(req.body);
        const updateData = {};

        if (f.code) {
            const existing = await prisma.coupon.findFirst({ where: { code: f.code, NOT: { id } } });
            if (existing) return res.status(400).json({ status: false, msg: 'Coupon Code already in use.' });
            updateData.code = f.code;
        }

        const boolFields = ['active','fixAmount','newCustomerOnly','membersOnly','nextOrderOnly',
            'bestsellerOnly','recommendedOnly','newArrivalsOnly','booksOfMonthOnly','getThirdFree'];
        const floatFields = ['amount','flatDeduction','minimumBuy','priceOverOnly','tier2MinOrder','tier2Amount'];
        const strFields   = ['title','couponType'];

        strFields.forEach(k  => { if (req.body[k] !== undefined || req.body[k.replace(/([A-Z])/g,'_$1').toLowerCase()] !== undefined) updateData[k] = f[k]; });
        boolFields.forEach(k => { const snk = k.replace(/([A-Z])/g,'_$1').toLowerCase(); if (req.body[k] !== undefined || req.body[snk] !== undefined) updateData[k] = f[k]; });
        floatFields.forEach(k=> { const snk = k.replace(/([A-Z])/g,'_$1').toLowerCase(); if (req.body[k] !== undefined || req.body[snk] !== undefined) updateData[k] = f[k]; });

        if (f.validFrom) { const d = new Date(f.validFrom); if (!isNaN(d)) updateData.validFrom = d; }
        if (f.validTo)   { const d = new Date(f.validTo);   if (!isNaN(d)) updateData.validTo   = d; }

        const updated = await prisma.coupon.update({ where: { id }, data: updateData });
        res.json({ status: true, msg: 'Coupon updated!', data: updated });
    } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ status: false, msg: 'Coupon not found' });
        console.error(err);
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

// ── DELETE ────────────────────────────────────────────────────────────────────
export const deleteCoupon = async (req, res) => {
    try {
        await prisma.coupon.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ status: true, msg: 'Coupon deleted!' });
    } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ status: false, msg: 'Coupon not found' });
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};

// ── SEND COUPON VIA EMAIL ─────────────────────────────────────────────────────
// Body: { couponId, recipientType: 'manual'|'all'|'ordered'|'members', emails?: string, emailContent: string }
export const sendCouponEmail = async (req, res) => {
    try {
        const { couponId, emails, emailContent, recipientType, sendToAll } = req.body;
        // recipientType: 'manual' | 'all' | 'ordered' | 'members' (sendToAll is legacy fallback)
        const rtype = recipientType || (sendToAll ? 'all' : 'manual');

        if (!couponId) return res.status(400).json({ status: false, msg: 'Coupon is required.' });
        if (!emailContent) return res.status(400).json({ status: false, msg: 'Email content is required.' });
        if (rtype === 'manual' && (!emails || !emails.trim())) return res.status(400).json({ status: false, msg: 'Provide customer emails or select a recipient group.' });

        // Fetch coupon details
        const coupon = await prisma.coupon.findUnique({ where: { id: parseInt(couponId) } });
        if (!coupon) return res.status(404).json({ status: false, msg: 'Coupon not found.' });

        // Build recipients list by type
        let recipientEmails = [];
        if (rtype === 'all') {
            const users = await prisma.user.findMany({
                select: { email: true },
                where: { email: { not: null }, status: 1, isGuest: false }
            });
            recipientEmails = users.map(u => u.email).filter(Boolean);
        } else if (rtype === 'ordered') {
            const orderRows = await prisma.order.findMany({
                where: { customerId: { not: null } },
                distinct: ['customerId'],
                select: { customerId: true }
            });
            const customerIds = orderRows.map(o => o.customerId).filter(Boolean);
            const users = await prisma.user.findMany({
                where: { id: { in: customerIds }, email: { not: null }, isGuest: false },
                select: { email: true }
            });
            recipientEmails = users.map(u => u.email).filter(Boolean);
        } else if (rtype === 'members') {
            const now = new Date();
            const users = await prisma.user.findMany({
                select: { email: true },
                where: {
                    email: { not: null },
                    membership: 'active',
                    membershipEnd: { gt: now }
                }
            });
            recipientEmails = users.map(u => u.email).filter(Boolean);
        } else {
            recipientEmails = emails.split(',').map(e => e.trim()).filter(e => e.includes('@'));
        }

        if (recipientEmails.length === 0) return res.status(400).json({ status: false, msg: 'No valid email addresses found for this recipient group.' });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        const shopUrl = process.env.FRONTEND_URL || 'https://bagchee.com';
        const subject = `Your Coupon Code: ${coupon.code} – Bagchee`;

        // Wrap admin content in branded email shell
        const htmlBody = `
            <div style="font-family:'Inter',Helvetica,Arial,sans-serif;background-color:#F7EEDD;padding:40px 0;">
                <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.1);border:1px solid #e6decd;">
                    <div style="background-color:#008DDA;padding:30px;text-align:center;">
                        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">Bagchee</h1>
                        <p style="color:#fff;margin-top:5px;opacity:0.9;font-size:13px;">Your Favorite Bookstore</p>
                    </div>
                    <div style="padding:10px 30px 30px;">
                        ${emailContent}
                    </div>
                    <div style="background:#fffdf5;padding:16px 30px;text-align:center;border-top:1px solid #e6decd;">
                        <p style="font-size:12px;color:#4A6fa5;margin:0;">
                            Use code <strong style="color:#008DDA;letter-spacing:1px;">${coupon.code}</strong> at checkout.
                            Valid till ${new Date(coupon.validTo).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}.
                        </p>
                        <a href="${shopUrl}" style="display:inline-block;margin-top:12px;background:#008DDA;color:#fff;text-decoration:none;padding:10px 24px;font-size:13px;font-weight:bold;border-radius:6px;">Shop Now</a>
                        <p style="font-size:11px;color:#9ca3af;margin-top:16px;margin-bottom:0;">&copy; ${new Date().getFullYear()} Bagchee. All rights reserved.</p>
                    </div>
                </div>
            </div>
        `;

        let sent = 0, failed = 0;
        for (const email of recipientEmails) {
            try {
                await transporter.sendMail({
                    from: `"Bagchee Team" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject,
                    html: htmlBody
                });
                sent++;
            } catch (e) {
                console.error(`Failed to send to ${email}:`, e.message);
                failed++;
            }
        }

        res.json({ status: true, msg: `Coupon email sent to ${sent} customer(s).${failed > 0 ? ` ${failed} failed.` : ''}`, sent, failed });
    } catch (err) {
        console.error('sendCouponEmail error:', err);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// ── APPLY (checkout preview) ──────────────────────────────────────────────────
// Body: { code, cartTotal, cartItems?: [{ price, quantity }] }
export const applyCoupon = async (req, res) => {
    try {
        const { code, cartTotal, cartItems = [] } = req.body;
        if (!code) return res.status(400).json({ status: false, msg: 'Coupon code is required' });

        const total = Math.max(0, Number(cartTotal) || 0);
        if (!total) return res.status(400).json({ status: false, msg: 'cartTotal is required' });

        const cleanCode = code.trim().toUpperCase();
        const coupon = await prisma.coupon.findUnique({ where: { code: cleanCode } });

        if (!coupon)        return res.status(404).json({ status: false, msg: 'Invalid coupon code' });
        if (!coupon.active) return res.status(400).json({ status: false, msg: 'This coupon is not active' });

        const now = new Date();
        if (now < coupon.validFrom) return res.status(400).json({ status: false, msg: 'This coupon is not valid yet' });
        if (now > coupon.validTo)   return res.status(400).json({ status: false, msg: 'This coupon has expired' });

        if (coupon.minimumBuy > 0 && total < coupon.minimumBuy) {
            return res.status(400).json({ status: false, msg: `Minimum order of ${coupon.minimumBuy} required for this coupon` });
        }

        const discount = calcDiscount(coupon, total, cartItems);

        res.json({
            status: true,
            msg: 'Coupon applied!',
            data: {
                couponId:      coupon.id,
                code:          coupon.code,
                title:         coupon.title,
                couponType:    coupon.couponType,
                discount,
                fixAmount:     coupon.fixAmount,
                amount:        coupon.amount,
                flatDeduction: coupon.flatDeduction,
                tier2MinOrder: coupon.tier2MinOrder,
                tier2Amount:   coupon.tier2Amount,
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
