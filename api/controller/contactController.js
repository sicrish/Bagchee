import { createTransporter } from '../lib/mailer.js';
import prisma from '../lib/prisma.js';

const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

export const submitContact = async (req, res) => {
    try {
        const { name, email, subject, category, message } = req.body;
        if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
            return res.status(400).json({ status: false, msg: 'Name, email, subject and message are required.' });
        }

        // Recipient list: use emailsCopy from settings (configured in Settings page)
        let toAddresses = '';
        try {
            const settings = await prisma.settings.findFirst({ orderBy: { id: 'desc' }, select: { emailsCopy: true } });
            if (settings?.emailsCopy?.trim()) toAddresses = settings.emailsCopy.trim();
        } catch { /* non-critical */ }
        // Fall back to EMAIL_USER if settings has no addresses configured
        if (!toAddresses) toAddresses = process.env.EMAIL_USER || '';

        const transporter = createTransporter();

        await transporter.sendMail({
            from: `"Bagchee" <${process.env.EMAIL_USER}>`,
            to: toAddresses,
            replyTo: email.trim(),
            subject: `[Contact Form] ${subject.trim()}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2 style="color:#0B2F3A;border-bottom:2px solid #008DDA;padding-bottom:10px;">New Contact Form Submission</h2>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr><td style="padding:8px;font-weight:bold;color:#555;width:120px;">Name</td><td style="padding:8px;">${escapeHtml(name.trim())}</td></tr>
                        <tr style="background:#f9f9f9;"><td style="padding:8px;font-weight:bold;color:#555;">Email</td><td style="padding:8px;"><a href="mailto:${escapeHtml(email.trim())}">${escapeHtml(email.trim())}</a></td></tr>
                        <tr><td style="padding:8px;font-weight:bold;color:#555;">Category</td><td style="padding:8px;">${escapeHtml(category || 'General')}</td></tr>
                        <tr style="background:#f9f9f9;"><td style="padding:8px;font-weight:bold;color:#555;">Subject</td><td style="padding:8px;">${escapeHtml(subject.trim())}</td></tr>
                    </table>
                    <div style="margin-top:20px;padding:15px;background:#f5f5f5;border-radius:8px;">
                        <p style="font-weight:bold;color:#555;margin:0 0 8px;">Message:</p>
                        <p style="margin:0;white-space:pre-wrap;">${escapeHtml(message.trim())}</p>
                    </div>
                </div>
            `
        });

        res.json({ status: true, msg: "We've received your feedback and will respond shortly if required." });
    } catch (err) {
        console.error('Contact form error:', err.message);
        res.status(500).json({ status: false, msg: 'Failed to send message. Please try again.' });
    }
};
