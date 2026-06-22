import prisma from '../lib/prisma.js';
import { sendBackInStockEmail } from './email.controller.js';

const SITE_URL = (process.env.FRONTEND_URL || 'https://www.bagchee.com').split(',')[0].trim();

// POST /back-in-stock/subscribe
export const subscribe = async (req, res) => {
    try {
        const { email, productId } = req.body;
        if (!email || !productId) return res.status(400).json({ status: false, msg: 'Email and productId are required' });

        const pid = parseInt(productId);
        if (isNaN(pid)) return res.status(400).json({ status: false, msg: 'Invalid productId' });

        await prisma.backInStockNotification.upsert({
            where: { email_productId: { email, productId: pid } },
            update: { notified: false },
            create: { email, productId: pid }
        });

        res.json({ status: true, msg: "We'll notify you when it's back in stock!" });
    } catch (error) {
        console.error('Back-in-stock subscribe error:', error.message);
        res.status(500).json({ status: false, msg: 'Server error' });
    }
};

// Called internally when a product's stock changes to 'active'
export const notifySubscribers = async (productId, productTitle, bagcheeId) => {
    try {
        const pending = await prisma.backInStockNotification.findMany({
            where: { productId, notified: false }
        });
        if (!pending.length) return;

        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                title: true, bagcheeId: true,
                defaultImage: true, price: true, inrPrice: true, synopsis: true,
                authors: { select: { author: { select: { firstName: true, lastName: true } } }, take: 1 }
            }
        });

        const slug = (product?.slug) || (productTitle || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const productUrl = `${SITE_URL}/books/${bagcheeId}/${slug}`;

        const firstAuthor = product?.authors?.[0]?.author;
        const authorName = firstAuthor ? `${firstAuthor.firstName || ''} ${firstAuthor.lastName || ''}`.trim() : '';

        const productData = {
            title: product?.title || productTitle,
            defaultImage: product?.defaultImage || null,
            price: product?.price || null,
            inrPrice: product?.inrPrice || null,
            synopsis: product?.synopsis || null,
            authorName,
        };

        await Promise.all(pending.map(n => sendBackInStockEmail(n.email, null, productData, productUrl)));

        await prisma.backInStockNotification.updateMany({
            where: { productId, notified: false },
            data: { notified: true }
        });
    } catch (error) {
        console.error('notifySubscribers error:', error.message);
    }
};
