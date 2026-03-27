import prisma from '../lib/prisma.js';
import sendOrderConfirmation from './email.controller.js';

// What to include when returning a single order
const ORDER_DETAIL_INCLUDE = {
    customer: { select: { id: true, name: true, email: true, phone: true } },
    coupon:   { select: { id: true, code: true, amount: true, fixAmount: true } },
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
        shippingEmail:     body.shippingEmail     || sd.email      || '',
        shippingFirstName: body.shippingFirstName || sd.first_name || sd.firstName || '',
        shippingLastName:  body.shippingLastName  || sd.last_name  || sd.lastName  || '',
        shippingAddress1:  body.shippingAddress1  || sd.address1   || sd.address   || '',
        shippingAddress2:  body.shippingAddress2  || sd.address2   || '',
        shippingCompany:   body.shippingCompany   || sd.company    || '',
        shippingCountry:   body.shippingCountry   || sd.country    || '',
        shippingState:     body.shippingState     || sd.state      || '',
        shippingCity:      body.shippingCity      || sd.city       || '',
        shippingPostcode:  body.shippingPostcode  || sd.postcode   || sd.pincode   || '',
        shippingPhone:     body.shippingPhone     || sd.phone      || '',
    };
};

const extractBilling = (body) => {
    const bd = body.billing_details || {};
    return {
        billingFirstName: body.billingFirstName || bd.first_name || bd.firstName || '',
        billingLastName:  body.billingLastName  || bd.last_name  || bd.lastName  || '',
        billingAddress1:  body.billingAddress1  || bd.address1   || bd.address   || '',
        billingAddress2:  body.billingAddress2  || bd.address2   || '',
        billingCompany:   body.billingCompany   || bd.company    || '',
        billingCountry:   body.billingCountry   || bd.country    || '',
        billingState:     body.billingState     || bd.state      || '',
        billingCity:      body.billingCity      || bd.city       || '',
        billingPostcode:  body.billingPostcode  || bd.postcode   || bd.pincode   || '',
        billingPhone:     body.billingPhone     || bd.phone      || '',
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
        if (!products.length)
            return res.status(400).json({ status: false, msg: 'Order must have at least one product' });

        // Validate all productIds and fetch authoritative prices from DB
        const productIds = products.map(p => parseInt(p.productId || p.product_id || p.id));
        if (productIds.some(isNaN))
            return res.status(400).json({ status: false, msg: 'All products must have a valid productId' });

        const currency = req.body.currency || 'INR';
        const useInr   = currency === 'INR';

        const dbProducts = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, title: true, price: true, inrPrice: true }
        });
        if (dbProducts.length !== productIds.length)
            return res.status(400).json({ status: false, msg: 'One or more products not found' });

        const priceMap = Object.fromEntries(dbProducts.map(p => [p.id, p]));

        // Build items using server-side prices — never trust client-sent prices
        const itemsData = products.map(p => {
            const pId    = parseInt(p.productId || p.product_id || p.id);
            const dbProd = priceMap[pId];
            const dbPrice = useInr ? (dbProd.inrPrice || dbProd.price) : dbProd.price;
            return {
                productId:    pId,
                name:         p.name || p.title || dbProd.title || '',
                price:        dbPrice,
                quantity:     Math.max(1, Number(p.quantity) || 1),
                status:       p.status           || '',
                trackingCode: p.trackingCode || p.tracking_code || '',
            };
        });

        // Calculate subtotal from server-side prices
        const subtotal     = itemsData.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const shippingCost = Math.max(0, Number(req.body.shipping_cost || req.body.shippingCost) || 0);

        // Apply coupon discount server-side — never trust client-sent discount
        const couponId = parseInt(req.body.coupon_id || req.body.couponId) || null;
        let couponDiscount = 0;
        if (couponId && !isNaN(couponId)) {
            const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
            if (coupon && coupon.active) {
                const now = new Date();
                if (now >= coupon.validFrom && now <= coupon.validTo && subtotal >= coupon.minimumBuy) {
                    couponDiscount = coupon.fixAmount
                        ? Math.min(coupon.amount, subtotal)
                        : Math.round((subtotal * coupon.amount / 100) * 100) / 100;
                }
            }
        }

        const total = Math.max(0, Math.round((subtotal + shippingCost - couponDiscount) * 100) / 100);

        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const order = await prisma.order.create({
            data: {
                orderNumber,
                customerId,
                total,
                shippingCost,
                currency,
                paymentType:        req.body.payment_type || req.body.paymentType  || '',
                shippingType:       req.body.shipping_type || req.body.shippingType || '',
                status:             'pending',
                paymentStatus:      'pending',
                transactionId:      '',
                membership:         req.body.membership                  || 'No',
                membershipDiscount: Math.max(0, Number(req.body.membership_discount || req.body.membershipDiscount) || 0),
                couponId:           couponId && !isNaN(couponId) ? couponId : null,
                comment:            req.body.comment                     || '',

                ...extractShipping(req.body),
                ...extractBilling(req.body),

                items: { create: itemsData }
            },
            include: ORDER_DETAIL_INCLUDE
        });

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

        if (search) conditions.push({ OR: [
            { orderNumber:    { contains: search, mode: 'insensitive' } },
            { shippingEmail:  { contains: search, mode: 'insensitive' } },
            { shippingPhone:  { contains: search, mode: 'insensitive' } },
        ]});

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

        // Shipping / billing field updates
        const shippingFields = ['shippingEmail','shippingFirstName','shippingLastName','shippingAddress1',
            'shippingAddress2','shippingCompany','shippingCountry','shippingState','shippingCity','shippingPostcode','shippingPhone'];
        const billingFields  = ['billingFirstName','billingLastName','billingAddress1','billingAddress2',
            'billingCompany','billingCountry','billingState','billingCity','billingPostcode','billingPhone'];
        [...shippingFields, ...billingFields].forEach(f => {
            if (req.body[f] !== undefined) updateData[f] = req.body[f];
        });

        const updatedOrder = await prisma.order.update({
            where: { id }, data: updateData, include: ORDER_DETAIL_INCLUDE
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

        res.status(200).json({ status: true, msg: 'Order updated successfully', data: updatedOrder });
    } catch (error) {
        console.error('Update Order Error:', error.message);
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Order not found' });
        res.status(500).json({ status: false, msg: 'Update failed' });
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
