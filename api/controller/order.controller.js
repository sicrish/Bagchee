import prisma from '../lib/prisma.js';
import crypto from 'crypto';
import { sendOrderConfirmation, sendOrderShippedEmail, sendOrderStatusEmail, sendPaymentLinkEmail, sendInvoiceEmail, sendCustomConfirmationEmail, sendMembershipWelcome, sendCancellationRequestToShop, sendCancellationRequestReceived } from './email.controller.js';
import { calcDiscount, couponAlreadyUsed } from './coupon.controller.js';
import { createGiftCardsForOrder, applyWalletBalance } from './giftCard.controller.js';
import { activeItems, payableTotal, payableShipping, isCancelledItem, sumItems, bookCount,
    membershipFeeOf, membershipDiscountOf, memberDiscountFor, membershipLine,
    payableMembershipDiscount } from '../lib/orderTotals.js';
import { resolveShippingRule, standardShippingFor, isTieredOption, FREE_SHIPPING_MIN_USD } from '../lib/shippingRule.js';
import { isMembershipActive } from '../lib/membership.js';
import { getUsdConversionRate } from '../lib/exchangeRates.js';
import { findBlockMatch } from '../lib/blocklist.js';
import { resolveClientIp, resolveClientCountry } from '../lib/clientRequest.js';

// Currencies the order is actually settled in (PayPal accepts these). The order's monetary
// fields are computed authoritatively in USD then converted to one of these. Everything else
// (USD itself, plus INR which is display-only for India and never reaches PayPal) stays in USD.
const FX_CONVERTIBLE = new Set(['EUR', 'GBP']);

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Membership fee in the customer's currency, mirroring Checkout.jsx (currentMembershipCost):
// EUR uses the admin's stored price; GBP/USD (and anything else) derive from the USD price ×
// the order's FX rate — so the amount charged equals what the cart and checkout displayed.
const membershipFeeForCurrency = (currency, settings, feeUsd, rate) => {
    if (currency === 'EUR') return round2(Number(settings?.membershipCartPriceEur) || feeUsd * rate);
    if (currency === 'INR') return round2(Number(settings?.membershipCartPriceInr) || feeUsd * rate);
    if (currency === 'GBP') return round2(feeUsd * rate);
    return round2(feeUsd); // USD + anything else
};

// Payment type detection helpers
const isWireTransfer = (title) => {
    const t = (title || '').toLowerCase();
    return t.includes('wire') || t.includes('bank transfer');
};
const isPurchaseOrder = (title) => {
    const t = (title || '').toLowerCase();
    return t.includes('purchase order');
};
const isCardOrPayPal = (title) => {
    const t = (title || '').toLowerCase();
    return t.includes('credit card') || t.includes('paypal') || t.includes('debit card') || t.includes('debit');
};

// What to include when returning a single order
const ORDER_DETAIL_INCLUDE = {
    customer: { select: { id: true, name: true, email: true, phone: true } },
    coupon:   { select: { id: true, code: true, amount: true, fixAmount: true, flatDeduction: true } },
    items: {
        include: {
            product: { select: { id: true, title: true, defaultImage: true, bagcheeId: true, price: true } },
            courier: { select: { id: true, title: true, trackingPage: true } }
        }
    }
};

// Minimal include for list view (omit heavy product details).
// Pull product.title too — migrated orders have item.name='' (snapshot wasn't in the
// old table), so the relation title is the only reliable book name for those rows.
const ORDER_LIST_INCLUDE = {
    customer: { select: { id: true, name: true, email: true } },
    items: { select: { id: true, name: true, price: true, quantity: true, status: true, product: { select: { title: true } } } }
};

// Extract shipping/billing flat fields from request body.
// Supports both nested (old Mongoose shape) and flat (new Prisma shape).
const extractShipping = (body) => {
    const sd = body.shipping_details || {};
    return {
        shippingEmail:     body.shippingEmail     || sd.email                              || '',
        shippingFirstName: body.shippingFirstName || sd.first_name  || sd.firstName        || '',
        shippingLastName:  body.shippingLastName  || sd.last_name   || sd.lastName         || '',
        shippingAddress1:  body.shippingAddress1  || sd.address_1   || sd.address1 || sd.address || '',
        shippingAddress2:  body.shippingAddress2  || sd.address_2   || sd.address2         || '',
        shippingCompany:   body.shippingCompany   || sd.company                            || '',
        shippingCountry:   body.shippingCountry   || sd.country                            || '',
        shippingState:     body.shippingState     || sd.state_region || sd.state           || '',
        shippingCity:      body.shippingCity      || sd.city                               || '',
        shippingPostcode:  body.shippingPostcode  || sd.postcode    || sd.pincode          || '',
        shippingPhone:     body.shippingPhone     || sd.phone                              || '',
    };
};

const extractBilling = (body) => {
    const bd = body.billing_details || {};
    return {
        billingFirstName: body.billingFirstName || bd.first_name  || bd.firstName          || '',
        billingLastName:  body.billingLastName  || bd.last_name   || bd.lastName           || '',
        billingAddress1:  body.billingAddress1  || bd.address_1   || bd.address1 || bd.address || '',
        billingAddress2:  body.billingAddress2  || bd.address_2   || bd.address2           || '',
        billingCompany:   body.billingCompany   || bd.company                              || '',
        billingCountry:   body.billingCountry   || bd.country                              || '',
        billingState:     body.billingState     || bd.state_region || bd.state             || '',
        billingCity:      body.billingCity      || bd.city                                 || '',
        billingPostcode:  body.billingPostcode  || bd.postcode    || bd.pincode            || '',
        billingPhone:     body.billingPhone     || bd.phone                                || '',
    };
};

// ── Controllers ───────────────────────────────────────────────────────────────

