import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { sendNewsletterConfirmation } from './email.controller.js';
import { verifyRecaptcha } from '../lib/recaptcha.js';

// Note: Mongoose model had `categories` field — not in Prisma schema, dropped.
// Mongoose used `firstname`/`lastname` — Prisma uses `firstName`/`lastName`.

const SITE_URL = (process.env.FRONTEND_URL || 'https://www.bagchee.com').split(',')[0].trim();
const CONFIRM_PURPOSE = 'newsletter-confirm';
const MIN_FORM_FILL_MS = 1500;   // submissions faster than this are bots
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clientIp = (req) =>
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;

// ── PUBLIC: footer subscription (captcha + honeypot + double opt-in) ──────────
// POST /newsletter-subs/subscribe  { email, categories[], recaptchaToken, website, t }
export const subscribePublic = async (req, res) => {
    try {
        const { email, categories, recaptchaToken, website, t } = req.body;

        // 1. Honeypot — a hidden field real users never see. If filled, it's a bot.
        //    Return a fake success so we don't teach the bot what tripped it.
        if (website) return res.status(200).json({ status: true, msg: 'Almost done! Please check your email to confirm.' });

        // 2. Time-trap — a human can't read the page + tick boxes in < 2.5s.
        const elapsed = t ? Date.now() - Number(t) : Infinity;
        if (Number.isFinite(elapsed) && elapsed < MIN_FORM_FILL_MS) {
            return res.status(200).json({ status: true, msg: 'Almost done! Please check your email to confirm.' });
        }

        // 3. reCAPTCHA v3 (skipped automatically if RECAPTCHA_SECRET is unset).
        const captcha = await verifyRecaptcha(recaptchaToken, clientIp(req));
        if (!captcha.ok) {
            return res.status(400).json({ status: false, msg: 'Could not verify you are human. Please try again.' });
        }

        // 4. Validate email.
        const cleanEmail = (email || '').trim().toLowerCase();
        if (!emailRe.test(cleanEmail)) return res.status(400).json({ status: false, msg: 'Please enter a valid email address.' });

        const cleanCats = Array.isArray(categories)
            ? [...new Set(categories.map(c => String(c).trim()).filter(Boolean))].slice(0, 50)
            : [];

        // 5. Already an ACTIVE subscriber? Stop. Pending? Re-send confirm with latest picks.
        const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: cleanEmail } });
        if (existing?.isActive) {
            return res.status(400).json({ status: false, msg: 'This email is already subscribed.' });
        }
        if (existing) {
            await prisma.newsletterSubscriber.update({ where: { email: cleanEmail }, data: { categories: cleanCats } });
        } else {
            await prisma.newsletterSubscriber.create({ data: { email: cleanEmail, categories: cleanCats, isActive: false } });
        }

        // 6. Double opt-in: email a signed confirmation link. Only clicking it activates.
        const token = jwt.sign({ email: cleanEmail, p: CONFIRM_PURPOSE }, process.env.JWT_SECRET_KEY, { expiresIn: '3d' });
        const confirmUrl = `${SITE_URL}/newsletter/confirm?token=${encodeURIComponent(token)}`;
        sendNewsletterConfirmation(cleanEmail, '', confirmUrl).catch(() => {});

        return res.status(200).json({ status: true, msg: 'Almost done! Please check your email to confirm your subscription.' });
    } catch (error) {
        console.error('subscribePublic error:', error);
        return res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// ── PUBLIC: confirm the double opt-in ─────────────────────────────────────────
// POST /newsletter-subs/confirm  { token }
export const confirmSubscriber = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ status: false, msg: 'Confirmation link is invalid.' });

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
        } catch {
            return res.status(400).json({ status: false, msg: 'This confirmation link has expired or is invalid. Please subscribe again.' });
        }
        if (payload.p !== CONFIRM_PURPOSE || !payload.email) {
            return res.status(400).json({ status: false, msg: 'Confirmation link is invalid.' });
        }

        const email = String(payload.email).trim().toLowerCase();
        const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
        if (existing?.isActive) return res.status(200).json({ status: true, msg: 'Your subscription is already confirmed.' });

        await prisma.newsletterSubscriber.upsert({
            where:  { email },
            update: { isActive: true },
            create: { email, isActive: true, categories: [] },
        });
        return res.status(200).json({ status: true, msg: 'Your subscription is confirmed. Welcome to Bagchee!' });
    } catch (error) {
        console.error('confirmSubscriber error:', error);
        return res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// ── PUBLIC: newsletter categories for the preferences checkboxes ───────────────
// GET /newsletter-subs/categories
export const getNewsletterCategories = async (req, res) => {
    try {
        const cats = await prisma.category.findMany({
            where:   { newsletterCategory: true, active: true },
            select:  { id: true, title: true, slug: true, newsletterOrder: true },
            orderBy: [{ newsletterOrder: 'asc' }, { title: 'asc' }],
        });
        res.status(200).json({ status: true, data: cats });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// ── ADMIN: create a subscriber manually (active immediately, no captcha) ───────
export const saveSubscriber = async (req, res) => {
    try {
        const { email, firstName, lastName, categories } = req.body;
        if (!email) return res.status(400).json({ status: false, msg: 'Email is required.' });

        const cleanEmail = String(email).trim().toLowerCase();
        const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: cleanEmail } });
        if (existing) return res.status(400).json({ status: false, msg: 'Email already subscribed!' });

        const sub = await prisma.newsletterSubscriber.create({
            data: {
                email: cleanEmail,
                firstName: firstName || '',
                lastName: lastName || '',
                categories: Array.isArray(categories) ? categories : [],
                isActive: true,
            }
        });
        res.status(201).json({ status: true, msg: 'Subscribed successfully!', data: sub });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllSubscribers = async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 25;
        const skip = (pageNum - 1) * pageSize;
        const { categories, search, status } = req.query;
        const catFilter = categories ? categories.split(',').map(c => c.trim()).filter(Boolean) : [];
        const where = {};
        // Default to confirmed subscribers only. `status=pending` / `status=all` let an
        // admin inspect unconfirmed (double opt-in) records if ever needed.
        if (status === 'pending')   where.isActive = false;
        else if (status !== 'all')  where.isActive = true;
        if (catFilter.length > 0) where.categories = { hasSome: catFilter };
        if (search) where.email = { contains: search.trim(), mode: 'insensitive' };

        const [subscribers, total] = await Promise.all([
            prisma.newsletterSubscriber.findMany({ where, orderBy: { id: 'desc' }, skip, take: pageSize }),
            prisma.newsletterSubscriber.count({ where })
        ]);
        res.status(200).json({ status: true, data: subscribers, total, totalPages: Math.ceil(total / pageSize), page: pageNum });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getSubscriberById = async (req, res) => {
    try {
        const sub = await prisma.newsletterSubscriber.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!sub) return res.status(404).json({ status: false, msg: 'Subscriber not found' });
        res.status(200).json({ status: true, data: sub });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateSubscriber = async (req, res) => {
    try {
        const { email, firstName, lastName, categories } = req.body;
        const data = { email, firstName: firstName || '', lastName: lastName || '' };
        if (categories !== undefined) data.categories = Array.isArray(categories) ? categories : [];

        const updated = await prisma.newsletterSubscriber.update({
            where: { id: parseInt(req.params.id) },
            data
        });
        res.status(200).json({ status: true, msg: 'Subscriber updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Subscriber not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteSubscriber = async (req, res) => {
    try {
        await prisma.newsletterSubscriber.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Subscriber deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Subscriber not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
