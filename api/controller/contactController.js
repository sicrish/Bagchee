import nodemailer from 'nodemailer';

export const submitContact = async (req, res) => {
    try {
        const { name, email, subject, category, message } = req.body;
        if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
            return res.status(400).json({ status: false, msg: 'Name, email, subject and message are required.' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            replyTo: email.trim(),
            subject: `[Contact Form] ${subject.trim()}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2 style="color:#0B2F3A;border-bottom:2px solid #008DDA;padding-bottom:10px;">New Contact Form Submission</h2>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr><td style="padding:8px;font-weight:bold;color:#555;width:120px;">Name</td><td style="padding:8px;">${name.trim()}</td></tr>
                        <tr style="background:#f9f9f9;"><td style="padding:8px;font-weight:bold;color:#555;">Email</td><td style="padding:8px;"><a href="mailto:${email.trim()}">${email.trim()}</a></td></tr>
                        <tr><td style="padding:8px;font-weight:bold;color:#555;">Category</td><td style="padding:8px;">${category || 'General'}</td></tr>
                        <tr style="background:#f9f9f9;"><td style="padding:8px;font-weight:bold;color:#555;">Subject</td><td style="padding:8px;">${subject.trim()}</td></tr>
                    </table>
                    <div style="margin-top:20px;padding:15px;background:#f5f5f5;border-radius:8px;">
                        <p style="font-weight:bold;color:#555;margin:0 0 8px;">Message:</p>
                        <p style="margin:0;white-space:pre-wrap;">${message.trim()}</p>
                    </div>
                </div>
            `
        });

        res.json({ status: true, msg: 'Message sent successfully.' });
    } catch (err) {
        console.error('Contact form error:', err.message);
        res.status(500).json({ status: false, msg: 'Failed to send message. Please try again.' });
    }
};