// POST /orders
export const saveOrder = async (req, res) => {
    try {
        // Resolve customerId — null for guests
        let customerId = null;
        // Admin manual entry (AddOrders sends admin_manual:true) posts here too. That flow —
        // and only that flow — may set fields checkout customers never can: typed item
        // prices, status, payment status, transaction id and the order date (mirroring what
        // updateOrder already trusts). An admin shopping the storefront checkout stays a
        // normal customer: server prices, free-shipping rule, computed status.
        const isAdminCaller = req.user?.role === 'admin';
        const isAdminManual = isAdminCaller && req.body.admin_manual === true;
        if (req.user) {
            customerId = isAdminCaller
                ? parseInt(req.body.customer_id || req.body.customerId || req.user.userId)
                : parseInt(req.user.userId);
            if (isNaN(customerId)) customerId = null;
        }

        const products = req.body.products || req.body.items || [];
        const giftCardItems = req.body.giftCardItems || [];

        if (!products.length && !giftCardItems.length)
            return res.status(400).json({ status: false, msg: 'Order must have at least one item' });

        // Shipping/billing extracted once — used by the guards below, the coupon
        // once-per-user check and the order create.
        const shippingInfo = extractShipping(req.body);
        const billingInfo  = extractBilling(req.body);

        // ── Blocklist gate + origin capture (16-July) — customers only ─────────────
        // Admin entries (storefront or AddOrders manual) skip the gate, and the
        // admin's own IP is never recorded as the customer's.
        let customerIp = '', customerCountry = '';
        if (!isAdminCaller) {
            customerIp      = resolveClientIp(req);
            customerCountry = resolveClientCountry(req);
            const accountEmail = customerId
                ? (await prisma.user.findUnique({ where: { id: customerId }, select: { email: true } }))?.email
                : '';
            const blockedBy = await findBlockMatch({
                emails:  [shippingInfo.shippingEmail, accountEmail],
                ip:      customerIp,
                country: customerCountry,
            });
            if (blockedBy) {
                console.warn(`Blocked order attempt (${blockedBy.kind}=${blockedBy.value}) ip=${customerIp} country=${customerCountry} email=${shippingInfo.shippingEmail}`);
                return res.status(403).json({ status: false, msg: 'Unable to place order. Please contact customer support.' });
            }

            // Country must be present on customer orders — silent empties are how migrated
            // 'India' address defaults once leaked into orders unnoticed (order 17655).
            if (!shippingInfo.shippingCountry.trim())
                return res.status(400).json({ status: false, msg: 'Shipping country is required.' });
        }

        // Validate gift card items (amount range + required fields)
        for (const gc of giftCardItems) {
            const amount = parseFloat(gc.amount);
            if (isNaN(amount) || amount < 10 || amount > 1000)
                return res.status(400).json({ status: false, msg: 'Gift card amount must be between $10 and $1000' });
            if (!gc.recipientEmail || !gc.recipientName || !gc.senderName)
                return res.status(400).json({ status: false, msg: 'Gift card recipient details are required' });
        }

        const currency = req.body.currency || 'USD';

        // Fetch authoritative prices for physical products
        let itemsData = [];
        if (products.length > 0) {
            const productIds = products.map(p => parseInt(p.productId || p.product_id || p.id));
            if (productIds.some(isNaN))
                return res.status(400).json({ status: false, msg: 'All products must have a valid productId' });

            const dbProducts = await prisma.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true, title: true, price: true, realPrice: true, defaultImage: true }
            });
            if (dbProducts.length !== productIds.length)
                return res.status(400).json({ status: false, msg: 'One or more products not found' });

            const priceMap = Object.fromEntries(dbProducts.map(p => [p.id, p]));
            itemsData = products.map(p => {
                const pId    = parseInt(p.productId || p.product_id || p.id);
                const dbProd = priceMap[pId];
                // Use realPrice (discounted selling price) when it exists and is lower than price (MRP)
                const sellingPrice = (dbProd.realPrice > 0 && dbProd.realPrice < dbProd.price)
                    ? dbProd.realPrice
                    : dbProd.price;
                // Admin manual orders may carry a negotiated per-line price (USD, like the DB
                // prices); customers never override — the DB selling price is authoritative.
                const typedPrice = Number(p.price);
                const adminPrice = isAdminManual && p.price !== '' && p.price !== null
                    && p.price !== undefined && !isNaN(typedPrice) && typedPrice >= 0;
                return {
                    productId:    pId,
                    name:         p.name || p.title || dbProd.title || '',
                    image:        dbProd.defaultImage || '',
                    price:        adminPrice ? typedPrice : sellingPrice,
                    realPrice:    dbProd.realPrice || 0,
                    quantity:     Math.min(100, Math.max(1, Number(p.quantity) || 1)),
                    status:       p.status           || '',
                    trackingCode: p.trackingCode || p.tracking_code || '',
                };
            });
        }

        const physicalSubtotal = itemsData.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const giftCardSubtotal = giftCardItems.reduce((sum, gc) => sum + parseFloat(gc.amount), 0);
        const subtotalBeforeGiftWallet = physicalSubtotal + giftCardSubtotal;

        // ── Shipping cost (29-June) ────────────────────────────────────────────────
        // Shipping is the admin-defined value FOR THE ORDER'S CURRENCY (ShippingOption
        // priceUsd / priceEur / priceGbp), NOT an FX conversion of the USD price — so the
        // cart, checkout, PayPal charge, invoice and admin view all show the exact same
        // number with zero exchange-rate drift. We keep a USD figure (shippingCostUsd) only
        // for the USD-side maths (the gift-wallet cap); shippingNative is what gets stored.
        const shippingOptionId = parseInt(req.body.shipping_option_id || req.body.shippingOptionId);
        const shipOpt = !isNaN(shippingOptionId)
            ? await prisma.shippingOption.findUnique({ where: { id: shippingOptionId } })
            : null;
        const shippingIsNative = !!shipOpt; // admin per-currency value → never FX-converted
        const shipPriceFor = (cur) => {
            if (!shipOpt) return Math.max(0, Number(req.body.shipping_cost || req.body.shippingCost) || 0);
            if (cur === 'EUR') return Math.max(0, Number(shipOpt.priceEur) || 0);
            if (cur === 'GBP') return Math.max(0, Number(shipOpt.priceGbp) || 0);
            return Math.max(0, Number(shipOpt.priceUsd) || 0); // USD / INR / anything else
        };
        let shippingCostUsd = shipPriceFor('USD');     // gift-wallet cap + USD-side maths
        let shippingNative  = shipPriceFor(currency);  // stored on the order, in order currency

        // Server-side free-shipping enforcement (unchanged rule): standard (non-tiered) orders
        // whose selling subtotal meets the USD threshold ship free, regardless of client input.
        // Admin manual orders keep whatever shipping the admin typed — the free-shipping
        // rule is a storefront promise, not a constraint on negotiated phone/wire orders.
        if (itemsData.length > 0 && !isAdminManual) {
            const shippingType = req.body.shipping_type || req.body.shippingType || '';
            // Expedited / Express are never free. Detected by option ID as well as by keyword:
            // the live Express option is titled "3-5 Days Worldwide Delivery" (no 'express' in
            // it), so the keyword test alone waived its charge on any cart over the threshold
            // — order 17666 (17-July) shipped Express for €0 because of exactly this.
            // Resolve by title when the client didn't send an option id (older cached bundle),
            // so the guard never depends on what the browser posted.
            const tierOpt = shipOpt || (shippingType.trim()
                ? await prisma.shippingOption.findFirst({
                    where: { title: { equals: shippingType.trim(), mode: 'insensitive' } }, select: { id: true } })
                : null);
            const isTiered = isTieredOption(tierOpt, shippingType);
            const freeShippingThreshold = FREE_SHIPPING_MIN_USD; // physicalSubtotal is USD
            if (!isTiered && physicalSubtotal >= freeShippingThreshold) {
                shippingCostUsd = 0;
                shippingNative  = 0;
            }
        }

        // Apply coupon discount server-side — only against physical items subtotal
        const couponId = parseInt(req.body.coupon_id || req.body.couponId) || null;
        let couponDiscount = 0;
        if (couponId && !isNaN(couponId) && physicalSubtotal > 0) {
            const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
            if (coupon && coupon.active) {
                const now = new Date();
                if (now >= coupon.validFrom && now <= coupon.validTo && physicalSubtotal >= (coupon.minimumBuy || 0)) {
                    // One-time-per-user: block reuse by the same customer / guest email (before any writes)
                    if (coupon.oncePerUser) {
                        const used = await couponAlreadyUsed(coupon.id, {
                            customerId,
                            email: shippingInfo.shippingEmail,
                        });
                        if (used) return res.status(400).json({ status: false, msg: 'You have already used this coupon. Please remove it to continue.' });
                    }
                    const cartItems = itemsData.map(i => ({ price: i.price, quantity: i.quantity }));
                    couponDiscount = calcDiscount(coupon, physicalSubtotal, cartItems);
                }
            }
        }

        // ── Membership (purchase + discount) — logged-in users only ────────────────
        // Two independent things can happen on one order:
        //   • DISCOUNT — a verified active member who asked for it, OR a non-member buying a
        //     membership on this order, gets `member_discount`% off. Applied to items here
        //     (USD, FX-converted with the items) and to the fee below (native).
        //   • PURCHASE — a logged-in non-member who added a membership pays the membership FEE
        //     (an admin per-currency amount, like shipping) and is ACTIVATED when the payment
        //     is captured. `membershipPurchased` is the single source of truth for activation,
        //     so an existing member is never silently re-subscribed on a normal order (M2).
        const orderRate = FX_CONVERTIBLE.has(currency) ? await getUsdConversionRate(currency) : 1;
        let serverMembershipDiscount = 0;   // member discount on ITEMS (USD; FX-converted with items)
        let membershipFeeUsd = 0;           // USD fee — gift-wallet cap + USD-side maths
        let membershipFeeNative = 0;        // fee in the order currency (native, added after FX)
        let membershipDiscountNative = 0;   // member discount on the FEE, in the order currency (native)
        let buysMembership = false;         // → activates the membership when the order is paid
        let memberDiscountApplied = false;
        let giftCardWalletDeduction = 0;
        if (customerId) {
            const wantsMemberDiscount  = req.body.membership === 'Yes' || req.body.membership === true;
            const clientBuysMembership = req.body.membership_purchase === true || req.body.membershipPurchase === true;
            const dbUser = await prisma.user.findUnique({
                where: { id: customerId },
                select: { membership: true, membershipEnd: true, giftCardBalance: true },
            });
            // Honor expiry: a lapsed member (stale token) is treated as a non-member.
            const alreadyActive = isMembershipActive(dbUser);
            // Only a logged-in NON-member can buy (an active member already has it → no double charge).
            buysMembership = clientBuysMembership && !alreadyActive;
            if ((wantsMemberDiscount && alreadyActive) || buysMembership) {
                const dbSettings = await prisma.settings.findFirst({
                    orderBy: { id: 'desc' },
                    select: { memberDiscount: true, membershipCartPrice: true, membershipCartPriceEur: true, membershipCartPriceInr: true },
                });
                const memberDiscountPct = Number(dbSettings?.memberDiscount) || 0;
                serverMembershipDiscount = round2(physicalSubtotal * memberDiscountPct / 100); // on items (USD)
                memberDiscountApplied = true;
                if (buysMembership) {
                    membershipFeeUsd         = Number(dbSettings?.membershipCartPrice) || 0;
                    membershipFeeNative      = membershipFeeForCurrency(currency, dbSettings, membershipFeeUsd, orderRate);
                    // ⚠️ The member discount applies to the BOOKS only — the membership fee is
                    // not discounted by the membership it pays for (client's rule, 2026-08-06).
                    // Kept as a named zero so the fee/discount split below stays readable.
                    membershipDiscountNative = 0;
                }
            }

            const clientRequestsGiftWallet = parseFloat(req.body.giftCardWalletApplied) || 0;
            if (clientRequestsGiftWallet > 0) {
                const available = dbUser?.giftCardBalance || 0;
                giftCardWalletDeduction = Math.min(available, clientRequestsGiftWallet, subtotalBeforeGiftWallet + shippingCostUsd + membershipFeeUsd);
            }
        }

        const subtotal = subtotalBeforeGiftWallet;
        // Items minus all discounts, in USD. Shipping is added AFTER any FX conversion below,
        // because it's an admin per-currency amount that must NOT be rate-converted (29-June).
        let total = Math.max(0, Math.round((subtotal - couponDiscount - serverMembershipDiscount - giftCardWalletDeduction) * 100) / 100);

        // ── Multi-currency settlement ──────────────────────────────────────────────
        // Everything above is authoritative in USD (item prices come from the DB, never the
        // client). For the foreign currencies PayPal settles in (EUR/GBP) we convert the line
        // items and discounts with a server-side rate, so the order total, line items and
        // discounts — and therefore payableTotal()/the PayPal charge, the invoice, the email
        // and the admin view — are consistent and the customer pays the correct amount in their
        // own currency. SHIPPING is the admin's per-currency value (added after this block,
        // un-converted). The gift-card WALLET deduction stays in USD: it draws down a USD
        // store-credit balance, already applied to the USD total before this conversion.
        if (FX_CONVERTIBLE.has(currency)) {
            const fxRate = orderRate; // resolved once above (also used for the membership fee)
            if (fxRate > 0 && fxRate !== 1) {
                const fx = (usd) => Math.round((Number(usd) || 0) * fxRate * 100) / 100;
                total                    = fx(total);
                serverMembershipDiscount = fx(serverMembershipDiscount);
                couponDiscount           = fx(couponDiscount);
                itemsData = itemsData.map(i => ({ ...i, price: fx(i.price) }));
                // Legacy fallback only: with no resolved shipping option the client amount is
                // USD and must be converted. The admin per-currency value is already native.
                if (!shippingIsNative) shippingNative = fx(shippingNative);
            }
        }
        // Shipping + membership fee = admin per-currency amounts; add on top of the (converted)
        // item total so cart == checkout == PayPal charge exactly, with no FX drift on those
        // lines. The fee carries the member discount too (10% off the fee, mirroring checkout).
        const shippingCost = Math.max(0, round2(shippingNative));
        const membershipNet = round2(membershipFeeNative - membershipDiscountNative);
        // Total member discount stored for the admin/email view = items portion (now FX'd) + fee portion.
        const totalMembershipDiscount = Math.max(0, round2(serverMembershipDiscount + membershipDiscountNative));
        total = Math.max(0, round2(total + shippingCost + membershipNet));

        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const paymentTitle = req.body.payment_type || req.body.paymentType || '';

        // Determine initial order status based on payment type + global settings + per-user override
        let initialStatus = 'pending';
        if (isWireTransfer(paymentTitle)) {
            initialStatus = 'payment pending';
        } else if (isPurchaseOrder(paymentTitle)) {
            initialStatus = 'processing';
        } else if (isCardOrPayPal(paymentTitle)) {
            const [settings, customer] = await Promise.all([
                prisma.settings.findFirst({ orderBy: { id: 'desc' }, select: { paymentGatewayMode: true } }),
                customerId ? prisma.user.findUnique({ where: { id: customerId }, select: { forceDirectPayment: true } }) : Promise.resolve(null)
            ]);
            const mode = settings?.paymentGatewayMode || 'deferred';
            const forcesDirect = customer?.forceDirectPayment === true;
            if (mode === 'deferred' && !forcesDirect) {
                initialStatus = 'approval pending';
            }
        }

        const purchaseOrderNumber = isPurchaseOrder(paymentTitle)
            ? (req.body.purchaseOrderNumber || req.body.purchase_order_number || '')
            : '';

        // Admin manual entry: the AddOrders form offers Status / Payment status /
        // Transaction id / Order date — honor them instead of silently discarding
        // (the page used to send all four and the server ignored every one).
        if (isAdminManual && typeof req.body.status === 'string' && req.body.status.trim()) {
            initialStatus = req.body.status.trim();
        }
        const initialPaymentStatus = (isAdminManual && typeof req.body.payment_status === 'string' && req.body.payment_status.trim())
            ? req.body.payment_status.trim()
            : 'pending';
        const initialTransactionId = isAdminManual ? String(req.body.transaction_id || '') : '';
        const manualCreatedAt = (isAdminManual && req.body.created_at && !isNaN(new Date(req.body.created_at).getTime()))
            ? new Date(req.body.created_at)
            : null;

        const order = await prisma.order.create({
            data: {
                orderNumber,
                customerId,
                total,
                shippingCost,
                currency,
                paymentType:        paymentTitle,
                shippingType:       req.body.shipping_type || req.body.shippingType || '',
                status:             initialStatus,
                paymentStatus:      initialPaymentStatus,
                transactionId:      initialTransactionId,
                purchaseOrderNumber,
                ...(manualCreatedAt ? { createdAt: manualCreatedAt } : {}),
                membership:          memberDiscountApplied ? 'Yes' : 'No', // did this order get the member discount
                membershipPurchased: buysMembership,                       // → activate membership when paid
                membershipFee:       Math.max(0, round2(membershipFeeNative)),
                membershipDiscount:  totalMembershipDiscount,
                couponId:           couponId && !isNaN(couponId) ? couponId : null,
                couponDiscount:     couponDiscount,
                comment:            req.body.comment                     || '',
                customerComment:    req.body.customer_comment || req.body.customerComment || '',
                estimatedDelivery:  req.body.estimatedDelivery ? new Date(req.body.estimatedDelivery) : null,
                customerIp,
                customerCountry,

                ...shippingInfo,
                ...billingInfo,

                items: { create: itemsData.map(({ realPrice, ...rest }) => rest) }
            },
            include: ORDER_DETAIL_INCLUDE
        });

        // Deduct gift card wallet balance from user's account
        if (giftCardWalletDeduction > 0) {
            prisma.user.update({ where: { id: customerId }, data: { giftCardBalance: { decrement: giftCardWalletDeduction } } }).catch(() => {});
        }

        // Create gift cards and email recipients — fire and forget
        if (giftCardItems.length > 0) {
            createGiftCardsForOrder(giftCardItems, order.id).catch(() => {});
        }

        // Increment soldCount for each physical product — fire and forget
        if (itemsData.length > 0) {
            prisma.$transaction(
                itemsData.map(item =>
                    prisma.product.update({
                        where: { id: item.productId },
                        data: { soldCount: { increment: item.quantity } }
                    })
                )
            ).catch(() => {});
        }

        // Send confirmation email — fire and forget, never fail the order
        // Direct PayPal/card: skip here, email is sent after payment capture in paypal.controller.js
        // Deferred card/PayPal (approval pending): send now so customer knows order was received
        const customerEmail = order.shippingEmail || order.customer?.email;
        const isDeferredCardOrPayPal = isCardOrPayPal(paymentTitle) && order.status === 'approval pending';
        if (customerEmail && (!isCardOrPayPal(paymentTitle) || isDeferredCardOrPayPal)) {
            if (isDeferredCardOrPayPal) {
                // For deferred card/PayPal: show "pending review" notice, not payment instructions
                order.isDeferredPayment = true;
            } else {
                // Fetch additionalText for wire transfer, purchase order, etc.
                try {
                    const payMethod = await prisma.payment.findFirst({
                        where: { title: { equals: paymentTitle, mode: 'insensitive' } },
                        select: { additionalText: true, additionalTextActive: true }
                    });
                    if (payMethod?.additionalText) {
                        order.paymentAdditionalText = payMethod.additionalText;
                        order.paymentAdditionalTextActive = payMethod.additionalTextActive;
                    }
                } catch { /* non-critical */ }
            }
            if (giftCardItems.length > 0) order.giftCardItems = giftCardItems;
            sendOrderConfirmation(customerEmail, order).catch(() => {});
        }

        res.status(201).json({ status: true, msg: 'Order placed successfully!', data: order });
    } catch (error) {
        console.error('Save Order Error:', error);
        if (error.code === 'P2002')
            return res.status(400).json({ status: false, msg: 'Order number conflict, please retry.' });
        res.status(500).json({ status: false, msg: 'Order creation failed' });
    }
};

