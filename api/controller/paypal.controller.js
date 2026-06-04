import prisma from '../lib/prisma.js';
import { sendMembershipWelcome, sendOrderConfirmation } from './email.controller.js';
import { activeItems, payableTotal } from '../lib/orderTotals.js';

const PAYPAL_BASE = 'https://api-m.paypal.com';

// Supported PayPal currencies (INR not accepted for merchant receipts)
const PAYPAL_CURRENCIES = new Set(['USD','EUR','GBP','AUD','CAD','SGD','HKD','NZD','CHF','SEK','NOK','DKK']);

async function getAccessToken() {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
    const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`PayPal auth failed: ${data.error_description || JSON.stringify(data)}`);
    return data.access_token;
}

// POST /paypal/create-order-by-token
// Body: { orderId, token } — for customers arriving via payment link email (no JWT)
export const createPayPalOrderByToken = async (req, res) => {
    try {
        const { orderId, token } = req.body;
        if (!orderId || !token) return res.status(400).json({ status: false, msg: 'orderId and token are required' });

        const dbOrderId = parseInt(orderId);
        if (isNaN(dbOrderId)) return res.status(400).json({ status: false, msg: 'Invalid orderId' });

        const order = await prisma.order.findUnique({ where: { id: dbOrderId }, include: { items: true } });
        if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });
        if (!order.paymentToken || order.paymentToken !== token) {
            return res.status(403).json({ status: false, msg: 'Invalid or expired payment link' });
        }
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ status: false, msg: 'Order is already paid' });
        }

        // Charge only the available titles — cancelled out-of-print items are excluded (#5)
        const payable = payableTotal(order);
        if (payable <= 0) {
            return res.status(400).json({ status: false, msg: 'No payable items remain on this order' });
        }

        const ppCurrency = PAYPAL_CURRENCIES.has(order.currency) ? order.currency : 'USD';
        const accessToken = await getAccessToken();
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();

        const ppRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    reference_id: `bagchee_${dbOrderId}`,
                    description: `Order #${order.orderNumber}`,
                    amount: { currency_code: ppCurrency, value: payable.toFixed(2) },
                }],
                application_context: {
                    brand_name: 'Bagchee',
                    landing_page: 'NO_PREFERENCE',
                    user_action: 'PAY_NOW',
                    shipping_preference: 'NO_SHIPPING',
                    return_url: `${frontendUrl}/paypal-return`,
                    cancel_url: `${frontendUrl}/pay/${dbOrderId}/${token}?paypal_cancelled=1`,
                },
            }),
        });

        const ppData = await ppRes.json();
        if (!ppRes.ok) {
            console.error('PayPal create order error:', JSON.stringify(ppData));
            return res.status(500).json({ status: false, msg: 'Failed to create PayPal order' });
        }

        const approvalUrl = ppData.links?.find(l => l.rel === 'approve')?.href;
        if (!approvalUrl) {
            return res.status(500).json({ status: false, msg: 'PayPal did not return approval URL' });
        }

        // Store orderId in session so PayPalReturn.jsx can capture it
        res.json({ status: true, data: { approvalUrl, paypalOrderId: ppData.id, orderId: dbOrderId, orderNumber: order.orderNumber } });
    } catch (error) {
        console.error('Create PayPal Order By Token Error:', error.message);
        res.status(500).json({ status: false, msg: 'Failed to create PayPal order' });
    }
};

