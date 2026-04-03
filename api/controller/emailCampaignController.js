import nodemailer from 'nodemailer';
import prisma from '../lib/prisma.js';

const theme = {
    primary: "#008DDA",
    cream: "#F7EEDD",
    textMain: "#0B2F3A",
    textLight: "#FFFFFF",
    textMuted: "#4A6fa5"
};

const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

const wrapInTemplate = (subject, bodyHtml, unsubscribeUrl = null) => {
    return `
        <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: ${theme.cream}; padding: 40px 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e6decd;">
                <div style="background-color: ${theme.primary}; padding: 35px; text-align: center;">
                    <h1 style="color: ${theme.textLight}; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">Bagchee</h1>
                    <p style="color: ${theme.textLight}; margin-top: 5px; opacity: 0.9; font-size: 14px;">${subject}</p>
                </div>
                <div style="padding: 40px 30px; color: ${theme.textMain}; font-size: 15px; line-height: 1.7;">
                    ${bodyHtml}
                </div>
                <div style="background-color: #fffdf5; padding: 20px; text-align: center; border-top: 1px solid #e6decd;">
                    <p style="font-size: 12px; color: ${theme.textMuted}; margin: 0;">&copy; ${new Date().getFullYear()} Bagchee. All rights reserved.</p>
                    <p style="font-size: 11px; color: ${theme.textMuted}; margin-top: 6px; opacity: 0.7;">Indore, India</p>
                    ${unsubscribeUrl ? `<p style="font-size: 11px; color: ${theme.textMuted}; margin-top: 8px;">Don't want these emails? <a href="${unsubscribeUrl}" style="color: ${theme.textMuted}; text-decoration: underline;">Unsubscribe</a></p>` : ''}
                </div>
            </div>
        </div>
    `;
};

// Valid audience keys
const VALID_AUDIENCES = ['subscribers', 'members', 'purchasers', 'categories', 'specific'];

/**
 * Core send logic — sends emails to recipients based on audience array.
 * Returns { sent, failed }.
 */
const generateUnsubscribeToken = (email) => {
    return require('crypto')
        .createHmac('sha256', process.env.ENCRYPTION_SECRET || 'bagchee-unsub-secret')
        .update(email.toLowerCase())
        .digest('hex');
};

const sendToAudience = async (subject, bodyHtml, audience, specificEmails = []) => {
    const transporter = createTransporter();

    const FETCH_BATCH = 500;
    const SEND_BATCH = 10;
    let sent = 0;
    let failed = 0;
    const seenEmails = new Set();

    const processModel = async (model, where = {}, isSubscriberModel = false) => {
        let cursor = undefined;
        while (true) {
            const rows = await model.findMany({
                select: { id: true, email: true },
                where,
                take: FETCH_BATCH,
                ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
                orderBy: { id: 'asc' }
            });
            if (rows.length === 0) break;
            cursor = rows[rows.length - 1].id;

            const newEmails = rows
                .map(r => r.email)
                .filter(e => e && !seenEmails.has(e));
            newEmails.forEach(e => seenEmails.add(e));

            for (let i = 0; i < newEmails.length; i += SEND_BATCH) {
                const batch = newEmails.slice(i, i + SEND_BATCH);
                await Promise.all(batch.map(email => {
                    const token = generateUnsubscribeToken(email);
                    const unsubscribeUrl = isSubscriberModel
                        ? `${process.env.FRONTEND_URL || ''}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`
                        : null;
                    const htmlContent = wrapInTemplate(escapeHtml(subject), bodyHtml, unsubscribeUrl);
                    return transporter.sendMail({
                        from: `"Bagchee" <${process.env.EMAIL_USER}>`,
                        to: email,
                        subject,
                        html: htmlContent,
                        headers: unsubscribeUrl ? { 'List-Unsubscribe': `<${unsubscribeUrl}>` } : {}
                    })
                    .then(() => { sent++; })
                    .catch((err) => {
                        console.error(`Failed to send to ${email}:`, err.message);
                        failed++;
                    });
                }));
            }
        }
    };

    // audience is an array like ["subscribers", "members", "purchasers"]
    for (const aud of audience) {
        if (aud === 'subscribers') {
            await processModel(prisma.newsletterSubscriber, { isActive: true }, true);
        } else if (aud === 'members') {
            await processModel(prisma.user, { membership: 'active' });
        } else if (aud === 'purchasers') {
            await processModel(prisma.user, {
                role: 'user',
                orders: { some: {} }
            });
        } else if (aud === 'categories') {
            await processModel(prisma.newsletterSubscriber, {
                isActive: true,
                categories: { isEmpty: false }
            }, true);
        } else if (aud === 'specific' && specificEmails.length > 0) {
            const emails = specificEmails.filter(e => e && !seenEmails.has(e));
            emails.forEach(e => seenEmails.add(e));
            for (let i = 0; i < emails.length; i += SEND_BATCH) {
                const batch = emails.slice(i, i + SEND_BATCH);
                await Promise.all(batch.map(email => {
                    const htmlContent = wrapInTemplate(escapeHtml(subject), bodyHtml, null);
                    return transporter.sendMail({
                        from: `"Bagchee" <${process.env.EMAIL_USER}>`,
                        to: email,
                        subject,
                        html: htmlContent
                    })
                    .then(() => { sent++; })
                    .catch((err) => { console.error(`Failed to send to ${email}:`, err.message); failed++; });
                }));
            }
        }
    }

    return { sent, failed };
};

/**
 * POST /email-campaign/send
 * Body: { subject, body (HTML), audience: string[] }
 * Sends immediately or schedules if sendAt is provided.
 */
export const sendCampaignEmail = async (req, res) => {
    try {
        const { subject, body, audience, specificEmails } = req.body;

        if (!subject || !body || !audience || !Array.isArray(audience) || audience.length === 0) {
            return res.status(400).json({ status: false, msg: 'Subject, body, and audience array are required.' });
        }

        const invalidAudience = audience.filter(a => !VALID_AUDIENCES.includes(a));
        if (invalidAudience.length > 0) {
            return res.status(400).json({ status: false, msg: `Invalid audience: ${invalidAudience.join(', ')}` });
        }

        const { sent, failed } = await sendToAudience(subject, body, audience, specificEmails || []);

        if (sent === 0 && failed === 0) {
            return res.status(400).json({ status: false, msg: 'No recipients found for the selected audience.' });
        }

        res.status(200).json({
            status: true,
            msg: `Campaign sent! ${sent} delivered, ${failed} failed.`,
            sent,
            failed,
            total: sent + failed
        });
    } catch (error) {
        console.error('Campaign send error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

/**
 * POST /email-campaign/schedule
 * Body: { subject, body (HTML), audience: string[], sendAt: ISO date string }
 * Saves the campaign for future sending.
 */
export const scheduleCampaignEmail = async (req, res) => {
    try {
        const { subject, body, audience, sendAt } = req.body;

        if (!subject || !body || !audience || !Array.isArray(audience) || audience.length === 0 || !sendAt) {
            return res.status(400).json({ status: false, msg: 'Subject, body, audience array, and sendAt are required.' });
        }

        const invalidAudience = audience.filter(a => !VALID_AUDIENCES.includes(a));
        if (invalidAudience.length > 0) {
            return res.status(400).json({ status: false, msg: `Invalid audience: ${invalidAudience.join(', ')}` });
        }

        const sendAtDate = new Date(sendAt);
        if (isNaN(sendAtDate.getTime()) || sendAtDate <= new Date()) {
            return res.status(400).json({ status: false, msg: 'sendAt must be a valid future date.' });
        }

        const scheduled = await prisma.scheduledEmail.create({
            data: {
                subject,
                body,
                audience,
                sendAt: sendAtDate,
                status: 'pending'
            }
        });

        res.status(201).json({
            status: true,
            msg: `Campaign scheduled for ${sendAtDate.toLocaleString()}.`,
            id: scheduled.id
        });
    } catch (error) {
        console.error('Schedule campaign error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

/**
 * GET /email-campaign/scheduled
 * Returns list of all scheduled emails (pending + completed).
 */
export const getScheduledEmails = async (req, res) => {
    try {
        const emails = await prisma.scheduledEmail.findMany({
            orderBy: { sendAt: 'desc' },
            take: 50
        });
        res.status(200).json({ status: true, data: emails });
    } catch (error) {
        console.error('Get scheduled emails error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

/**
 * DELETE /email-campaign/scheduled/:id
 * Cancel a pending scheduled email.
 */
export const cancelScheduledEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const email = await prisma.scheduledEmail.findUnique({ where: { id: parseInt(id) } });

        if (!email) {
            return res.status(404).json({ status: false, msg: 'Scheduled email not found.' });
        }
        if (email.status !== 'pending') {
            return res.status(400).json({ status: false, msg: 'Only pending emails can be cancelled.' });
        }

        await prisma.scheduledEmail.update({
            where: { id: parseInt(id) },
            data: { status: 'cancelled' }
        });

        res.status(200).json({ status: true, msg: 'Scheduled email cancelled.' });
    } catch (error) {
        console.error('Cancel scheduled email error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

/**
 * POST /email-campaign/send-test
 * Body: { subject, body (HTML), testEmail }
 */
export const sendTestEmail = async (req, res) => {
    try {
        const { subject, body, testEmail } = req.body;

        if (!subject || !body || !testEmail) {
            return res.status(400).json({ status: false, msg: 'Subject, body, and test email are required.' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
            return res.status(400).json({ status: false, msg: 'Invalid email address.' });
        }

        const transporter = createTransporter();
        const htmlContent = wrapInTemplate(escapeHtml(subject), body);

        await transporter.sendMail({
            from: `"Bagchee" <${process.env.EMAIL_USER}>`,
            to: testEmail,
            subject: `[TEST] ${subject}`,
            html: htmlContent
        });

        res.status(200).json({ status: true, msg: `Test email sent to ${testEmail}` });
    } catch (error) {
        console.error('Test email error:', error.message);
        res.status(500).json({ status: false, msg: 'Failed to send test email.' });
    }
};

/**
 * GET /email-campaign/recipients-count?audience=subscribers,members,purchasers,categories
 * audience is a comma-separated string of audience keys.
 */
export const getRecipientsCount = async (req, res) => {
    try {
        const { audience } = req.query;

        if (!audience) {
            return res.status(400).json({ status: false, msg: 'audience query param required.' });
        }

        const audienceArr = audience.split(',').filter(a => VALID_AUDIENCES.includes(a));
        if (audienceArr.length === 0) {
            return res.status(400).json({ status: false, msg: 'No valid audience keys provided.' });
        }

        let count = 0;

        for (const aud of audienceArr) {
            if (aud === 'subscribers') {
                count += await prisma.newsletterSubscriber.count();
            } else if (aud === 'members') {
                count += await prisma.user.count({ where: { role: 'user' } });
            } else if (aud === 'purchasers') {
                count += await prisma.user.count({
                    where: { role: 'user', orders: { some: {} } }
                });
            } else if (aud === 'categories') {
                count += await prisma.newsletterSubscriber.count({
                    where: { categories: { isEmpty: false } }
                });
            }
        }

        res.status(200).json({ status: true, count });
    } catch (error) {
        console.error('Recipients count error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

/**
 * Processes pending scheduled emails that are due.
 * Called by setInterval in app.js every 60 seconds.
 */
export const processScheduledEmails = async () => {
    try {
        const now = new Date();
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

        // Recover emails stuck in 'sending' for more than 10 min (server restart mid-send)
        await prisma.scheduledEmail.updateMany({
            where: { status: 'sending', updatedAt: { lte: tenMinutesAgo } },
            data: { status: 'pending' }
        });

        const pendingEmails = await prisma.scheduledEmail.findMany({
            where: {
                status: 'pending',
                sendAt: { lte: now }
            },
            take: 5
        });

        for (const email of pendingEmails) {
            try {
                // Mark as sending to prevent duplicate processing
                await prisma.scheduledEmail.update({
                    where: { id: email.id },
                    data: { status: 'sending' }
                });

                const { sent, failed } = await sendToAudience(email.subject, email.body, email.audience);

                await prisma.scheduledEmail.update({
                    where: { id: email.id },
                    data: { status: 'sent', sent, failed }
                });

                console.log(`Scheduled email #${email.id} sent: ${sent} delivered, ${failed} failed.`);
            } catch (err) {
                console.error(`Failed to process scheduled email #${email.id}:`, err.message);
                await prisma.scheduledEmail.update({
                    where: { id: email.id },
                    data: { status: 'failed' }
                });
            }
        }
    } catch (error) {
        console.error('Scheduled email processor error:', error.message);
    }
};