// GET /orders   (admin — all orders with pagination + filters)
export const getAllOrders = async (req, res) => {
    try {
        const { page, limit, status, search, customer_id } = req.query;
        const pageNum  = Math.max(1, Number(page)  || 1);
        // 20k ceiling: big enough that the admin Excel export (limit=100000) really returns
        // EVERY order — the old 100 cap silently truncated the "full data" export to the
        // newest 100 rows — while still bounding a runaway query. Admin-only route.
        const pageSize = Math.min(20000, Math.max(1, Number(limit) || 10));
        const skip     = (pageNum - 1) * pageSize;

        const conditions = [];

        if (customer_id) {
            const cId = parseInt(customer_id);
            if (!isNaN(cId)) conditions.push({ customerId: cId });
        }

        // Case-insensitive partial match so admin can type "shipped" and catch
        // "Partially Shipped", "in progress" → "In progress", etc.
        if (status && status !== 'All') conditions.push({ status: { contains: status, mode: 'insensitive' } });

        if (search) {
            const numericId = parseInt(search);
            const parts = search.trim().split(/\s+/);
            conditions.push({ OR: [
                { orderNumber:   { contains: search, mode: 'insensitive' } },
                { shippingEmail: { contains: search, mode: 'insensitive' } },
                { shippingPhone: { contains: search, mode: 'insensitive' } },
                { shippingFirstName: { contains: search, mode: 'insensitive' } },
                { shippingLastName:  { contains: search, mode: 'insensitive' } },
                // "First Last" full-name search across shipping name fields
                ...(parts.length >= 2 ? [{ AND: [
                    { shippingFirstName: { contains: parts[0], mode: 'insensitive' } },
                    { shippingLastName:  { contains: parts.slice(1).join(' '), mode: 'insensitive' } },
                ]}] : []),
                // Search by customer name
                { customer: { name: { contains: search, mode: 'insensitive' } } },
                // Search by product/book name within order items (name stored at order time or via product relation)
                { items: { some: { name: { contains: search, mode: 'insensitive' } } } },
                { items: { some: { product: { title: { contains: search, mode: 'insensitive' } } } } },
                // Search by numeric order ID
                ...(!isNaN(numericId) ? [{ id: numericId }] : []),
            ]});
        }

        const where = conditions.length ? { AND: conditions } : {};

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where, include: ORDER_LIST_INCLUDE,
                orderBy: { createdAt: 'desc' }, skip, take: pageSize
            }),
            prisma.order.count({ where })
        ]);

        res.status(200).json({
            status: true, data: orders, total,
            page: pageNum, limit: pageSize,
            totalPages: Math.ceil(total / pageSize)
        });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// GET /orders/:id