// POST /paypal/create-order
// Body: { orderId }
// Returns: { approvalUrl, paypalOrderId }
export const createPayPalOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) return res.status(400).json({ status: false, msg: 'orderId is required' });

        const dbOrderId = parseInt(orderId);
        if (isNaN(dbOrderId)) return res.status(400).json({ status: false, msg: 'Invalid orderId' });

        const order = await prisma.order.findUnique({ where: { id: dbOrderId }, include: { items: true } });
        if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });

        if (req.user.role !== 'admin' && order.customerId !== parseInt(req.user.userId)) {
            return res.status(403).json({ status: false, msg: 'Access denied' });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ status: false, msg: 'Order is already paid' });
        }

        // Block PayPal for orders awaiting admin approval (deferred mode)
        if (order.status === 'approval pending') {
            return res.status(400).json({ status: false, msg: 'This order is awaiting admin approval before payment can be made.' });
        }

        // Charge only the available titles — cancelled out-of-print items are excluded (#5)
        const payable = payableTotal(order);
        if (payable <= 0) {
            return res.status(400).json({ status: false, msg: 'No payable items remain on this order' });
        }

        const ppCurrency = PAYPAL_CURRENCIES.has(order.currency) ? order.currency : 'USD';
        const accessToken = await getAccessToken();

        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();

        const ppRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    reference_id: `bagchee_${dbOrderId}`,
                    description: `Order #${order.orderNumber}`,
                    amount: { currency_code: ppCurrency, value: payable.toFixed(2) },
                }],
                application_context: {
                    brand_name: 'Bagchee',
                    landing_page: 'NO_PREFERENCE',
                    user_action: 'PAY_NOW',
                    shipping_preference: 'NO_SHIPPING',
                    return_url: `${frontendUrl}/paypal-return`,
                    cancel_url: `${frontendUrl}/checkout?paypal_cancelled=1`,
                },
            }),
        });

        const ppData = await ppRes.json();
        if (!ppRes.ok) {
            console.error('PayPal create order error:', JSON.stringify(ppData));
            return res.status(500).json({ status: false, msg: 'Failed to create PayPal order' });
        }

        const approvalUrl = ppData.links?.find(l => l.rel === 'approve')?.href;
        if (!approvalUrl) {
            return res.status(500).json({ status: false, msg: 'PayPal did not return approval URL' });
        }

        res.json({ status: true, data: { approvalUrl, paypalOrderId: ppData.id } });
    } catch (error) {
        console.error('Create PayPal Order Error:', error.message);
        res.status(500).json({ status: false, msg: 'Failed to create PayPal order' });
    }
};