/**
 * POST /email-campaign/products-preview
 * Body: { ids: string[] }  — bagchee_id / isbn13 / isbn10 values
 * Returns product title, image, and ID for email preview.
 */
export const fetchProductsForEmail = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ status: false, msg: 'ids array is required.' });
        }

        const trimmed = ids.map(id => String(id).trim()).filter(Boolean);
        if (trimmed.length === 0) {
            return res.status(400).json({ status: false, msg: 'No valid IDs provided.' });
        }

        const products = await prisma.product.findMany({
            where: {
                OR: trimmed.flatMap(id => [
                    { bagcheeId: id },
                    { isbn13: id },
                    { isbn10: id }
                ])
            },
            select: { id: true, title: true, bagcheeId: true, defaultImage: true, isbn13: true, isbn10: true, price: true, inrPrice: true }
        });

        res.status(200).json({ status: true, data: products });
    } catch (error) {
        console.error('Fetch products for email error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

/**
 * GET /newsletter/unsubscribe?email=xxx&token=yyy
 * Public endpoint — marks subscriber as inactive (unsubscribe).
 */
export const unsubscribeNewsletter = async (req, res) => {
    try {
        const { email, token } = req.query;
        if (!email || !token) {
            return res.status(400).send('<p>Invalid unsubscribe link.</p>');
        }

        const expectedToken = generateUnsubscribeToken(decodeURIComponent(email));
        if (token !== expectedToken) {
            return res.status(400).send('<p>Invalid or expired unsubscribe link.</p>');
        }

        await prisma.newsletterSubscriber.updateMany({
            where: { email: decodeURIComponent(email).toLowerCase() },
            data: { isActive: false }
        });

        res.send(`
            <div style="font-family:Inter,sans-serif;max-width:480px;margin:80px auto;text-align:center;padding:40px;border:1px solid #e6decd;border-radius:12px;">
                <h2 style="color:#0B2F3A;">You've been unsubscribed</h2>
                <p style="color:#666;">You will no longer receive marketing emails from Bagchee.</p>
                <a href="${process.env.FRONTEND_URL || '/'}" style="color:#008DDA;">Back to Bagchee</a>
            </div>
        `);
    } catch (error) {
        console.error('Unsubscribe error:', error.message);
        res.status(500).send('<p>Something went wrong. Please try again.</p>');
    }
};