export const getOrderById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ status: false, msg: 'Invalid ID' });

        const order = await prisma.order.findUnique({ where: { id }, include: ORDER_DETAIL_INCLUDE });
        if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });

        // Non-admin users can only view their own orders
        if (req.user.role !== 'admin' && order.customerId !== parseInt(req.user.userId)) {
            return res.status(403).json({ status: false, msg: 'Access denied' });
        }

        // Attach payment method additional text for wire transfer info display (#20)
        if (order.paymentType) {
            const paymentMethod = await prisma.payment.findFirst({
                where: { title: { equals: order.paymentType, mode: 'insensitive' } },
                select: { additionalText: true, additionalTextActive: true }
            });
            if (paymentMethod) {
                order.paymentAdditionalText = paymentMethod.additionalText;
                order.paymentAdditionalTextActive = paymentMethod.additionalTextActive;
            }
        }

        // Net-of-cancellation amounts (out-of-print items excluded) so the customer's
        // account page / invoice match what is actually charged (api/lib/orderTotals.js).
        order.payableTotal = payableTotal(order);
        order.payableShipping = payableShipping(order);
        // Net member discount (cancelled lines give back their share) so My Account / the
        // customer's invoice can show a breakdown that adds up.
        order.payableMembershipDiscount = payableMembershipDiscount(order);

        // Admin only: the free-shipping rule for this order + the live member-discount
        // percentage, so the order form previews exactly the total / shipping / discount the
        // save will compute (api/lib/shippingRule.js, updateOrder).
        if (req.user.role === 'admin') {
            order.shippingRule = await resolveShippingRule(order);
            order.memberDiscountPct = Number((await prisma.settings.findFirst({
                orderBy: { id: 'desc' }, select: { memberDiscount: true },
            }))?.memberDiscount) || 0;
        }

        res.status(200).json({ status: true, data: order });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// POST /orders/guest-track  (public — look up an order by order number + shipping email)