// POST /paypal/capture-by-token
// Body: { token, orderId, paymentToken } — for non-logged-in customers via payment link email
export const capturePayPalOrderByToken = async (req, res) => {
    try {
        const { token, orderId, paymentToken } = req.body;
        if (!token || !orderId || !paymentToken) {
            return res.status(400).json({ status: false, msg: 'token, orderId and paymentToken are required' });
        }

        const dbOrderId = parseInt(orderId);
        if (isNaN(dbOrderId)) return res.status(400).json({ status: false, msg: 'Invalid orderId' });

        const order = await prisma.order.findUnique({
            where: { id: dbOrderId },
            include: { items: true },
        });
        if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });

        // Validate Bagchee payment token
        if (!order.paymentToken || order.paymentToken !== paymentToken) {
            return res.status(403).json({ status: false, msg: 'Invalid or expired payment link' });
        }

        // Idempotency
        if (order.paymentStatus === 'paid') {
            return res.status(200).json({ status: true, msg: 'Payment already captured', data: order });
        }

        const accessToken = await getAccessToken();
        const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${token}/capture`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        });

        const captureData = await captureRes.json();
        if (!captureRes.ok || captureData.status !== 'COMPLETED') {
            console.error('PayPal capture error:', JSON.stringify(captureData));
            return res.status(400).json({ status: false, msg: 'Payment capture failed — please contact support' });
        }

        const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;

        await prisma.$transaction([
            prisma.order.update({
                where: { id: dbOrderId },
                data: { paymentStatus: 'paid', transactionId: captureId || token },
            }),
            ...activeItems(order.items).map(item =>
                prisma.product.update({
                    where: { id: item.productId },
                    data: { soldCount: { increment: item.quantity } },
                })
            ),
        ]);

        // Send order confirmation email
        const customerEmail = order.shippingEmail;
        if (customerEmail) {
            const fullOrder = await prisma.order.findUnique({
                where: { id: dbOrderId },
                include: {
                    items: { include: { product: { select: { title: true, bagcheeId: true } } } },
                    customer: { select: { name: true, email: true } }
                }
            });
            if (fullOrder) sendOrderConfirmation(customerEmail, fullOrder).catch(() => {});
        }

        // Activate membership if applicable
        if (order.membership === 'Yes' && order.customerId) {
            const now = new Date();
            const oneYearLater = new Date(now);
            oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
            const user = await prisma.user.update({
                where: { id: order.customerId },
                data: { membership: 'active', membershipStart: now, membershipEnd: oneYearLater },
                select: { email: true, name: true }
            });
            sendMembershipWelcome(user.email, user.name, oneYearLater).catch(() => {});
        }

        res.json({ status: true, msg: 'Payment captured successfully' });
    } catch (error) {
        console.error('Capture PayPal By Token Error:', error.message);
        res.status(500).json({ status: false, msg: 'Payment capture failed' });
    }
};

// POST /paypal/capture-order
// Body: { token, orderId } — token is the PayPal order ID from redirect ?token= param
export const capturePayPalOrder = async (req, res) => {
    try {
        const { token, orderId } = req.body;
        if (!token || !orderId) return res.status(400).json({ status: false, msg: 'token and orderId are required' });

        const dbOrderId = parseInt(orderId);
        if (isNaN(dbOrderId)) return res.status(400).json({ status: false, msg: 'Invalid orderId' });

        const order = await prisma.order.findUnique({
            where: { id: dbOrderId },
            include: { items: true },
        });
        if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });

        // Idempotency — safe to call twice
        if (order.paymentStatus === 'paid') {
            return res.status(200).json({ status: true, msg: 'Payment already captured', data: order });
        }

        if (req.user.role !== 'admin' && order.customerId !== parseInt(req.user.userId)) {
            return res.status(403).json({ status: false, msg: 'Access denied' });
        }

        const accessToken = await getAccessToken();

        const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${token}/capture`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        });

        const captureData = await captureRes.json();
        if (!captureRes.ok || captureData.status !== 'COMPLETED') {
            console.error('PayPal capture error:', JSON.stringify(captureData));
            return res.status(400).json({ status: false, msg: 'Payment capture failed — please contact support' });
        }

        const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;

        await prisma.$transaction([
            prisma.order.update({
                where: { id: dbOrderId },
                data: { paymentStatus: 'paid', transactionId: captureId || token },
            }),
            ...activeItems(order.items).map(item =>
                prisma.product.update({
                    where: { id: item.productId },
                    data: { soldCount: { increment: item.quantity } },
                })
            ),
        ]);

        // Send order confirmation email now that payment is confirmed
        const customerEmail = order.shippingEmail || order.customer?.email;
        if (customerEmail) {
            const fullOrder = await prisma.order.findUnique({
                where: { id: dbOrderId },
                include: {
                    items: { include: { product: { select: { title: true, bagcheeId: true } } } },
                    customer: { select: { name: true, email: true } }
                }
            });
            if (fullOrder) sendOrderConfirmation(customerEmail, fullOrder).catch(() => {});
        }

        // Activate membership if this order included one
        if (order.membership === 'Yes' && order.customerId) {
            const now = new Date();
            const oneYearLater = new Date(now);
            oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
            const user = await prisma.user.update({
                where: { id: order.customerId },
                data: { membership: 'active', membershipStart: now, membershipEnd: oneYearLater },
                select: { email: true, name: true }
            });
            sendMembershipWelcome(user.email, user.name, oneYearLater).catch(() => {});
        }

        res.json({ status: true, msg: 'Payment captured successfully' });
    } catch (error) {
        console.error('Capture PayPal Order Error:', error.message);
        res.status(500).json({ status: false, msg: 'Payment capture failed' });
    }
};
