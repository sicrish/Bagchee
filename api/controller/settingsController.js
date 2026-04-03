import prisma from '../lib/prisma.js';
import { cache } from '../lib/cache.js';

// Accepts both camelCase (Prisma) and snake_case (old frontend) field names.
const mapBody = (b) => {
    const d = {};
    const f = (cc, sc) => b[cc] !== undefined ? b[cc] : b[sc];
    const num = (v) => parseFloat(v) || 0;
    const int = (v) => parseInt(v) || 0;
    const bool = (v) => v === true || v === 'true';
    if (f('saleThreshold','sale_threshold') !== undefined) d.saleThreshold = num(f('saleThreshold','sale_threshold'));
    if (f('bestSellerThreshold','best_seller_threshold') !== undefined) d.bestSellerThreshold = int(f('bestSellerThreshold','best_seller_threshold'));
    if (f('memberDiscount','member_discount') !== undefined) d.memberDiscount = num(f('memberDiscount','member_discount'));
    if (f('freeShippingOver','free_shiping_over') !== undefined) d.freeShippingOver = num(f('freeShippingOver','free_shiping_over'));
    if (f('freeShippingOverEur','free_shiping_over_eur') !== undefined) d.freeShippingOverEur = num(f('freeShippingOverEur','free_shiping_over_eur'));
    if (f('freeShippingOverInr','free_shiping_over_inr') !== undefined) d.freeShippingOverInr = num(f('freeShippingOverInr','free_shiping_over_inr'));
    if (f('membershipCartPrice','membership_cart_price') !== undefined) d.membershipCartPrice = num(f('membershipCartPrice','membership_cart_price'));
    if (f('membershipCartPriceEur','membership_cart_price_eur') !== undefined) d.membershipCartPriceEur = num(f('membershipCartPriceEur','membership_cart_price_eur'));
    if (f('membershipCartPriceInr','membership_cart_price_inr') !== undefined) d.membershipCartPriceInr = num(f('membershipCartPriceInr','membership_cart_price_inr'));
    if (f('usdToEurRate','usd_to_eur_rate') !== undefined) d.usdToEurRate = num(f('usdToEurRate','usd_to_eur_rate'));
    if (f('usdToInrRate','usd_to_inr_rate') !== undefined) d.usdToInrRate = num(f('usdToInrRate','usd_to_inr_rate'));
    if (f('mailFrom','mail_from') !== undefined) d.mailFrom = f('mailFrom','mail_from') || '';
    if (f('mailReplyTo','mail_reply_to') !== undefined) d.mailReplyTo = f('mailReplyTo','mail_reply_to') || '';
    if (f('topbarPromotion','topbar_promotion') !== undefined) d.topbarPromotion = bool(f('topbarPromotion','topbar_promotion'));
    if (f('topbarPromotionText','topbar_promotion_text') !== undefined) d.topbarPromotionText = f('topbarPromotionText','topbar_promotion_text') || '';
    if (f('bankIban','bank_iban') !== undefined) d.bankIban = f('bankIban','bank_iban') || '';
    if (f('bankBic','bank_bic') !== undefined) d.bankBic = f('bankBic','bank_bic') || '';
    if (f('bankOwner','bank_owner') !== undefined) d.bankOwner = f('bankOwner','bank_owner') || '';
    if (f('bankName','bank_name') !== undefined) d.bankName = f('bankName','bank_name') || '';
    if (f('emailsCopy','emails_copy') !== undefined) d.emailsCopy = f('emailsCopy','emails_copy') || '';
    return d;
};

export const saveSetting = async (req, res) => {
    try {
        const newSetting = await prisma.settings.create({ data: mapBody(req.body) });
        cache.invalidate('settings');
        res.status(201).json({ status: true, msg: 'Settings saved successfully!', data: newSetting });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const listSettings = async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const skip = (pageNum - 1) * pageSize;
        const [data, total] = await Promise.all([
            prisma.settings.findMany({ orderBy: { id: 'desc' }, skip, take: pageSize }),
            prisma.settings.count()
        ]);
        res.status(200).json({ status: true, data, total, totalPages: Math.ceil(total / pageSize), page: pageNum });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getSetting = async (req, res) => {
    try {
        const data = await prisma.settings.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!data) return res.status(404).json({ status: false, msg: 'Not found' });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateSetting = async (req, res) => {
    try {
        const updated = await prisma.settings.update({ where: { id: parseInt(req.params.id) }, data: mapBody(req.body) });
        cache.invalidate('settings');
        res.status(200).json({ status: true, msg: 'Settings updated!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteSetting = async (req, res) => {
    try {
        await prisma.settings.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Deleted!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// Public: returns only fields needed by the frontend (no auth required)
export const getPublicConfig = async (req, res) => {
    try {
        const s = await prisma.settings.findFirst({ orderBy: { id: 'desc' } });
        if (!s) {
            // Return sensible defaults if no settings row exists yet
            return res.json({ status: true, data: {
                membershipCartPriceInr: 2510.87,
                membershipCartPrice: 30,
                memberDiscount: 10,
                freeShippingOverInr: 1000,
                usdToInrRate: 84,
                topbarPromotion: false,
                topbarPromotionText: '',
            }});
        }
        res.json({ status: true, data: {
            membershipCartPriceInr: s.membershipCartPriceInr || 2510.87,
            membershipCartPrice: s.membershipCartPrice || 30,
            memberDiscount: s.memberDiscount || 10,
            freeShippingOverInr: s.freeShippingOverInr || 1000,
            usdToInrRate: s.usdToInrRate || 84,
            topbarPromotion: s.topbarPromotion || false,
            topbarPromotionText: s.topbarPromotionText || '',
        }});
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