export const guestTrackOrder = async (req, res) => {
    try {
        const { orderId, email } = req.body;
        if (!orderId || !email) {
            return res.status(400).json({ status: false, msg: 'Order number and shipping email are required.' });
        }

        const searchEmail = email.trim().toLowerCase();
        const searchId    = String(orderId).trim();

        // Try to match by numeric ID first, then by order number string.
        // Guard against values that overflow the INT4 `id` column — Prisma throws a
        // ConversionError otherwise (e.g. a bot tracking order "1779996366039"). A too-large /
        // zero / negative value can only be an order-number string, so match on that alone.
        const numericId = parseInt(searchId, 10);
        const isValidId = !isNaN(numericId) && numericId > 0 && numericId <= 2147483647;
        const where = isValidId
            ? { OR: [{ id: numericId }, { orderNumber: searchId }] }
            : { orderNumber: searchId };

        const order = await prisma.order.findFirst({
            where,
            include: ORDER_DETAIL_INCLUDE
        });

        // Validate email match before confirming order exists (prevents email enumeration)
        const orderEmail = order ? (order.shippingEmail || order.customer?.email || '').toLowerCase() : '';
        if (!order || orderEmail !== searchEmail) {
            return res.status(404).json({ status: false, msg: 'No order found matching that order number and email.' });
        }

        order.payableTotal = payableTotal(order);
        order.payableShipping = payableShipping(order);
        // Net member discount (cancelled lines give back their share) so My Account / the
        // customer's invoice can show a breakdown that adds up.
        order.payableMembershipDiscount = payableMembershipDiscount(order);

        res.status(200).json({ status: true, data: order, orderId: order.id });
    } catch (error) {
        console.error('Guest Track Error:', error);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// PUT /orders/:id   (admin — update order fields + optional item-level updates)
export const updateOrder = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ status: false, msg: 'Invalid ID' });

        const updateData = {};

        // Scalar order fields
        if (req.body.status         !== undefined) updateData.status         = req.body.status;
        if (req.body.paymentStatus  !== undefined) updateData.paymentStatus  = req.body.paymentStatus;
        if (req.body.payment_status !== undefined) updateData.paymentStatus  = req.body.payment_status;
        if (req.body.transactionId  !== undefined) updateData.transactionId  = req.body.transactionId;
        if (req.body.transaction_id !== undefined) updateData.transactionId  = req.body.transaction_id;
        if (req.body.total          !== undefined) updateData.total          = Number(req.body.total);
        if (req.body.shippingCost   !== undefined) updateData.shippingCost   = Number(req.body.shippingCost);
        if (req.body.shipping_cost  !== undefined) updateData.shippingCost   = Number(req.body.shipping_cost);
        if (req.body.comment        !== undefined) updateData.comment        = req.body.comment;
        if (req.body.currency       !== undefined) updateData.currency       = req.body.currency;
        if (req.body.paymentType    !== undefined) updateData.paymentType    = req.body.paymentType;
        if (req.body.payment_type   !== undefined) updateData.paymentType    = req.body.payment_type;
        if (req.body.shippingType   !== undefined) updateData.shippingType   = req.body.shippingType;
        if (req.body.shipping_type  !== undefined) updateData.shippingType   = req.body.shipping_type;
        if (req.body.membership     !== undefined) updateData.membership     = req.body.membership;
        if (req.body.membershipDiscount !== undefined) updateData.membershipDiscount = Number(req.body.membershipDiscount);
        if (req.body.paymentLink    !== undefined) updateData.paymentLink    = req.body.paymentLink;
        if (req.body.payment_link   !== undefined) updateData.paymentLink    = req.body.payment_link;
        if (req.body.purchaseOrderNumber !== undefined) updateData.purchaseOrderNumber = req.body.purchaseOrderNumber;
        if (req.body.purchase_order_number !== undefined) updateData.purchaseOrderNumber = req.body.purchase_order_number;
        if (req.body.estimatedDelivery !== undefined) updateData.estimatedDelivery = req.body.estimatedDelivery ? new Date(req.body.estimatedDelivery) : null;
        if (req.body.estimated_delivery !== undefined) updateData.estimatedDelivery = req.body.estimated_delivery ? new Date(req.body.estimated_delivery) : null;
        if (req.body.shippedAt !== undefined) updateData.shippedAt = req.body.shippedAt ? new Date(req.body.shippedAt) : null;

        // Look up current order state once (for shippedAt + payment-paid auto-advance + membership
        // + the money follow-through below, which needs the pre-save totals and line items).
        const existing = await prisma.order.findUnique({
            where: { id },
            select: {
                shippedAt: true, status: true, paymentType: true, membershipPurchased: true, customerId: true,
                total: true, shippingCost: true, currency: true, shippingType: true, paymentStatus: true,
                membershipFee: true, membershipDiscount: true, membership: true, createdAt: true,
                items: { select: { id: true, price: true, quantity: true, status: true } },
            },
        });
        const itemsBefore = existing?.items || [];

        // Live member-discount percentage. Fetched once: the money block re-derives the
        // stored discount with it, and the admin form is sent it so its preview matches.
        const memberPct = Number((await prisma.settings.findFirst({
            orderBy: { id: 'desc' }, select: { memberDiscount: true },
        }))?.memberDiscount) || 0;

        // Admin removed the membership from this order (the × on its row in the items table).
        // Only meaningful while a purchased membership is actually on the order — an existing
        // member simply shopping has no fee to take off.
        const membershipRemoved =
            (req.body.remove_membership === true || req.body.removeMembership === true)
            && membershipFeeOf(existing) > 0;

        // Auto-set shippedAt when status changes to shipped
        const newStatus = (updateData.status || '').toLowerCase();
        if (['shipped', 'partially shipped', 'in transit'].includes(newStatus)) {
            if (!existing?.shippedAt) updateData.shippedAt = new Date();
        }

        // When admin marks payment "Paid", advance a pay-later order out of its pre-payment
        // state so the customer's My Account reflects it (status flips, the "Pay now" button
        // disappears, wire-transfer instructions hide). Only touches pending / approval pending /
        // payment pending orders — never one already processing/shipped/cancelled. An explicit
        // status change in the same save always wins.
        // Purchase Orders are Net-30: the customer pays AFTER receiving the goods, so marking a
        // PO "Paid" must only flip the payment status — the order status stays under the admin's
        // control (they set Processing / Shipped / etc. independently). Wire / UNESCO keep the
        // auto-advance so their pre-payment state clears once payment is confirmed.
        const effectivePaymentType = updateData.paymentType || existing?.paymentType || '';
        let autoAdvancedToInProgress = false;
        if ((updateData.paymentStatus || '').toLowerCase() === 'paid' && updateData.status === undefined
            && !isPurchaseOrder(effectivePaymentType)) {
            const curStatus = (existing?.status || '').toLowerCase();
            if (['pending', 'payment pending', 'approval pending'].includes(curStatus)) {
                updateData.status = 'In Progress';
                autoAdvancedToInProgress = true;
            }
        }

        // Shipping / billing field updates
        const shippingFields = ['shippingEmail','shippingFirstName','shippingLastName','shippingAddress1',
            'shippingAddress2','shippingCompany','shippingCountry','shippingState','shippingCity','shippingPostcode','shippingPhone'];
        const billingFields  = ['billingFirstName','billingLastName','billingAddress1','billingAddress2',
            'billingCompany','billingCountry','billingState','billingCity','billingPostcode','billingPhone'];
        [...shippingFields, ...billingFields].forEach(f => {
            if (req.body[f] !== undefined) updateData[f] = req.body[f];
        });

        await prisma.order.update({
            where: { id }, data: updateData
        });

        // Activate a PURCHASED membership when the admin marks the order Paid (wire / PO / manual)
        // — mirrors the PayPal capture path. Guarded by membershipPurchased so only genuine
        // purchases activate, and the active-member check keeps it idempotent (no re-extension /
        // duplicate welcome email if Paid is toggled twice).
        if ((updateData.paymentStatus || '').toLowerCase() === 'paid'
            && existing?.membershipPurchased && existing?.customerId && !membershipRemoved) {
            const memberNow = await prisma.user.findUnique({
                where: { id: existing.customerId },
                select: { email: true, name: true, membership: true, membershipEnd: true },
            });
            if (!isMembershipActive(memberNow)) {
                const now = new Date();
                const oneYearLater = new Date(now);
                oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
                await prisma.user.update({
                    where: { id: existing.customerId },
                    data: { membership: 'active', membershipStart: now, membershipEnd: oneYearLater },
                });
                if (memberNow?.email) sendMembershipWelcome(memberNow.email, memberNow.name, oneYearLater).catch(() => {});
            }
        }

        // Optional: per-item changes from the admin order form.
        //   rows WITH an id  → update in place (status / courier / tracking / notes)
        //   rows WITHOUT one → newly added via "Search Book to Add" → CREATE them here
        //     (previously they were silently dropped, so adding a book to an existing
        //     order never persisted). Needs the row's productId from the search result;
        //     products that don't exist are skipped rather than 500ing on the FK.
        if (req.body.items && Array.isArray(req.body.items)) {
            const rows = req.body.items;
            const newRows = rows.filter((it) =>
                isNaN(parseInt(it.id)) && !isNaN(parseInt(it.productId ?? it.product_id)));
            let creatable = [];
            if (newRows.length) {
                const pids = [...new Set(newRows.map((it) => parseInt(it.productId ?? it.product_id)))];
                const found = await prisma.product.findMany({ where: { id: { in: pids } }, select: { id: true } });
                const foundIds = new Set(found.map((p) => p.id));
                creatable = newRows.filter((it) => foundIds.has(parseInt(it.productId ?? it.product_id)));
            }

            await Promise.all([
                ...rows.map(item => {
                    const itemId = parseInt(item.id);
                    if (isNaN(itemId)) return Promise.resolve();
                    const itemUpdate = {};
                    // Quantity + price are editable in the admin items table but used to be
                    // dropped here, so "reduce the quantity and save" never persisted (5-Aug).
                    // Blank / unparseable input is ignored rather than written as 0.
                    const qty = parseInt(item.quantity);
                    if (item.quantity !== undefined && !isNaN(qty) && qty >= 1)
                        itemUpdate.quantity = Math.min(1000, qty);
                    const linePrice = Number(item.price);
                    if (item.price !== undefined && item.price !== null && item.price !== ''
                        && !isNaN(linePrice) && linePrice >= 0)
                        itemUpdate.price = Math.round(linePrice * 100) / 100;
                    if (item.status       !== undefined) itemUpdate.status       = item.status;
                    if (item.courierId    !== undefined) itemUpdate.courierId    = parseInt(item.courierId) || null;
                    if (item.trackingCode !== undefined) itemUpdate.trackingCode = item.trackingCode;
                    if (item.returnNote   !== undefined) itemUpdate.returnNote   = item.returnNote;
                    if (item.cancelNote   !== undefined) itemUpdate.cancelNote   = item.cancelNote;
                    return Object.keys(itemUpdate).length
                        ? prisma.orderItem.update({ where: { id: itemId }, data: itemUpdate })
                        : Promise.resolve();
                }),
                ...creatable.map(item => prisma.orderItem.create({
                    data: {
                        orderId:      id,
                        productId:    parseInt(item.productId ?? item.product_id),
                        name:         item.name || '',
                        image:        item.image || '',
                        price:        Number(item.price) || 0,
                        quantity:     parseInt(item.quantity) || 1,
                        status:       item.status || '',
                        courierId:    parseInt(item.courierId) || null,
                        trackingCode: item.trackingCode || '',
                        returnNote:   item.returnNote || '',
                        cancelNote:   item.cancelNote || '',
                    },
                })),
            ]);
        }

        // Rows the admin deleted from the items table (trash icon). Scoped to this order so
        // a stray id can never touch another order's items.
        const removedItemIds = (Array.isArray(req.body.removed_item_ids) ? req.body.removed_item_ids
            : Array.isArray(req.body.removedItemIds) ? req.body.removedItemIds : [])
            .map((x) => parseInt(x)).filter((x) => !isNaN(x));
        if (removedItemIds.length) {
            await prisma.orderItem.deleteMany({ where: { id: { in: removedItemIds }, orderId: id } });
        }

        // The paid auto-advance moved the ORDER to In Progress; mirror it onto the line
        // items (same rule as the PayPal captures — skip cancelled and anything already
        // shipped/delivered/completed) so the status beside each item matches the Order
        // Status box. Must run AFTER the items loop above: EditOrders sends every item's
        // pre-save status on save, which would otherwise overwrite this flip.
        if (autoAdvancedToInProgress) {
            const orderItems = await prisma.orderItem.findMany({ where: { orderId: id }, select: { id: true, status: true } });
            const keepAsIs = ['shipped', 'delivered', 'completed'];
            await Promise.all(orderItems
                .filter((it) => !isCancelledItem(it) && !keepAsIs.includes(String(it.status || '').trim().toLowerCase()))
                .map((it) => prisma.orderItem.update({ where: { id: it.id }, data: { status: 'In Progress' } })));
        }

        // ── Money follows the items (5-Aug-2026) ─────────────────────────────────
        // The admin items table is editable (quantity, price, add / remove a book) and a title
        // can be marked cancelled / out of print — but none of that used to move the order's
        // money. So an order that lost a book kept the FREE shipping it earned at checkout even
        // though the remaining books no longer reach the threshold, and the payment link, the
        // invoice, the customer's My Account and the PayPal charge all under-billed.
        //
        //   • `total` moves by exactly the item delta (+ any shipping change). It is NOT
        //     re-derived from the line items, so gift cards, wallet deductions and the coupon /
        //     membership amounts baked into it survive untouched.
        //   • `total` stays the FULL order value, cancelled lines included — payableTotal()
        //     nets those out for the customer, so subtracting them here would double-count.
        //   • Standard shipping is re-tested against the free-shipping threshold for the
        //     REMAINING (non-cancelled) books. Tiered Expedited / Express shipping is only
        //     re-scaled when the book count changes band, because payableShipping() still
        //     re-bands the cancelled part on the fly from the stored full-band cost.
        //   • Shipping is only touched when the stored figure is the one the rule itself
        //     produced — an admin who typed their own shipping amount keeps it (and the total
        //     then follows that edit instead).
        //   • An order that was ALREADY PAID before this save is left alone: its `total` is the
        //     record of what the customer was actually charged.
        //   • The member discount is a PERCENTAGE of (items + membership fee), so it has to be
        //     recomputed whenever the items move — carrying the original, larger discount would
        //     under-charge the customer by exactly that difference. The admin can also take the
        //     membership off the order entirely, which drops the fee, the discount and the
        //     activation flag together.
        const paidBefore = ['paid', 'completed', 'refunded'].includes(String(existing?.paymentStatus || '').toLowerCase());
        const itemsTouched = (req.body.items && Array.isArray(req.body.items)) || removedItemIds.length > 0;
        if (existing && (itemsTouched || membershipRemoved) && !paidBefore) {
            const itemsAfter = await prisma.orderItem.findMany({
                where: { orderId: id }, select: { price: true, quantity: true, status: true },
            });

            const prevTotal    = Number(existing.total) || 0;
            const prevShipping = Number(existing.shippingCost) || 0;
            const typeChanged  = updateData.shippingType !== undefined && updateData.shippingType !== existing.shippingType;
            const adminSetShipping = updateData.shippingCost !== undefined
                && Number.isFinite(updateData.shippingCost)
                && Math.abs(updateData.shippingCost - prevShipping) > 0.005;

            const itemsDelta = round2(sumItems(itemsAfter) - sumItems(itemsBefore));

            let newShipping = adminSetShipping ? Math.max(0, Number(updateData.shippingCost)) : prevShipping;
            if (!adminSetShipping && !typeChanged) {
                const rule = await resolveShippingRule({ currency: existing.currency, shippingType: existing.shippingType });
                if (rule.tiered) {
                    // Expedited / Express are a FLAT admin price per option — the quantity does
                    // not price them (see payableShipping), so the stored cost stands. Only an
                    // order with no books left at all stops being shipped.
                    if (bookCount(itemsBefore) > 0 && bookCount(itemsAfter) === 0) newShipping = 0;
                } else {
                    // The stored cost counts as rule-managed when it matches what the rule gives
                    // for either the remaining books or the full original set — an order whose
                    // item was cancelled before this change still carries the free shipping it
                    // earned from the full set.
                    const ruleActiveBefore = standardShippingFor(rule, sumItems(activeItems(itemsBefore)));
                    const ruleAllBefore    = standardShippingFor(rule, sumItems(itemsBefore));
                    const managed = ruleActiveBefore !== null
                        && (Math.abs(prevShipping - ruleActiveBefore) < 0.005
                         || Math.abs(prevShipping - ruleAllBefore)    < 0.005);
                    if (managed) {
                        const want = standardShippingFor(rule, sumItems(activeItems(itemsAfter)));
                        if (want !== null) newShipping = want;
                    }
                }
            }

            const shippingDelta = round2(newShipping - prevShipping);

            // Membership: `total` carries it as (+ fee − discount). Re-derive the discount as
            // `settings.member_discount`% of the remaining BOOKS — the fee itself is not
            // discounted. The live setting is read rather than a rate reverse-engineered from
            // the stored amounts, so an order placed under an older convention can't carry that
            // convention forward. Legacy rows (whose column holds a percentage, not money) have
            // membershipDiscountOf() === 0 and are left completely alone. See lib/orderTotals.js.
            const feeBefore  = membershipFeeOf(existing);
            const discBefore = membershipDiscountOf(existing);
            const feeAfter   = membershipRemoved ? 0 : feeBefore;
            const discAfter  = (membershipRemoved || discBefore <= 0)
                ? 0 : memberDiscountFor(itemsAfter, memberPct);
            const feeDelta      = round2(feeAfter - feeBefore);
            const discountDelta = round2(discAfter - discBefore);

            if (itemsDelta !== 0 || shippingDelta !== 0 || feeDelta !== 0 || discountDelta !== 0) {
                await prisma.order.update({
                    where: { id },
                    data: {
                        total:        Math.max(0, round2(prevTotal + itemsDelta + shippingDelta + feeDelta - discountDelta)),
                        shippingCost: Math.max(0, round2(newShipping)),
                        // Only ever written for orders whose discount really is money.
                        ...(discBefore > 0 || membershipRemoved ? { membershipDiscount: discAfter } : {}),
                        ...(membershipRemoved
                            ? { membershipFee: 0, membershipPurchased: false, membership: 'No' }
                            : {}),
                    },
                });
            }
        }

        // Re-fetch after all updates so the response reflects the latest item data
        const freshOrder = await prisma.order.findUnique({ where: { id }, include: ORDER_DETAIL_INCLUDE });
        if (freshOrder) {
            freshOrder.payableTotal    = payableTotal(freshOrder);
            freshOrder.payableShipping = payableShipping(freshOrder);
            freshOrder.payableMembershipDiscount = payableMembershipDiscount(freshOrder);
            freshOrder.shippingRule    = await resolveShippingRule(freshOrder);
            freshOrder.memberDiscountPct = memberPct;
        }
        res.status(200).json({ status: true, msg: 'Order updated successfully', data: freshOrder });
    } catch (error) {
        console.error('Update Order Error:', error.message);
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Order not found' });
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

// POST /orders/:id/approve  (admin — approve a deferred CC/PayPal order, send payment link email)
export const approveOrder = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ status: false, msg: 'Invalid ID' });

        const order = await prisma.order.findUnique({ where: { id }, include: { customer: true } });
        if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });

        if (order.status !== 'approval pending') {
            return res.status(400).json({ status: false, msg: 'Order is not in approval pending state' });
        }

        // Generate a secure random token for the payment link
        const token = crypto.randomBytes(32).toString('hex');
        // Take only the first URL in case env var was accidentally set to multiple comma-separated values
        const frontendUrl = (process.env.FRONTEND_URL || 'https://bagchee.com').split(',')[0].trim();
        const paymentLink = `${frontendUrl}/pay/${order.id}/${token}`;
        console.log(`[approveOrder] Generated payment link for order ${order.id}: ${paymentLink}`);

        const updated = await prisma.order.update({
            where: { id },
            data: { status: 'payment pending', paymentToken: token, paymentLink },
            include: ORDER_DETAIL_INCLUDE
        });

        // Email is NOT sent here — admin must test the link first, then click "Send Email" in the UI
        res.json({ status: true, msg: 'Order approved. Copy and test the payment link, then send the email to the customer.', data: updated });
    } catch (error) {
        console.error('Approve Order Error:', error);
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Order not found' });
        res.status(500).json({ status: false, msg: 'Approval failed' });
    }
};

