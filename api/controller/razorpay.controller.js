import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';

const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /razorpay/create-order
// Body: { orderId, currency }
// Amount is read from DB — never trusted from client
export const createRazorpayOrder = async (req, res) => {
    try {
        const { orderId, currency = 'INR' } = req.body;

        if (!orderId) {
            return res.status(400).json({ status: false, msg: 'orderId is required' });
        }

        const dbOrderId = parseInt(orderId);
        if (isNaN(dbOrderId)) {
            return res.status(400).json({ status: false, msg: 'Invalid orderId' });
        }

        // Load order from DB — authoritative source of amount
        const order = await prisma.order.findUnique({ where: { id: dbOrderId } });
        if (!order) {
            return res.status(404).json({ status: false, msg: 'Order not found' });
        }

        // Ownership check — only owner or admin can initiate payment
        if (req.user.role !== 'admin' && order.customerId !== parseInt(req.user.userId)) {
            return res.status(403).json({ status: false, msg: 'Access denied' });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ status: false, msg: 'Order is already paid' });
        }

        // Convert order total (stored in rupees) to paise
        const amountInPaise = Math.round(order.total * 100);
        if (amountInPaise <= 0) {
            return res.status(400).json({ status: false, msg: 'Order total must be greater than 0' });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount:   amountInPaise,
            currency: order.currency || currency,
            receipt:  `rcpt_${dbOrderId}`,
        });

        res.status(200).json({
            status: true,
            data: {
                razorpayOrderId: razorpayOrder.id,
                amount:          razorpayOrder.amount,
                currency:        razorpayOrder.currency,
            }
        });
    } catch (error) {
        console.error('Create Razorpay Order Error:', error.message);
        res.status(500).json({ status: false, msg: 'Failed to create Razorpay order' });
    }
};

// POST /razorpay/create-membership-order
// Creates a Razorpay order for membership purchase (no cart/order needed)
export const createMembershipOrder = async (req, res) => {
    try {
        const { currency = 'INR' } = req.body;

        // Read membership price from latest settings row (or use default)
        const settings = await prisma.settings.findFirst({ orderBy: { id: 'desc' } });
        const priceInr = settings?.membershipCartPriceInr || 2510.87;
        const amountInPaise = Math.round(priceInr * 100);

        if (amountInPaise <= 0) {
            return res.status(400).json({ status: false, msg: 'Invalid membership price' });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount:   amountInPaise,
            currency: 'INR',
            receipt:  `membership_${req.user.userId}_${Date.now()}`,
        });

        res.status(200).json({
            status: true,
            data: {
                razorpayOrderId: razorpayOrder.id,
                amount:          razorpayOrder.amount,
                currency:        razorpayOrder.currency,
                priceInr,
            }
        });
    } catch (error) {
        console.error('Create Membership Order Error:', error.message);
        res.status(500).json({ status: false, msg: 'Failed to create membership order' });
    }
};

// POST /razorpay/verify-membership-payment
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
export const verifyMembershipPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ status: false, msg: 'Missing payment details' });
        }

        const expectedSig = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        const sigBuffer = Buffer.from(razorpay_signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSig, 'hex');
        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
            return res.status(400).json({ status: false, msg: 'Invalid payment signature' });
        }

        const userId = parseInt(req.user.userId);
        const now = new Date();
        const oneYearLater = new Date(now);
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

        await prisma.user.update({
            where: { id: userId },
            data: {
                membership:      'active',
                membershipStart: now,
                membershipEnd:   oneYearLater,
            }
        });

        res.status(200).json({ status: true, msg: 'Membership activated! Valid for 1 year.' });
    } catch (error) {
        console.error('Verify Membership Payment Error:', error.message);
        res.status(500).json({ status: false, msg: 'Membership activation failed' });
    }
};

// POST /razorpay/verify-payment
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }
// orderId — our internal DB order id
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
            return res.status(400).json({
                status: false,
                msg: 'razorpay_order_id, razorpay_payment_id, razorpay_signature, and orderId are required'
            });
        }

        // HMAC-SHA256 signature verification — never skip
        const expectedSig = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        const sigBuffer = Buffer.from(razorpay_signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSig, 'hex');
        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
            return res.status(400).json({ status: false, msg: 'Invalid payment signature' });
        }

        const dbOrderId = parseInt(orderId);
        if (isNaN(dbOrderId)) {
            return res.status(400).json({ status: false, msg: 'Invalid orderId' });
        }

        // Fetch order with items to know which products to increment soldCount on
        const order = await prisma.order.findUnique({
            where:   { id: dbOrderId },
            include: { items: true }
        });

        if (!order) {
            return res.status(404).json({ status: false, msg: 'Order not found' });
        }

        // Idempotency — if already paid, return success without re-processing
        if (order.paymentStatus === 'paid') {
            return res.status(200).json({ status: true, msg: 'Payment already verified' });
        }

        // Ownership check
        if (req.user.role !== 'admin' && order.customerId !== parseInt(req.user.userId)) {
            return res.status(403).json({ status: false, msg: 'Access denied' });
        }

        // Atomically: mark order paid + increment soldCount for each item
        await prisma.$transaction([
            prisma.order.update({
                where: { id: dbOrderId },
                data: {
                    paymentStatus: 'paid',
                    transactionId: razorpay_payment_id,
                }
            }),
            ...order.items.map(item =>
                prisma.product.update({
                    where: { id: item.productId },
                    data:  { soldCount: { increment: item.quantity } }
                })
            )
        ]);

        res.status(200).json({ status: true, msg: 'Payment verified successfully' });
    } catch (error) {
        console.error('Verify Payment Error:', error.message);
        res.status(500).json({ status: false, msg: 'Payment verification failed' });
    }
};
