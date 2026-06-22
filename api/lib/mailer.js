const BREVO_API = 'https://api.brevo.com/v3/smtp/email';

const parseSender = (from) => {
    const match = String(from).match(/^"?([^"<]*)"?\s*<([^>]+)>$/);
    if (match) return { name: match[1].trim(), email: match[2].trim() };
    return { name: 'Bagchee', email: String(from).trim() };
};

const toRecipients = (addr) => {
    if (!addr) return [];
    const list = Array.isArray(addr) ? addr : String(addr).split(',');
    return list.map(e => ({ email: e.trim() })).filter(e => e.email);
};

// Drop-in replacement for nodemailer transporter — same sendMail interface
export const createTransporter = () => ({
    sendMail: async ({ from, to, subject, html, bcc }) => {
        const sender = parseSender(from);
        const body = {
            sender,
            to: toRecipients(to),
            subject,
            htmlContent: html,
        };
        if (bcc) body.bcc = toRecipients(bcc);

        const res = await fetch(BREVO_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `Brevo error ${res.status}`);
        return data;
    }
});

export const FROM = () => '"Bagchee" <no-reply@bagchee.com>';
export const FROM_TEAM = () => '"Bagchee Team" <no-reply@bagchee.com>';
