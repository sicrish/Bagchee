import prisma from '../lib/prisma.js';
import crypto from 'crypto';
import { sendOrderConfirmation, sendOrderShippedEmail, sendOrderStatusEmail, sendPaymentLinkEmail } from './email.controller.js';
import { calcDiscount } from './coupon.controller.js';
import { createGiftCardsForOrder, applyWalletBalance } from './giftCard.controller.js';

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
            product: { select: { id: true, title: true, defaultImage: true, bagcheeId: true, price: true } }
        }
    }
};

// Minimal include for list view (omit heavy product details)
const ORDER_LIST_INCLUDE = {
    customer: { select: { id: true, name: true, email: true } },
    items: { select: { id: true, name: true, price: true, quantity: true, status: true } }
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
        // Admins can place orders on behalf of any user; regular users are bound to their own userId
        const customerId = req.user.role === 'admin'
            ? parseInt(req.body.customer_id || req.body.customerId || req.user.userId)
            : parseInt(req.user.userId);
        if (!customerId || isNaN(customerId))
            return res.status(400).json({ status: false, msg: 'customer_id is required' });

        const products = req.body.products || req.body.items || [];
        const giftCardItems = req.body.giftCardItems || [];

        if (!products.length && !giftCardItems.length)
            return res.status(400).json({ status: false, msg: 'Order must have at least one item' });

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
                select: { id: true, title: true, price: true, defaultImage: true }
            });
            if (dbProducts.length !== productIds.length)
                return res.status(400).json({ status: false, msg: 'One or more products not found' });

            const priceMap = Object.fromEntries(dbProducts.map(p => [p.id, p]));
            itemsData = products.map(p => {
                const pId    = parseInt(p.productId || p.product_id || p.id);
                const dbProd = priceMap[pId];
                return {
                    productId:    pId,
                    name:         p.name || p.title || dbProd.title || '',
                    image:        dbProd.defaultImage || '',
                    price:        dbProd.price,
                    quantity:     Math.min(100, Math.max(1, Number(p.quantity) || 1)),
                    status:       p.status           || '',
                    trackingCode: p.trackingCode || p.tracking_code || '',
                };
            });
        }

        const physicalSubtotal = itemsData.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const giftCardSubtotal = giftCardItems.reduce((sum, gc) => sum + parseFloat(gc.amount), 0);
        const subtotalBeforeGiftWallet = physicalSubtotal + giftCardSubtotal;

        const shippingCost = Math.max(0, Number(req.body.shipping_cost || req.body.shippingCost) || 0);

        // Apply coupon discount server-side — only against physical items subtotal
        const couponId = parseInt(req.body.coupon_id || req.body.couponId) || null;
        let couponDiscount = 0;
        if (couponId && !isNaN(couponId) && physicalSubtotal > 0) {
            const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
            if (coupon && coupon.active) {
                const now = new Date();
                if (now >= coupon.validFrom && now <= coupon.validTo && physicalSubtotal >= (coupon.minimumBuy || 0)) {
                    const cartItems = itemsData.map(i => ({ price: i.price, quantity: i.quantity }));
                    couponDiscount = calcDiscount(coupon, physicalSubtotal, cartItems);
                }
            }
        }

        // Validate membership discount server-side — never trust client-sent value
        let serverMembershipDiscount = 0;
        const clientRequestsMembership = req.body.membership === 'Yes' || req.body.membership === true;
        if (clientRequestsMembership) {
            const [dbUser, dbSettings] = await Promise.all([
                prisma.user.findUnique({ where: { id: customerId }, select: { membership: true } }),
                prisma.settings.findFirst({ orderBy: { id: 'desc' }, select: { memberDiscount: true } })
            ]);
            if (dbUser?.membership === true) {
                const memberDiscountPct = Number(dbSettings?.memberDiscount) || 0;
                serverMembershipDiscount = Math.round((physicalSubtotal * memberDiscountPct / 100) * 100) / 100;
            }
        }

        // Apply gift card wallet balance (server-verified)
        let giftCardWalletDeduction = 0;
        const clientRequestsGiftWallet = parseFloat(req.body.giftCardWalletApplied) || 0;
        if (clientRequestsGiftWallet > 0) {
            const dbUser = await prisma.user.findUnique({ where: { id: customerId }, select: { giftCardBalance: true } });
            const available = dbUser?.giftCardBalance || 0;
            giftCardWalletDeduction = Math.min(available, clientRequestsGiftWallet, subtotalBeforeGiftWallet + shippingCost);
        }

        const subtotal = subtotalBeforeGiftWallet;
        const total = Math.max(0, Math.round((subtotal + shippingCost - couponDiscount - serverMembershipDiscount - giftCardWalletDeduction) * 100) / 100);

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
                prisma.user.findUnique({ where: { id: customerId }, select: { forceDirectPayment: true } })
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
                paymentStatus:      'pending',
                transactionId:      '',
                purchaseOrderNumber,
                membership:         req.body.membership                  || 'No',
                membershipDiscount: serverMembershipDiscount,
                couponId:           couponId && !isNaN(couponId) ? couponId : null,
                comment:            req.body.comment                     || '',

                ...extractShipping(req.body),
                ...extractBilling(req.body),

                items: { create: itemsData }
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

        // Send confirmation email — fire and forget, never fail the order
        const customerEmail = order.shippingEmail || order.customer?.email;
        if (customerEmail) {
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
        const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
        const skip     = (pageNum - 1) * pageSize;

        const conditions = [];

        if (customer_id) {
            const cId = parseInt(customer_id);
            if (!isNaN(cId)) conditions.push({ customerId: cId });
        }

        if (status && status !== 'All') conditions.push({ status });

        if (search) {
            const numericId = parseInt(search);
            conditions.push({ OR: [
                { orderNumber:   { contains: search, mode: 'insensitive' } },
                { shippingEmail: { contains: search, mode: 'insensitive' } },
                { shippingPhone: { contains: search, mode: 'insensitive' } },
                // Search by customer name
                { customer: { name: { contains: search, mode: 'insensitive' } } },
                // Search by product/book name within order items
                { items: { some: { name: { contains: search, mode: 'insensitive' } } } },
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

        // Try to match by numeric ID first, then by order number string
        const numericId = parseInt(searchId);
        const where = isNaN(numericId)
            ? { orderNumber: searchId }
            : { OR: [{ id: numericId }, { orderNumber: searchId }] };

        const order = await prisma.order.findFirst({
            where,
            include: ORDER_DETAIL_INCLUDE
        });

        // Validate email match before confirming order exists (prevents email enumeration)
        const orderEmail = order ? (order.shippingEmail || order.customer?.email || '').toLowerCase() : '';
        if (!order || orderEmail !== searchEmail) {
            return res.status(404).json({ status: false, msg: 'No order found matching that order number and email.' });
        }

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

        // Auto-set shippedAt when status changes to shipped
        const newStatus = updateData.status || '';
        if (['shipped', 'partially shipped', 'in transit'].includes(newStatus.toLowerCase())) {
            const existing = await prisma.order.findUnique({ where: { id }, select: { shippedAt: true } });
            if (!existing?.shippedAt) updateData.shippedAt = new Date();
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

        // Optional: per-item status updates (admin can update individual line items)
        if (req.body.items && Array.isArray(req.body.items)) {
            await Promise.all(req.body.items.map(item => {
                const itemId = parseInt(item.id);
                if (isNaN(itemId)) return Promise.resolve();
                const itemUpdate = {};
                if (item.status       !== undefined) itemUpdate.status       = item.status;
                if (item.courierId    !== undefined) itemUpdate.courierId    = parseInt(item.courierId) || null;
                if (item.trackingCode !== undefined) itemUpdate.trackingCode = item.trackingCode;
                if (item.returnNote   !== undefined) itemUpdate.returnNote   = item.returnNote;
                if (item.cancelNote   !== undefined) itemUpdate.cancelNote   = item.cancelNote;
                return Object.keys(itemUpdate).length
                    ? prisma.orderItem.update({ where: { id: itemId }, data: itemUpdate })
                    : Promise.resolve();
            }));
        }

        // Re-fetch after all updates so the response reflects the latest item data
        const freshOrder = await prisma.order.findUnique({ where: { id }, include: ORDER_DETAIL_INCLUDE });
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
        const frontendUrl = process.env.FRONTEND_URL || 'https://bagchee.com';
        const paymentLink = `${frontendUrl}/pay/${order.id}/${token}`;

        const updated = await prisma.order.update({
            where: { id },
            data: { status: 'payment pending', paymentToken: token, paymentLink },
            include: ORDER_DETAIL_INCLUDE
        });

        // Send payment link email to customer
        const email = order.shippingEmail || order.customer?.email;
        if (email) {
            sendPaymentLinkEmail(email, updated, paymentLink).catch(() => {});
        }

        res.json({ status: true, msg: 'Order approved and payment link sent', data: updated });
    } catch (error) {
        console.error('Approve Order Error:', error);
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Order not found' });
        res.status(500).json({ status: false, msg: 'Approval failed' });
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
                            product: { select: { id: true, title: true, defaultImage: true, bagcheeId: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip, take: limit
            }),
            prisma.order.count({ where })
        ]);

        res.status(200).json({
            status: true, data: orders, total,
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
                items: { select: { name: true, price: true, quantity: true, image: true } }
            }
        });
        if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });
        if (!order.paymentToken || order.paymentToken !== req.params.token) {
            return res.status(403).json({ status: false, msg: 'Invalid or expired payment link' });
        }

        // Return minimal order data — no sensitive customer info
        res.json({ status: true, data: {
            id: order.id,
            orderNumber: order.orderNumber,
            total: order.total,
            currency: order.currency,
            status: order.status,
            items: order.items,
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

// POST /orders/:id/cancel  (auth — customer cancels own order, blocked once shipped)
export const cancelOrder = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ status: false, msg: 'Invalid ID' });

        const order = await prisma.order.findUnique({ where: { id }, select: { id: true, customerId: true, status: true } });
        if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });

        // Only the order owner can cancel
        if (order.customerId !== req.user.id) {
            return res.status(403).json({ status: false, msg: 'Not authorized to cancel this order' });
        }

        const blocked = ['shipped', 'partially shipped', 'in transit', 'delivered', 'completed', 'cancelled'];
        if (blocked.includes((order.status || '').toLowerCase())) {
            return res.status(400).json({ status: false, msg: `Order cannot be cancelled — current status: ${order.status}` });
        }

        const updated = await prisma.order.update({
            where: { id },
            data: { status: 'cancelled' },
            include: ORDER_DETAIL_INCLUDE
        });
        res.json({ status: true, msg: 'Order cancelled successfully.', data: updated });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ status: false, msg: 'Failed to cancel order' });
    }
};
