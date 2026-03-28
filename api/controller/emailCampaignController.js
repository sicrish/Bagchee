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

const wrapInTemplate = (subject, bodyHtml) => {
    return `
        <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: ${theme.cream}; padding: 40px 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e6decd;">
                <div style="background-color: ${theme.primary}; padding: 35px; text-align: center;">
                    <h1 style="color: ${theme.textLight}; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">Bagchee</h1>
                    <p style="color: ${theme.textLight}; margin-top: 5px; opacity: 0.9; font-size: 14px;">Your Favorite Bookstore</p>
                </div>
                <div style="padding: 40px 30px; color: ${theme.textMain}; font-size: 15px; line-height: 1.7;">
                    ${bodyHtml}
                </div>
                <div style="background-color: #fffdf5; padding: 20px; text-align: center; border-top: 1px solid #e6decd;">
                    <p style="font-size: 12px; color: ${theme.textMuted}; margin: 0;">&copy; ${new Date().getFullYear()} Bagchee. All rights reserved.</p>
                    <p style="font-size: 11px; color: ${theme.textMuted}; margin-top: 6px; opacity: 0.7;">Indore, India</p>
                </div>
            </div>
        </div>
    `;
};

/**
 * POST /email-campaign/send
 * Body: { subject, body (HTML), audience: "subscribers" | "customers" | "all" }
 */
export const sendCampaignEmail = async (req, res) => {
    try {
        const { subject, body, audience } = req.body;

        if (!subject || !body || !audience) {
            return res.status(400).json({ status: false, msg: 'Subject, body, and audience are required.' });
        }

        if (!['subscribers', 'customers', 'all'].includes(audience)) {
            return res.status(400).json({ status: false, msg: 'Audience must be "subscribers", "customers", or "all".' });
        }

        const transporter = createTransporter();
        const htmlContent = wrapInTemplate(escapeHtml(subject), body);

        const FETCH_BATCH = 500; // Fetch from DB in chunks
        const SEND_BATCH = 10;   // Send emails in parallel chunks
        let sent = 0;
        let failed = 0;
        const seenEmails = new Set();

        // Helper: fetch emails in cursor-paginated batches and send
        const processModel = async (model, where = {}) => {
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

                // Deduplicate and collect new emails
                const newEmails = rows
                    .map(r => r.email)
                    .filter(e => e && !seenEmails.has(e));
                newEmails.forEach(e => seenEmails.add(e));

                // Send in small batches
                for (let i = 0; i < newEmails.length; i += SEND_BATCH) {
                    const batch = newEmails.slice(i, i + SEND_BATCH);
                    await Promise.all(batch.map(email =>
                        transporter.sendMail({
                            from: `"Bagchee" <${process.env.EMAIL_USER}>`,
                            to: email,
                            subject,
                            html: htmlContent
                        })
                        .then(() => { sent++; })
                        .catch((err) => {
                            console.error(`Failed to send to ${email}:`, err.message);
                            failed++;
                        })
                    ));
                }
            }
        };

        if (audience === 'subscribers' || audience === 'all') {
            await processModel(prisma.newsletterSubscriber);
        }
        if (audience === 'customers' || audience === 'all') {
            await processModel(prisma.user, { role: 'user' });
        }

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
 * GET /email-campaign/recipients-count?audience=subscribers|customers|all
 * Returns the count of recipients for preview (uses DB count, not findMany)
 */
export const getRecipientsCount = async (req, res) => {
    try {
        const { audience } = req.query;

        if (!audience || !['subscribers', 'customers', 'all'].includes(audience)) {
            return res.status(400).json({ status: false, msg: 'Valid audience param required.' });
        }

        let count = 0;

        if (audience === 'subscribers') {
            count = await prisma.newsletterSubscriber.count();
        } else if (audience === 'customers') {
            count = await prisma.user.count({ where: { role: 'user' } });
        } else {
            // "all" — count both, approximate (some overlap possible)
            const [subCount, userCount] = await Promise.all([
                prisma.newsletterSubscriber.count(),
                prisma.user.count({ where: { role: 'user' } })
            ]);
            count = subCount + userCount;
        }

        res.status(200).json({ status: true, count });
    } catch (error) {
        console.error('Recipients count error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
