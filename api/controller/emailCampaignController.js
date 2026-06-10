import { createTransporter } from '../lib/mailer.js';
import prisma from '../lib/prisma.js';
import { saveFileLocal } from '../utils/fileHandler.js';
import { v2 as cloudinary } from 'cloudinary';
import { unsubscribeUrl, unsubscribeToken } from '../lib/unsubscribe.js';

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

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

const wrapInTemplate = (subject, bodyHtml, unsubscribeUrl = null, campaignId = null) => {
    const frontendUrl = (process.env.FRONTEND_URL || 'https://www.bagchee.com').split(',')[0].trim();
    const privacyUrl = `${frontendUrl}/privacy-policy`;
    // "View in Browser" opens the sent newsletter as a web page (public route). Falls back
    // to the homepage when there's no campaign id yet (e.g. test sends).
    const viewUrl = campaignId ? `${frontendUrl}/api/email-campaign/${campaignId}/view` : frontendUrl;
    return `
        <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: ${theme.cream}; padding: 40px 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e6decd;">
                <div style="background-color: ${theme.primary}; padding: 30px 35px; text-align: center;">
                    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                        <tr><td style="text-align: center; padding-bottom: 6px;">
                            <div style="display: inline-block; border: 2px solid rgba(255,255,255,0.35); border-radius: 8px; padding: 5px 18px;">
                                <span style="color: #FFFFFF; font-size: 26px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; font-family: 'Inter', Helvetica, Arial, sans-serif;">BAGCHEE</span>
                            </div>
                        </td></tr>
                        <tr><td style="text-align: center;">
                            <p style="color: #FFFFFF; margin: 4px 0 0; opacity: 0.85; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-family: 'Inter', Helvetica, Arial, sans-serif;">Books That Stick</p>
                        </td></tr>
                    </table>
                </div>
                <div style="padding: 40px 30px; color: ${theme.textMain}; font-size: 15px; line-height: 1.7;">
                    ${bodyHtml}
                </div>
                <div style="background-color: #fffdf5; padding: 20px; text-align: center; border-top: 1px solid #e6decd;">
                    <p style="font-size: 11px; color: ${theme.textMuted}; margin: 0 0 8px;"><a href="${viewUrl}" style="color: #008DDA; text-decoration: underline;">VIEW IN BROWSER</a></p>
                    <p style="font-size: 11px; color: ${theme.textMuted}; margin: 0 0 6px;"><a href="${privacyUrl}" style="color: ${theme.textMuted}; text-decoration: underline;">Privacy Policy</a>${unsubscribeUrl ? ` &nbsp;|&nbsp; <a href="${unsubscribeUrl}" style="color: ${theme.textMuted}; text-decoration: underline;">Unsubscribe</a>` : ''}</p>
                    <p style="font-size: 12px; color: ${theme.textMuted}; margin: 0;">&copy; ${new Date().getFullYear()} Bagchee. All rights reserved.</p>
                </div>
            </div>
        </div>
    `;
};

const VALID_AUDIENCES = ['subscribers', 'members', 'purchasers', 'categories', 'specific'];