// POST /orders/:id/resend-payment-link — resend the payment link email to customer
export const resendPaymentLink = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ status: false, msg: 'Invalid ID' });

        const order = await prisma.order.findUnique({ where: { id }, include: { customer: true, items: { include: { product: true } } } });
        if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });
        if (!order.paymentLink) return res.status(400).json({ status: false, msg: 'No payment link for this order' });

        const email = order.shippingEmail || order.customer?.email;
        if (!email) return res.status(400).json({ status: false, msg: 'No customer email found' });

        await sendPaymentLinkEmail(email, order, order.paymentLink);
        res.json({ status: true, msg: 'Payment link email resent successfully' });
    } catch (error) {
        console.error('Resend Payment Link Error:', error);
        res.status(500).json({ status: false, msg: 'Failed to resend payment link' });
    }
};

// POST /orders/:id/send-invoice — customer emails themselves their invoice
export const sendInvoice = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ status: false, msg: 'Invalid ID' });

        const order = await prisma.order.findUnique({ where: { id }, include: { customer: true, items: { include: { product: true } } } });
        if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });

        const email = order.shippingEmail || order.customer?.email;
        if (!email) return res.status(400).json({ status: false, msg: 'No customer email found' });

        await sendInvoiceEmail(email, order);
        res.json({ status: true, msg: 'Invoice sent to ' + email });
    } catch (error) {
        console.error('Send Invoice Error:', error);
        res.status(500).json({ status: false, msg: 'Failed to send invoice' });
    }
};

