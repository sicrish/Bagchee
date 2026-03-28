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

        // Collect recipient emails based on audience
        let emails = [];

        if (audience === 'subscribers' || audience === 'all') {
            const subs = await prisma.newsletterSubscriber.findMany({ select: { email: true } });
            emails.push(...subs.map(s => s.email));
        }

        if (audience === 'customers' || audience === 'all') {
            const users = await prisma.user.findMany({
                where: { role: 'user' },
                select: { email: true }
            });
            emails.push(...users.map(u => u.email));
        }

        // Deduplicate
        const uniqueEmails = [...new Set(emails.filter(Boolean))];

        if (uniqueEmails.length === 0) {
            return res.status(400).json({ status: false, msg: 'No recipients found for the selected audience.' });
        }

        const transporter = createTransporter();
        const htmlContent = wrapInTemplate(escapeHtml(subject), body);

        // Send emails in batches of 10 to avoid Gmail rate limits
        const BATCH_SIZE = 10;
        let sent = 0;
        let failed = 0;

        for (let i = 0; i < uniqueEmails.length; i += BATCH_SIZE) {
            const batch = uniqueEmails.slice(i, i + BATCH_SIZE);
            const promises = batch.map(email =>
                transporter.sendMail({
                    from: `"Bagchee" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: subject,
                    html: htmlContent
                })
                .then(() => { sent++; })
                .catch((err) => {
                    console.error(`Failed to send to ${email}:`, err.message);
                    failed++;
                })
            );
            await Promise.all(promises);
        }

        res.status(200).json({
            status: true,
            msg: `Campaign sent! ${sent} delivered, ${failed} failed.`,
            sent,
            failed,
            total: uniqueEmails.length
        });
    } catch (error) {
        console.error('Campaign send error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

/**
 * GET /email-campaign/recipients-count?audience=subscribers|customers|all
 * Returns the count of recipients for preview
 */
export const getRecipientsCount = async (req, res) => {
    try {
        const { audience } = req.query;

        if (!audience || !['subscribers', 'customers', 'all'].includes(audience)) {
            return res.status(400).json({ status: false, msg: 'Valid audience param required.' });
        }

        let emails = [];

        if (audience === 'subscribers' || audience === 'all') {
            const subs = await prisma.newsletterSubscriber.findMany({ select: { email: true } });
            emails.push(...subs.map(s => s.email));
        }

        if (audience === 'customers' || audience === 'all') {
            const users = await prisma.user.findMany({
                where: { role: 'user' },
                select: { email: true }
            });
            emails.push(...users.map(u => u.email));
        }

        const uniqueCount = new Set(emails.filter(Boolean)).size;

        res.status(200).json({ status: true, count: uniqueCount });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