const sendToAudience = async (subject, bodyHtml, audience, specificEmails = [], selectedCategories = [], campaignId = null) => {
    const transporter = createTransporter();

    const FETCH_BATCH = 500;
    const SEND_BATCH = 10;
    let sent = 0;
    let failed = 0;
    const seenEmails = new Set();

    const flushLogs = async (logs) => {
        if (!campaignId || logs.length === 0) return;
        await prisma.emailDeliveryLog.createMany({ data: logs }).catch(err =>
            console.error('Delivery log insert failed:', err.message)
        );
    };

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
                const results = await Promise.allSettled(batch.map(email => {
                    // Every marketing email carries a working, per-recipient unsubscribe link
                    // (correct /newsletter-subs path + HMAC token — see api/lib/unsubscribe.js).
                    const unsubLink = unsubscribeUrl(email);
                    const htmlContent = wrapInTemplate(escapeHtml(subject), bodyHtml, unsubLink, campaignId);
                    return transporter.sendMail({
                        from: `"Bagchee" <${process.env.EMAIL_USER}>`,
                        to: email,
                        subject,
                        html: htmlContent,
                        headers: { 'List-Unsubscribe': `<${unsubLink}>` }
                    });
                }));

                const logs = [];
                results.forEach((result, idx) => {
                    const email = batch[idx];
                    if (result.status === 'fulfilled') {
                        sent++;
                        if (campaignId) logs.push({ campaignId, email, status: 'sent' });
                    } else {
                        console.error(`Failed to send to ${email}:`, result.reason?.message);
                        failed++;
                        if (campaignId) logs.push({ campaignId, email, status: 'failed', error: (result.reason?.message || 'Unknown').slice(0, 500) });
                    }
                });
                await flushLogs(logs);
            }
        }
    };

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
            const where = { isActive: true };
            if (selectedCategories.length > 0) {
                where.categories = { hasSome: selectedCategories };
            } else {
                where.categories = { isEmpty: false };
            }
            await processModel(prisma.newsletterSubscriber, where, true);
        } else if (aud === 'specific' && specificEmails.length > 0) {
            const emails = specificEmails.filter(e => e && !seenEmails.has(e));
            emails.forEach(e => seenEmails.add(e));
            for (let i = 0; i < emails.length; i += SEND_BATCH) {
                const batch = emails.slice(i, i + SEND_BATCH);
                const results = await Promise.allSettled(batch.map(email => {
                    const htmlContent = wrapInTemplate(escapeHtml(subject), bodyHtml, null, campaignId);
                    return transporter.sendMail({
                        from: `"Bagchee" <${process.env.EMAIL_USER}>`,
                        to: email,
                        subject,
                        html: htmlContent
                    });
                }));
                const logs = [];
                results.forEach((result, idx) => {
                    const email = batch[idx];
                    if (result.status === 'fulfilled') {
                        sent++;
                        if (campaignId) logs.push({ campaignId, email, status: 'sent' });
                    } else {
                        console.error(`Failed to send to ${email}:`, result.reason?.message);
                        failed++;
                        if (campaignId) logs.push({ campaignId, email, status: 'failed', error: (result.reason?.message || 'Unknown').slice(0, 500) });
                    }
                });
                await flushLogs(logs);
            }
        }
    }

    return { sent, failed };
};