// DELETE /orders/:id
export const deleteOrder = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ status: false, msg: 'Invalid ID' });
        await prisma.order.delete({ where: { id } });
        res.status(200).json({ status: true, msg: 'Order deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Order not found' });
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};

// GET /orders/my   (user — own orders with pagination)
export const getUserOrders = async (req, res) => {
    try {
        const customerId = parseInt(req.user.userId);
        if (!customerId || isNaN(customerId))
            return res.status(400).json({ status: false, msg: 'User ID is required' });

        const page  = Math.max(1, Number(req.query.page)  || 1);
        const limit = Math.max(1, Number(req.query.limit) || 5);
        const skip  = (page - 1) * limit;

        const where = { customerId };

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    items: {
                        include: {
                            product: { select: { id: true, title: true, defaultImage: true, bagcheeId: true } },
                            courier: { select: { id: true, title: true, trackingPage: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip, take: limit
            }),
            prisma.order.count({ where })
        ]);

        // Attach net-of-cancellation amounts so the list total matches the order detail,
        // the invoice and the amount charged (api/lib/orderTotals.js).
        const data = orders.map((o) => ({
            ...o,
            payableTotal: payableTotal(o),
            payableMembershipDiscount: payableMembershipDiscount(o),
            payableShipping: payableShipping(o),
        }));

        res.status(200).json({
            status: true, data, total,
            page, totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// GET /orders/pay/:orderId/:token  (public — validates token, returns order for payment page)
export const getOrderForPayment = async (req, res) => {
    try {
        const id = parseInt(req.params.orderId);
        if (isNaN(id)) return res.status(400).json({ status: false, msg: 'Invalid order ID' });

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: { select: { name: true, price: true, quantity: true, image: true, status: true } }
            }
        });
        if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });
        if (!order.paymentToken || order.paymentToken !== req.params.token) {
            return res.status(403).json({ status: false, msg: 'Invalid or expired payment link' });
        }

        // Out-of-print items the admin cancelled are excluded — the customer pays only for available titles (#5)
        // A membership bought with the order is not a line item, so it's appended as one here —
        // otherwise the listed items don't add up to the amount being asked for.
        const payableItems = activeItems(order.items).map(({ status, ...it }) => it);
        const memberLine = membershipLine(order);
        if (memberLine) payableItems.push(memberLine);

        // Return minimal order data — no sensitive customer info
        res.json({ status: true, data: {
            id: order.id,
            orderNumber: order.orderNumber,
            total: payableTotal(order),
            currency: order.currency,
            status: order.status,
            items: payableItems,
            memberDiscount: payableMembershipDiscount(order),
            shippingCost: payableShipping(order),
            paymentType: order.paymentType,
        }});
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// POST /orders/:id/send-shipped-email
export const sendShippedEmail = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ status: false, msg: 'Invalid ID' });

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                customer: true,
                items: { select: { trackingCode: true, courierId: true } }
            }
        });
        if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });

        const email = order.shippingEmail || order.customer?.email;
        if (!email) return res.status(400).json({ status: false, msg: 'No customer email found' });

        // Attach courier name and tracking codes for the email template
        const courierIds = [...new Set(order.items.map(i => i.courierId).filter(Boolean))];
        if (courierIds.length) {
            const couriers = await prisma.courier.findMany({ where: { id: { in: courierIds } }, select: { id: true, title: true } });
            const courierMap = Object.fromEntries(couriers.map(c => [c.id, c.title]));
            order.courierName = couriers.length === 1 ? couriers[0].title : couriers.map(c => c.title).join(', ');
            order.items = order.items.map(i => ({ ...i, courierName: i.courierId ? courierMap[i.courierId] : null }));
        }
        const trackingCodes = [...new Set(order.items.map(i => i.trackingCode).filter(Boolean))];
        order.trackingId = trackingCodes.join(', ') || null;

        await sendOrderShippedEmail(email, order);
        res.json({ status: true, msg: `Shipped email sent to ${email}` });
    } catch (error) {
        console.error('Send shipped email error:', error);
        res.status(500).json({ status: false, msg: 'Failed to send email' });
    }
};

// POST /orders/:id/send-status-email
export const sendStatusEmail = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ status: false, msg: 'Invalid ID' });

        const order = await prisma.order.findUnique({ where: { id }, include: { customer: true } });
        if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });

        const email = order.shippingEmail || order.customer?.email;
        if (!email) return res.status(400).json({ status: false, msg: 'No customer email found' });

        await sendOrderStatusEmail(email, order);
        res.json({ status: true, msg: `Status email sent to ${email}` });
    } catch (error) {
        console.error('Send status email error:', error);
        res.status(500).json({ status: false, msg: 'Failed to send email' });
    }
};

