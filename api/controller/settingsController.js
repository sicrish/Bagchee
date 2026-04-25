import prisma from '../lib/prisma.js';
import { cache } from '../lib/cache.js';

// Accepts both camelCase (Prisma) and snake_case (old/new frontend) field names.
const mapBody = (b) => {
    const d = {};
    // Pick first defined value from a list of candidate keys
    const f = (...keys) => { for (const k of keys) { if (b[k] !== undefined) return b[k]; } return undefined; };
    const num = (v) => parseFloat(v) || 0;
    const int = (v) => parseInt(v) || 0;
    // Handle boolean: true, 'true', 'Yes', 1
    const bool = (v) => v === true || v === 'true' || v === 'Yes' || v === 1;

    const saleThreshold = f('saleThreshold','sale_threshold');
    if (saleThreshold !== undefined) d.saleThreshold = num(saleThreshold);

    // frontend sends 'bestseller_threshold' (no underscore between best/seller)
    const bst = f('bestSellerThreshold','best_seller_threshold','bestseller_threshold');
    if (bst !== undefined) d.bestSellerThreshold = int(bst);

    const memberDiscount = f('memberDiscount','member_discount');
    if (memberDiscount !== undefined) d.memberDiscount = num(memberDiscount);

    // frontend sends 'free_shipping_over'; controller historically had a typo 'free_shiping_over'
    const fso = f('freeShippingOver','free_shipping_over','free_shiping_over');
    if (fso !== undefined) d.freeShippingOver = num(fso);

    const fsoEur = f('freeShippingOverEur','free_shipping_over_eur','free_shiping_over_eur');
    if (fsoEur !== undefined) d.freeShippingOverEur = num(fsoEur);

    const fsoInr = f('freeShippingOverInr','free_shipping_over_inr','free_shiping_over_inr');
    if (fsoInr !== undefined) d.freeShippingOverInr = num(fsoInr);

    // frontend sends 'membership_cost' for USD membership price
    // Note: 'membership_cart_price' is the INR price — do NOT include it here
    const mcp = f('membershipCartPrice','membership_cost');
    if (mcp !== undefined) d.membershipCartPrice = num(mcp);

    // frontend sends 'membership_cost_eur'
    const mcpEur = f('membershipCartPriceEur','membership_cart_price_eur','membership_cost_eur');
    if (mcpEur !== undefined) d.membershipCartPriceEur = num(mcpEur);

    // frontend sends 'membership_cart_price' for INR membership price
    const mcpInr = f('membershipCartPriceInr','membership_cart_price_inr','membership_cart_price');
    if (mcpInr !== undefined) d.membershipCartPriceInr = num(mcpInr);

    const usdToEur = f('usdToEurRate','usd_to_eur_rate');
    if (usdToEur !== undefined) d.usdToEurRate = num(usdToEur);

    const usdToInr = f('usdToInrRate','usd_to_inr_rate');
    if (usdToInr !== undefined) d.usdToInrRate = num(usdToInr);

    const mailFrom = f('mailFrom','mail_from');
    if (mailFrom !== undefined) d.mailFrom = mailFrom || '';

    const mailReplyTo = f('mailReplyTo','mail_reply_to');
    if (mailReplyTo !== undefined) d.mailReplyTo = mailReplyTo || '';

    const topbarPromo = f('topbarPromotion','topbar_promotion');
    if (topbarPromo !== undefined) d.topbarPromotion = bool(topbarPromo);

    const topbarText = f('topbarPromotionText','topbar_promotion_text');
    if (topbarText !== undefined) d.topbarPromotionText = topbarText || '';

    // frontend sends 'account_number' for legacy bankIban field
    const bankIban = f('bankIban','bank_iban','account_number');
    if (bankIban !== undefined) d.bankIban = bankIban || '';

    // frontend sends 'swift_code' for bankBic
    const bankBic = f('bankBic','bank_bic','swift_code');
    if (bankBic !== undefined) d.bankBic = bankBic || '';

    // frontend sends 'beneficiary_name' for bankOwner
    const bankOwner = f('bankOwner','bank_owner','beneficiary_name');
    if (bankOwner !== undefined) d.bankOwner = bankOwner || '';

    const bankName = f('bankName','bank_name');
    if (bankName !== undefined) d.bankName = bankName || '';

    const emailsCopy = f('emailsCopy','emails_copy');
    if (emailsCopy !== undefined) d.emailsCopy = emailsCopy || '';

    const nat = f('newArrivalTime','new_arrival_time');
    if (nat !== undefined) d.newArrivalTime = nat || '';

    // Payment gateway mode
    const pgm = f('paymentGatewayMode','payment_gateway_mode');
    if (pgm !== undefined) d.paymentGatewayMode = pgm || 'deferred';
    // Per-currency bank details
    if (f('bankNameUsd','bank_name_usd') !== undefined) d.bankNameUsd = f('bankNameUsd','bank_name_usd') || '';
    if (f('bankIbanUsd','bank_iban_usd') !== undefined) d.bankIbanUsd = f('bankIbanUsd','bank_iban_usd') || '';
    if (f('bankBicUsd','bank_bic_usd') !== undefined) d.bankBicUsd = f('bankBicUsd','bank_bic_usd') || '';
    if (f('bankOwnerUsd','bank_owner_usd') !== undefined) d.bankOwnerUsd = f('bankOwnerUsd','bank_owner_usd') || '';
    if (f('bankNameEur','bank_name_eur') !== undefined) d.bankNameEur = f('bankNameEur','bank_name_eur') || '';
    if (f('bankIbanEur','bank_iban_eur') !== undefined) d.bankIbanEur = f('bankIbanEur','bank_iban_eur') || '';
    if (f('bankBicEur','bank_bic_eur') !== undefined) d.bankBicEur = f('bankBicEur','bank_bic_eur') || '';
    if (f('bankOwnerEur','bank_owner_eur') !== undefined) d.bankOwnerEur = f('bankOwnerEur','bank_owner_eur') || '';
    if (f('bankNameGbp','bank_name_gbp') !== undefined) d.bankNameGbp = f('bankNameGbp','bank_name_gbp') || '';
    if (f('bankIbanGbp','bank_iban_gbp') !== undefined) d.bankIbanGbp = f('bankIbanGbp','bank_iban_gbp') || '';
    if (f('bankBicGbp','bank_bic_gbp') !== undefined) d.bankBicGbp = f('bankBicGbp','bank_bic_gbp') || '';
    if (f('bankOwnerGbp','bank_owner_gbp') !== undefined) d.bankOwnerGbp = f('bankOwnerGbp','bank_owner_gbp') || '';
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
            // camelCase (Prisma standard)
            membershipCartPrice:    s.membershipCartPrice    || 30,
            membershipCartPriceEur: s.membershipCartPriceEur || 30,
            membershipCartPriceInr: s.membershipCartPriceInr || 2510.87,
            memberDiscount:         s.memberDiscount         || 10,
            freeShippingOver:       s.freeShippingOver       || 0,
            freeShippingOverEur:    s.freeShippingOverEur    || 0,
            freeShippingOverInr:    s.freeShippingOverInr    || 1000,
            usdToInrRate:           s.usdToInrRate           || 84,
            usdToEurRate:           s.usdToEurRate           || 0.92,
            saleThreshold:          s.saleThreshold          || 0,
            bestSellerThreshold:    s.bestSellerThreshold    || 0,
            topbarPromotion:        s.topbarPromotion        || false,
            topbarPromotionText:    s.topbarPromotionText    || '',
            paymentGatewayMode:     s.paymentGatewayMode     || 'deferred',
            bankDetails: {
                usd: { name: s.bankNameUsd, iban: s.bankIbanUsd, bic: s.bankBicUsd, owner: s.bankOwnerUsd },
                eur: { name: s.bankNameEur, iban: s.bankIbanEur, bic: s.bankBicEur, owner: s.bankOwnerEur },
                gbp: { name: s.bankNameGbp, iban: s.bankIbanGbp, bic: s.bankBicGbp, owner: s.bankOwnerGbp },
            },
            // snake_case aliases for old frontend code
            membership_cost:         s.membershipCartPrice    || 30,
            membership_cart_price:   s.membershipCartPriceInr || 2510.87,
            member_discount:         s.memberDiscount         || 10,
            free_shipping_over:      s.freeShippingOver       || 0,
            free_shipping_over_inr:  s.freeShippingOverInr    || 1000,
            bestseller_threshold:    s.bestSellerThreshold    || 0,
            topbar_promotion:        s.topbarPromotion        ? 'Yes' : 'No',
            topbar_promotion_text:   s.topbarPromotionText    || '',
        }});
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