export const sendCampaignEmail = async (req, res) => {
    try {
        const { subject, body, audience, specificEmails, selectedCategories } = req.body;

        if (!subject || !body || !audience || !Array.isArray(audience) || audience.length === 0) {
            return res.status(400).json({ status: false, msg: 'Subject, body, and audience array are required.' });
        }

        const invalidAudience = audience.filter(a => !VALID_AUDIENCES.includes(a));
        if (invalidAudience.length > 0) {
            return res.status(400).json({ status: false, msg: `Invalid audience: ${invalidAudience.join(', ')}` });
        }

        const cats = Array.isArray(selectedCategories) ? selectedCategories : [];

        // Create campaign record BEFORE sending so it has an ID for delivery logging
        const campaign = await prisma.scheduledEmail.create({
            data: { subject, body, audience, categories: cats, sendAt: new Date(), status: 'sending', sent: 0, failed: 0 }
        });

        const { sent, failed } = await sendToAudience(subject, body, audience, specificEmails || [], cats, campaign.id);

        if (sent === 0 && failed === 0) {
            await prisma.scheduledEmail.update({ where: { id: campaign.id }, data: { status: 'failed' } });
            return res.status(400).json({ status: false, msg: 'No recipients found for the selected audience.' });
        }

        await prisma.scheduledEmail.update({
            where: { id: campaign.id },
            data: { status: 'sent', sent, failed }
        });

        res.status(200).json({
            status: true,
            msg: `Campaign sent! ${sent} delivered, ${failed} failed.`,
            sent,
            failed,
            total: sent + failed,
            id: campaign.id
        });
    } catch (error) {
        console.error('Campaign send error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const scheduleCampaignEmail = async (req, res) => {
    try {
        const { subject, body, audience, sendAt, selectedCategories } = req.body;

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
                categories: Array.isArray(selectedCategories) ? selectedCategories : [],
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

export const getRecipientsCount = async (req, res) => {
    try {
        const { audience, selectedCategories } = req.query;

        if (!audience) {
            return res.status(400).json({ status: false, msg: 'audience query param required.' });
        }

        const audienceArr = audience.split(',').filter(a => VALID_AUDIENCES.includes(a));
        if (audienceArr.length === 0) {
            return res.status(400).json({ status: false, msg: 'No valid audience keys provided.' });
        }

        const cats = selectedCategories ? selectedCategories.split(',').map(c => c.trim()).filter(Boolean) : [];
        let count = 0;

        for (const aud of audienceArr) {
            if (aud === 'subscribers') {
                count += await prisma.newsletterSubscriber.count({ where: { isActive: true } });
            } else if (aud === 'members') {
                count += await prisma.user.count({ where: { membership: 'active' } });
            } else if (aud === 'purchasers') {
                count += await prisma.user.count({
                    where: { role: 'user', orders: { some: {} } }
                });
            } else if (aud === 'categories') {
                if (cats.length > 0) {
                    count += await prisma.newsletterSubscriber.count({
                        where: { isActive: true, categories: { hasSome: cats } }
                    });
                } else {
                    count += await prisma.newsletterSubscriber.count({
                        where: { isActive: true, categories: { isEmpty: false } }
                    });
                }
            }
        }

        res.status(200).json({ status: true, count });
    } catch (error) {
        console.error('Recipients count error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

/**
 * GET /email-campaign/audience-counts?selectedCategories=cat1,cat2
 * Returns individual counts for each audience type.
 */
export const getAudienceCounts = async (req, res) => {
    try {
        const { selectedCategories } = req.query;
        const cats = selectedCategories ? selectedCategories.split(',').map(c => c.trim()).filter(Boolean) : [];

        const [subscribers, members, purchasers, categories] = await Promise.all([
            prisma.newsletterSubscriber.count({ where: { isActive: true } }),
            prisma.user.count({ where: { membership: 'active' } }),
            prisma.user.count({ where: { role: 'user', orders: { some: {} } } }),
            cats.length > 0
                ? prisma.newsletterSubscriber.count({ where: { isActive: true, categories: { hasSome: cats } } })
                : Promise.resolve(0)
        ]);

        res.status(200).json({ status: true, counts: { subscribers, members, purchasers, categories } });
    } catch (error) {
        console.error('Audience counts error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

/**
 * GET /email-campaign/history
 * Returns all campaigns (sent + scheduled), latest first.
 */
export const getCampaignHistory = async (req, res) => {
    try {
        const campaigns = await prisma.scheduledEmail.findMany({
            orderBy: { createdAt: 'desc' },
            take: 200,
            select: {
                id: true,
                subject: true,
                audience: true,
                categories: true,
                sendAt: true,
                status: true,
                sent: true,
                failed: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.status(200).json({ status: true, data: campaigns });
    } catch (error) {
        console.error('Campaign history error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

/**
 * POST /email-campaign/resend/:id
 * Body: { subject?, audience?, specificEmails?, selectedCategories? }
 * Resends a campaign. Optionally override subject, audience, etc.
 */
export const resendCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, audience, specificEmails, selectedCategories } = req.body;

        const original = await prisma.scheduledEmail.findUnique({ where: { id: parseInt(id) } });
        if (!original) {
            return res.status(404).json({ status: false, msg: 'Campaign not found.' });
        }

        const finalSubject = subject || original.subject;
        const finalAudience = Array.isArray(audience) && audience.length > 0 ? audience : original.audience;
        const finalCategories = Array.isArray(selectedCategories) ? selectedCategories : (original.categories || []);
        const finalSpecificEmails = Array.isArray(specificEmails) ? specificEmails : [];

        // Create resend campaign record first so delivery logs have an ID
        const resendCampaign = await prisma.scheduledEmail.create({
            data: {
                subject: finalSubject,
                body: original.body,
                audience: finalAudience,
                categories: finalCategories,
                sendAt: new Date(),
                status: 'sending',
                sent: 0,
                failed: 0
            }
        });

        const { sent, failed } = await sendToAudience(
            finalSubject,
            original.body,
            finalAudience,
            finalSpecificEmails,
            finalCategories,
            resendCampaign.id
        );

        if (sent === 0 && failed === 0) {
            await prisma.scheduledEmail.update({ where: { id: resendCampaign.id }, data: { status: 'failed' } });
            return res.status(400).json({ status: false, msg: 'No recipients found for the selected audience.' });
        }

        await prisma.scheduledEmail.update({
            where: { id: resendCampaign.id },
            data: { status: 'sent', sent, failed }
        });

        res.status(200).json({
            status: true,
            msg: `Resent! ${sent} delivered, ${failed} failed.`,
            sent,
            failed
        });
    } catch (error) {
        console.error('Resend campaign error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

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
                await prisma.scheduledEmail.update({
                    where: { id: email.id },
                    data: { status: 'sending' }
                });

                const cats = email.categories || [];
                const { sent, failed } = await sendToAudience(email.subject, email.body, email.audience, [], cats, email.id);

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
            select: { id: true, title: true, bagcheeId: true, defaultImage: true, isbn13: true, isbn10: true, price: true, realPrice: true, inrPrice: true }
        });

        res.status(200).json({ status: true, data: products });
    } catch (error) {
        console.error('Fetch products for email error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const unsubscribeNewsletter = async (req, res) => {
    try {
        const { email, token } = req.query;
        if (!email || !token) {
            return res.status(400).send('<p>Invalid unsubscribe link.</p>');
        }

        const expectedToken = unsubscribeToken(decodeURIComponent(email));
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
                <a href="${(process.env.FRONTEND_URL || 'https://www.bagchee.com').split(',')[0].trim()}" style="color:#008DDA;">Back to Bagchee</a>
            </div>
        `);
    } catch (error) {
        console.error('Unsubscribe error:', error.message);
        res.status(500).send('<p>Something went wrong. Please try again.</p>');
    }
};

export const uploadNewsletterBanner = async (req, res) => {
    try {
        if (!req.files || !req.files.banner) {
            return res.status(400).json({ status: false, msg: 'No file uploaded. Field name must be "banner".' });
        }
        const url = await saveFileLocal(req.files.banner, 'newsletter-banners');
        res.status(200).json({ status: true, url });
    } catch (error) {
        console.error('Banner upload error:', error.message);
        res.status(500).json({ status: false, msg: error.message || 'Upload failed.' });
    }
};

export const listNewsletterBanners = async (req, res) => {
    try {
        const result = await cloudinary.search
            .expression('folder:bagchee/newsletter-banners')
            .sort_by('created_at', 'desc')
            .max_results(60)
            .execute();
        const banners = (result.resources || []).map(r => ({
            publicId: r.public_id,
            url: r.secure_url,
            createdAt: r.created_at,
            width: r.width,
            height: r.height,
        }));
        res.status(200).json({ status: true, data: banners });
    } catch (error) {
        console.error('List banners error:', error.message);
        res.status(500).json({ status: false, msg: 'Failed to list banners.' });
    }
};

/**
 * GET /email-campaign/:id
 * Returns a single campaign including body (for preview / detail view).
 */
export const getCampaignById = async (req, res) => {
    try {
        const campaign = await prisma.scheduledEmail.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!campaign) return res.status(404).json({ status: false, msg: 'Campaign not found.' });
        res.json({ status: true, data: campaign });
    } catch (error) {
        console.error('Get campaign error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

/**
 * GET /email-campaign/:id/preview
 * Returns full wrapped HTML ready for iframe rendering.
 */
export const getCampaignPreviewHtml = async (req, res) => {
    try {
        const campaign = await prisma.scheduledEmail.findUnique({
            where: { id: parseInt(req.params.id) },
            select: { subject: true, body: true }
        });
        if (!campaign) return res.status(404).send('<p>Campaign not found</p>');
        const html = wrapInTemplate(escapeHtml(campaign.subject), campaign.body, null, parseInt(req.params.id));
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error) {
        console.error('Campaign preview error:', error.message);
        res.status(500).send('<p>Error loading preview</p>');
    }
};

/**
 * GET /email-campaign/:id/view  (PUBLIC)
 * Renders a sent newsletter as a standalone web page for the footer "View in Browser" link.
 * Newsletter content is public marketing material, so no auth is required.
 */
export const viewCampaignInBrowser = async (req, res) => {
    try {
        const campaign = await prisma.scheduledEmail.findUnique({
            where: { id: parseInt(req.params.id) },
            select: { subject: true, body: true }
        });
        if (!campaign) return res.status(404).send('<p style="font-family:sans-serif;text-align:center;padding:40px;">Newsletter not found.</p>');
        const html = wrapInTemplate(escapeHtml(campaign.subject), campaign.body, null, parseInt(req.params.id));
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error) {
        console.error('Campaign view error:', error.message);
        res.status(500).send('<p style="font-family:sans-serif;text-align:center;padding:40px;">Unable to load this newsletter.</p>');
    }
};

/**
 * GET /email-campaign/:id/delivery-logs?page=1&limit=50&status=all|sent|failed
 * Returns paginated delivery logs for a campaign.
 */
export const getCampaignDeliveryLogs = async (req, res) => {
    try {
        const campaignId = parseInt(req.params.id);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(10, parseInt(req.query.limit) || 50));
        const statusFilter = req.query.status;

        const where = { campaignId };
        if (statusFilter === 'sent' || statusFilter === 'failed') where.status = statusFilter;

        const [total, logs] = await Promise.all([
            prisma.emailDeliveryLog.count({ where }),
            prisma.emailDeliveryLog.findMany({
                where,
                select: { id: true, email: true, status: true, error: true, sentAt: true },
                orderBy: { sentAt: 'asc' },
                skip: (page - 1) * limit,
                take: limit
            })
        ]);

        res.json({ status: true, data: logs, total, page, limit, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Delivery logs error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteNewsletterBanner = async (req, res) => {
    try {
        const { publicId } = req.body;
        if (!publicId) return res.status(400).json({ status: false, msg: 'publicId is required.' });
        await cloudinary.uploader.destroy(publicId);
        res.status(200).json({ status: true, msg: 'Banner deleted.' });
    } catch (error) {
        console.error('Delete banner error:', error.message);
        res.status(500).json({ status: false, msg: 'Failed to delete banner.' });
    }
};