// POST /orders/:id/cancel-request  (auth — customer ASKS for their order to be cancelled)
//
// The button in My Account used to cancel the order outright, but it never worked: the owner
// check compared `req.user.id` against customerId and the JWT carries `userId`, so every call
// 403'd ("nothing happens"). Per the client (5-Aug) this is now a REQUEST, not a cancellation:
// the shop is emailed the request, the customer is emailed an acknowledgement, and an admin
// decides — the order status only changes when they set it in the admin order page.
export const requestOrderCancellation = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ status: false, msg: 'Invalid ID' });

        const order = await prisma.order.findUnique({ where: { id }, include: ORDER_DETAIL_INCLUDE });
        if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });

        // Only the order owner may ask (admins can cancel from the admin panel instead)
        const requesterId = parseInt(req.user?.userId);
        if (req.user?.role !== 'admin' && (!order.customerId || order.customerId !== requesterId)) {
            return res.status(403).json({ status: false, msg: 'Not authorized to cancel this order' });
        }

        const blocked = ['shipped', 'partially shipped', 'in transit', 'delivered', 'completed', 'cancelled'];
        if (blocked.includes((order.status || '').toLowerCase())) {
            return res.status(400).json({ status: false, msg: `This order can no longer be cancelled — current status: ${order.status}` });
        }

        // Already asked — don't spam the shop with a second email, just confirm.
        if (order.cancelRequestedAt) {
            return res.json({ status: true, msg: 'Your cancellation request has already been sent. Our team will be in touch.', data: order });
        }

        const updated = await prisma.order.update({
            where: { id },
            data: { cancelRequestedAt: new Date() },
            include: ORDER_DETAIL_INCLUDE,
        });

        // The shop notification is the point of the feature — if it fails, tell the customer
        // rather than silently swallowing it. The acknowledgement to the customer is best-effort.
        await sendCancellationRequestToShop(updated);
        const customerEmail = updated.shippingEmail || updated.customer?.email;
        if (customerEmail) sendCancellationRequestReceived(customerEmail, updated).catch(() => {});

        res.json({ status: true, msg: 'Your cancellation request has been sent.', data: updated });
    } catch (error) {
        console.error('Cancel request error:', error);
        res.status(500).json({ status: false, msg: 'Could not send your cancellation request. Please contact us.' });
    }
};

// GET /orders/:id/invoice — returns print-ready HTML invoice (admin only)
export const getInvoice = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ status: false, msg: 'Invalid ID' });

        const order = await prisma.order.findUnique({
            where: { id },
            include: { customer: true, items: { include: { product: true } } }
        });
        if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });

        const orderNum  = order.orderNumber || order.id;
        const currency  = order.currency || 'USD';
        const esc       = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const dateStr   = new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

        const shippingName = [order.shippingFirstName, order.shippingLastName].filter(Boolean).join(' ');
        const billingName  = [order.billingFirstName,  order.billingLastName ].filter(Boolean).join(' ');
        // Address block as separate lines: Name / Company / Address 1 / Address 2 / City, State Zip / Country
        const addrBlock = (fn, ln, company, a1, a2, city, state, post, country) => {
            const cityStateZip = [[city, state].filter(Boolean).join(', '), post].filter(Boolean).join(' ');
            return [[fn, ln].filter(Boolean).join(' '), company, a1, a2, cityStateZip, country]
                .filter(Boolean).map(esc).join('<br/>');
        };
        const shippingBlock = addrBlock(order.shippingFirstName, order.shippingLastName, order.shippingCompany, order.shippingAddress1, order.shippingAddress2, order.shippingCity, order.shippingState, order.shippingPostcode, order.shippingCountry);
        const billingBlock  = addrBlock(order.billingFirstName,  order.billingLastName,  order.billingCompany,  order.billingAddress1,  order.billingAddress2,  order.billingCity,  order.billingState,  order.billingPostcode,  order.billingCountry);

        // A membership bought with the order is not a line item — append it as one so the
        // invoice's rows actually add up to its Grand Total.
        const invoiceLines = activeItems(order.items);
        const invoiceMemberLine = membershipLine(order);
        if (invoiceMemberLine) invoiceLines.push(invoiceMemberLine);

        const rows = invoiceLines.map(item => `
            <tr>
              <td>${esc(item.name || item.product?.title || 'Item')}</td>
              <td style="text-align:center">${Number(item.quantity) || 1}</td>
              <td style="text-align:right">${currency} ${Number(item.price || 0).toFixed(2)}</td>
              <td style="text-align:right">${currency} ${(Number(item.price || 0) * (Number(item.quantity) || 1)).toFixed(2)}</td>
            </tr>`).join('');

        const invoiceMemberDiscount = payableMembershipDiscount(order);

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice #${esc(String(orderNum))}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#2d2d2d;background:#fff;padding:30px}
    .header{background:#008DDA;color:#fff;padding:24px 32px;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center}
    .header h1{font-size:22px;font-weight:700}
    .header p{font-size:12px;opacity:0.85;margin-top:2px}
    .body{padding:28px 32px;border:1px solid #e6decd;border-top:none;border-radius:0 0 8px 8px}
    .meta{display:flex;justify-content:space-between;margin-bottom:24px}
    .meta-block{font-size:12px;line-height:1.7;color:#555}
    .meta-block strong{display:block;font-size:13px;color:#2d2d2d;margin-bottom:4px}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th{text-align:left;padding:8px 6px;border-bottom:2px solid #008DDA;font-size:11px;text-transform:uppercase;color:#888}
    td{padding:9px 6px;border-bottom:1px solid #e6decd;vertical-align:top}
    .totals{margin-top:16px;text-align:right}
    .totals table{width:auto;float:right}
    .totals td{border:none;padding:4px 8px;font-size:13px}
    .totals .grand{font-size:16px;font-weight:700;color:#008DDA;border-top:2px solid #008DDA}
    .footer{margin-top:32px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #e6decd;padding-top:12px}
    @media print{body{padding:0}@page{margin:15mm}}
  </style>
</head>
<body>
  <div class="header">
    <div><h1>Bagchee</h1><p>books that stick</p></div>
    <div style="text-align:right"><p style="font-size:16px;font-weight:700">Invoice #${esc(String(orderNum))}</p><p>Date: ${dateStr}</p></div>
  </div>
  <div class="body">
    <div class="meta">
      ${shippingName ? `<div class="meta-block"><strong>Ship To</strong>${shippingBlock}</div>` : '<div></div>'}
      ${billingName  ? `<div class="meta-block"><strong>Bill To</strong>${billingBlock}</div>` : '<div></div>'}
      <div class="meta-block" style="text-align:right">
        <strong>Order Details</strong>
        Status: ${esc(order.status || '—')}<br/>
        Payment: ${esc(order.paymentType || '—')}<br/>
        Shipping: ${esc(order.shippingType || '—')}
      </div>
    </div>

    <table>
      <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <table>
        ${invoiceMemberDiscount > 0 ? `<tr><td>Member discount</td><td style="color:#c0392b">&minus;${currency} ${invoiceMemberDiscount.toFixed(2)}</td></tr>` : ''}
        ${payableShipping(order) ? `<tr><td>Shipping</td><td>${currency} ${payableShipping(order).toFixed(2)}</td></tr>` : ''}
        <tr class="grand"><td>Grand Total</td><td>${currency} ${payableTotal(order).toFixed(2)}</td></tr>
      </table>
      <div style="clear:both"></div>
    </div>
  </div>
  <div class="footer">&copy; ${new Date().getFullYear()} Bagchee. All rights reserved. &mdash; 4384/4A Ansari Road, New Delhi 110002, India</div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ status: false, msg: 'Failed to generate invoice' });
    }
};

// POST /orders/:id/send-confirmation-email — admin edits and sends a custom confirmation email
export const sendConfirmationEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, body } = req.body;
        if (!subject?.trim() || !body?.trim())
            return res.status(400).json({ status: false, msg: 'Subject and body are required' });

        const order = await prisma.order.findUnique({
            where: { id: parseInt(id) },
            include: { customer: true }
        });
        if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });

        const email = order.shippingEmail || order.customer?.email;
        if (!email) return res.status(400).json({ status: false, msg: 'No email address found for this order' });

        await sendCustomConfirmationEmail(email, subject, body);
        res.json({ status: true, msg: 'Email sent successfully' });
    } catch (error) {
        console.error('sendConfirmationEmail error:', error);
        res.status(500).json({ status: false, msg: 'Failed to send email' });
    }
};
