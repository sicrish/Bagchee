import { createTransporter } from '../lib/mailer.js';
import dotenv from 'dotenv';
import prisma from '../lib/prisma.js';
import { generateInvoicePdf } from '../lib/invoicePdf.js';
import { activeItems, payableTotal, payableShipping } from '../lib/orderTotals.js';

dotenv.config();

// 🎨 YOUR TAILWIND THEME COLORS
const theme = {
    primary: "#008DDA",      // Main Blue (Header, Button)
    primaryHover: "#006B9E", // Darker Blue
    secondary: "#41C9E2",    // Cyan (Accents)
    cream: "#F7EEDD",        // Outer Background
    textMain: "#0B2F3A",     // Dark Blue Text
    textLight: "#FFFFFF",    // White Text
    textMuted: "#4A6fa5"     // Footer Text
};

const SITE_URL = (process.env.FRONTEND_URL || 'https://www.bagchee.com').split(',')[0].trim();
const LOGO_URL = 'https://www.bagchee.com/logo1.png';

const emailHeader = (title = null, compact = false) => {
    const logoH = compact ? 40 : 62;
    const nameSize = compact ? 19 : 26;
    const pad = compact ? '14px 28px' : '20px 35px';
    const tagSize = compact ? 8 : 9;
    return `
    <div style="background-color:${theme.primary};padding:${pad};text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
                <td style="vertical-align:middle;padding-right:12px;">
                    <div style="background-color:rgba(255,255,255,0.18);border-radius:10px;padding:7px;display:inline-block;">
                        <img src="${LOGO_URL}" alt="Bagchee" width="${logoH}" height="${logoH}" style="height:${logoH}px;width:${logoH}px;max-height:${logoH}px;display:block;border:0;outline:none;text-decoration:none;" />
                    </div>
                </td>
                <td style="vertical-align:middle;text-align:left;">
                    <div style="color:#ffffff;font-size:${nameSize}px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;font-family:Arial,sans-serif;line-height:1;">Bagchee</div>
                    <div style="height:1px;background:rgba(255,255,255,0.3);margin:4px 0;"></div>
                    <div style="color:rgba(255,255,255,0.75);font-size:${tagSize}px;letter-spacing:0.4em;text-transform:uppercase;font-family:Arial,sans-serif;">Books That Stick</div>
                </td>
            </tr>
        </table>
        ${title ? `<p style="color:${theme.textLight};margin:14px 0 0;font-size:15px;font-weight:600;letter-spacing:0.05em;font-family:Arial,sans-serif;">${escapeHtml(title)}</p>` : ''}
    </div>`;
};

const emailFooter = () => `
    <div style="background-color:#fffdf5;padding:20px;text-align:center;border-top:1px solid #e6decd;">
        <p style="font-size:12px;color:${theme.textMuted};margin:0 0 6px;">&copy; ${new Date().getFullYear()} Bagchee. All rights reserved.</p>
        <p style="font-size:11px;color:#9ca3af;margin:0;">This is an automated email. Please do not reply to this email.</p>
    </div>`;

// Escape HTML to prevent injection in email templates
const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const sendMail = async (email, name, firstName) => {
    try {
        const transporter = createTransporter();
        const displayName = escapeHtml(firstName || name);
        const shopUrl = (process.env.FRONTEND_URL || 'https://www.bagchee.com').split(',')[0].trim();
        const membershipUrl = `${shopUrl}/membership`;

        // Fetch 4 bestselling books for the preview section
        let previewBooks = [];
        try {
            const books = await prisma.product.findMany({
                where: { isActive: true, defaultImage: { not: null } },
                orderBy: { soldCount: 'desc' },
                take: 8,
                select: { bagcheeId: true, title: true, defaultImage: true, price: true, realPrice: true }
            });
            previewBooks = books.filter(b => b.defaultImage && b.defaultImage.startsWith('http')).slice(0, 4);
        } catch { /* non-critical — don't block the email */ }

        const bookCardHtml = (book) => {
            const price = book.realPrice > 0 && book.realPrice < book.price ? book.realPrice : book.price;
            const shortTitle = book.title.length > 36 ? book.title.substring(0, 34) + '…' : book.title;
            return `<td style="width:50%;padding:6px;vertical-align:top;">
                <a href="${shopUrl}/books/${escapeHtml(book.bagcheeId)}/${escapeHtml(book.bagcheeId)}" style="text-decoration:none;display:block;">
                    <img src="${escapeHtml(book.defaultImage)}" alt="${escapeHtml(book.title)}" style="width:100%;height:170px;object-fit:cover;border-radius:6px;display:block;" />
                    <p style="color:#0c2340;font-size:12px;font-weight:600;margin:7px 0 3px;line-height:1.4;">${escapeHtml(shortTitle)}</p>
                    <p style="color:#008DDA;font-size:12px;font-weight:700;margin:0;">USD ${Number(price).toFixed(2)}</p>
                </a>
            </td>`;
        };

        const booksRow1 = previewBooks.slice(0, 2).map(bookCardHtml).join('');
        const booksRow2 = previewBooks.slice(2, 4).map(bookCardHtml).join('');

        const peekSection = previewBooks.length > 0 ? `
            <div style="padding:28px 20px;background:#ffffff;border-top:1px solid #e6decd;">
                <h2 style="color:#0c2340;font-size:13px;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 18px;">A Peek Into Bagchee</h2>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>${booksRow1}</tr>
                    ${booksRow2 ? `<tr><td colspan="2" style="height:10px;"></td></tr><tr>${booksRow2}</tr>` : ''}
                </table>
                <div style="text-align:center;margin-top:20px;">
                    <a href="${shopUrl}" style="display:inline-block;background-color:#008DDA;color:#ffffff;text-decoration:none;padding:12px 30px;font-size:13px;font-weight:700;border-radius:6px;letter-spacing:0.04em;">SHOP NOW &rarr;</a>
                </div>
            </div>` : '';

        const emailTemplate = `
            <div style="font-family:Arial,Helvetica,sans-serif;background-color:#e8eef3;padding:0;">

                <div style="max-width:600px;margin:0 auto;">
                    <div style="background-color:#0c2340;padding:10px 20px;text-align:center;">
                        <a href="${shopUrl}" style="color:#ffffff;font-size:12px;font-weight:600;text-decoration:none;letter-spacing:0.03em;">&#127881; Celebrate our New site with us and get 15% off &rarr;</a>
                    </div>
                </div>

                <div style="max-width:600px;margin:0 auto;background-color:#ffffff;box-shadow:0 4px 20px rgba(0,0,0,0.12);">

                    ${emailHeader()}

                    <div style="background:linear-gradient(135deg,#0c2340 0%,#0d3d6b 60%,#0e5491 100%);padding:44px 30px 40px;text-align:center;">
                        <p style="color:#41C9E2;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 14px;">Hi ${displayName}, your account is ready</p>
                        <h1 style="color:#ffffff;font-size:32px;font-weight:900;margin:0 0 6px;letter-spacing:-0.02em;line-height:1.1;">Welcome to</h1>
                        <h1 style="color:#41C9E2;font-size:38px;font-weight:900;margin:0 0 18px;letter-spacing:0.06em;line-height:1;">BAGCHEE</h1>
                        <div style="width:48px;height:3px;background:#f59e0b;margin:0 auto 20px;border-radius:2px;"></div>
                        <p style="color:rgba(255,255,255,0.75);font-size:13px;line-height:1.8;margin:0 0 30px;">Your ultimate destination for books, music, movies and more<br>that inspires, educates and entertains.</p>
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                            <tr>
                                <td style="padding-right:12px;">
                                    <a href="${shopUrl}" style="display:inline-block;background-color:#f59e0b;color:#0c2340;text-decoration:none;padding:13px 28px;font-size:13px;font-weight:800;border-radius:6px;letter-spacing:0.05em;">EXPLORE BOOKS</a>
                                </td>
                                <td>
                                    <a href="${shopUrl}" style="display:inline-block;background-color:transparent;color:#ffffff;text-decoration:none;padding:12px 28px;font-size:13px;font-weight:700;border-radius:6px;letter-spacing:0.05em;border:2px solid rgba(255,255,255,0.4);">SHOP NOW</a>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="background-color:#fffbeb;padding:16px 24px;border-top:2px solid #fcd34d;border-bottom:2px solid #fcd34d;">
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td style="vertical-align:middle;padding-right:8px;">
                                    <p style="color:#92400e;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 3px;">Your Exclusive Offer</p>
                                    <p style="color:#78350f;font-size:13px;margin:0;">Enjoy <strong>15% OFF</strong> on your first purchase</p>
                                </td>
                                <td style="text-align:center;padding:0 8px;vertical-align:middle;white-space:nowrap;">
                                    <div style="background:#ffffff;border:2px dashed #f59e0b;border-radius:8px;padding:7px 14px;display:inline-block;">
                                        <p style="color:#92400e;font-size:9px;margin:0 0 2px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Promo Code</p>
                                        <p style="color:#0c2340;font-size:16px;font-weight:900;margin:0;letter-spacing:0.12em;">BAGCHEE15</p>
                                    </div>
                                </td>
                                <td style="text-align:right;vertical-align:middle;padding-left:8px;white-space:nowrap;">
                                    <a href="${shopUrl}" style="display:inline-block;background-color:#0c2340;color:#ffffff;text-decoration:none;padding:10px 18px;font-size:12px;font-weight:700;border-radius:6px;">SHOP NOW</a>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="padding:26px 16px 22px;background:#ffffff;border-top:1px solid #e6decd;">
                        <h2 style="color:#0c2340;font-size:13px;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 20px;">Why Shop With Us</h2>
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td style="width:25%;text-align:center;padding:0 6px;vertical-align:top;">
                                    <div style="font-size:26px;margin-bottom:6px;">&#127758;</div>
                                    <p style="color:#0c2340;font-size:10px;font-weight:700;margin:0 0 3px;text-transform:uppercase;line-height:1.3;">WORLDWIDE<br>DELIVERY</p>
                                    <p style="color:#6b7280;font-size:10px;margin:0;line-height:1.4;">Free on orders<br>over $50</p>
                                </td>
                                <td style="width:25%;text-align:center;padding:0 6px;vertical-align:top;">
                                    <div style="font-size:26px;margin-bottom:6px;">&#11088;</div>
                                    <p style="color:#0c2340;font-size:10px;font-weight:700;margin:0 0 3px;text-transform:uppercase;line-height:1.3;">MEMBER<br>BENEFITS</p>
                                    <p style="color:#6b7280;font-size:10px;margin:0;line-height:1.4;">Extra 10% off<br>all purchases</p>
                                </td>
                                <td style="width:25%;text-align:center;padding:0 6px;vertical-align:top;">
                                    <div style="font-size:26px;margin-bottom:6px;">&#128274;</div>
                                    <p style="color:#0c2340;font-size:10px;font-weight:700;margin:0 0 3px;text-transform:uppercase;line-height:1.3;">SECURE<br>CHECKOUT</p>
                                    <p style="color:#6b7280;font-size:10px;margin:0;line-height:1.4;">100% trusted<br>payments</p>
                                </td>
                                <td style="width:25%;text-align:center;padding:0 6px;vertical-align:top;">
                                    <div style="font-size:26px;margin-bottom:6px;">&#128172;</div>
                                    <p style="color:#0c2340;font-size:10px;font-weight:700;margin:0 0 3px;text-transform:uppercase;line-height:1.3;">CUSTOMER<br>SUPPORT</p>
                                    <p style="color:#6b7280;font-size:10px;margin:0;line-height:1.4;">Here to help<br>anytime</p>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="background-color:#0d2b4e;padding:26px 24px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td style="vertical-align:top;padding-right:16px;">
                                    <div style="display:inline-block;background:rgba(255,255,255,0.12);border-radius:6px;padding:4px 10px;margin-bottom:10px;">
                                        <span style="color:#ffffff;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">M &nbsp;BAGCHEE</span>
                                    </div>
                                    <h2 style="color:#ffffff;font-size:16px;font-weight:700;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.06em;">Become a Member</h2>
                                    <p style="color:#94d2f0;font-size:12px;margin:4px 0;">&#10003; &nbsp;10% Discount on every purchase</p>
                                    <p style="color:#94d2f0;font-size:12px;margin:4px 0;">&#10003; &nbsp;Extra 10% on Sale Items</p>
                                    <p style="color:#94d2f0;font-size:12px;margin:4px 0;">&#10003; &nbsp;Early Access to Sales</p>
                                    <div style="margin-top:18px;">
                                        <a href="${membershipUrl}" style="display:inline-block;background-color:#3b82f6;color:#ffffff;text-decoration:none;padding:11px 22px;font-size:13px;font-weight:700;border-radius:6px;letter-spacing:0.04em;">GET MEMBERSHIP &rarr;</a>
                                    </div>
                                </td>
                                <td style="vertical-align:middle;text-align:center;width:155px;">
                                    <div style="background:rgba(255,255,255,0.07);border-radius:12px;padding:18px 10px;">
                                        <p style="color:#94a3b8;font-size:10px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.1em;">Members Save</p>
                                        <p style="color:#f59e0b;font-size:40px;font-weight:900;margin:0;line-height:1;">10%</p>
                                        <p style="color:#f59e0b;font-size:14px;font-weight:700;margin:2px 0 6px;text-transform:uppercase;letter-spacing:0.06em;">EXTRA</p>
                                        <p style="color:#94a3b8;font-size:11px;margin:0;">On Every Order!</p>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="padding:26px 12px 22px;background:#f8fafc;">
                        <h2 style="color:#0c2340;font-size:13px;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 20px;">How It Works</h2>
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td style="text-align:center;vertical-align:top;padding:0 2px;">
                                    <div style="background:#008DDA;border-radius:50%;width:42px;height:42px;margin:0 auto 7px;text-align:center;line-height:42px;font-size:18px;">&#128218;</div>
                                    <p style="color:#0c2340;font-size:10px;font-weight:600;margin:0;line-height:1.4;">Browse<br>Books</p>
                                </td>
                                <td style="text-align:center;vertical-align:top;padding-top:10px;color:#9ca3af;font-size:16px;">&rsaquo;</td>
                                <td style="text-align:center;vertical-align:top;padding:0 2px;">
                                    <div style="background:#008DDA;border-radius:50%;width:42px;height:42px;margin:0 auto 7px;text-align:center;line-height:42px;font-size:18px;">&#128722;</div>
                                    <p style="color:#0c2340;font-size:10px;font-weight:600;margin:0;line-height:1.4;">Add to<br>Cart</p>
                                </td>
                                <td style="text-align:center;vertical-align:top;padding-top:10px;color:#9ca3af;font-size:16px;">&rsaquo;</td>
                                <td style="text-align:center;vertical-align:top;padding:0 2px;">
                                    <div style="background:#008DDA;border-radius:50%;width:42px;height:42px;margin:0 auto 7px;text-align:center;line-height:42px;font-size:18px;">&#128179;</div>
                                    <p style="color:#0c2340;font-size:10px;font-weight:600;margin:0;line-height:1.4;">Safe & Easy<br>Payments</p>
                                </td>
                                <td style="text-align:center;vertical-align:top;padding-top:10px;color:#9ca3af;font-size:16px;">&rsaquo;</td>
                                <td style="text-align:center;vertical-align:top;padding:0 2px;">
                                    <div style="background:#008DDA;border-radius:50%;width:42px;height:42px;margin:0 auto 7px;text-align:center;line-height:42px;font-size:18px;">&#128230;</div>
                                    <p style="color:#0c2340;font-size:10px;font-weight:600;margin:0;line-height:1.4;">Fast<br>Delivery</p>
                                </td>
                                <td style="text-align:center;vertical-align:top;padding-top:10px;color:#9ca3af;font-size:16px;">&rsaquo;</td>
                                <td style="text-align:center;vertical-align:top;padding:0 2px;">
                                    <div style="background:#008DDA;border-radius:50%;width:42px;height:42px;margin:0 auto 7px;text-align:center;line-height:42px;font-size:18px;">&#128522;</div>
                                    <p style="color:#0c2340;font-size:10px;font-weight:600;margin:0;line-height:1.4;">Start<br>Reading!</p>
                                </td>
                            </tr>
                        </table>
                    </div>

                    ${peekSection}

                    <div style="background-color:#0c2340;padding:18px 24px;text-align:center;">
                        <p style="color:#ffffff;font-size:12px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.08em;">Your Trust, Our Priority</p>
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                            <tr>
                                <td style="padding:0 14px;text-align:center;">
                                    <p style="color:#f59e0b;font-size:16px;margin:0;">&#128274;</p>
                                    <p style="color:#94a3b8;font-size:10px;margin:3px 0 0;font-weight:600;">Secure</p>
                                </td>
                                <td style="padding:0 14px;text-align:center;">
                                    <p style="color:#f59e0b;font-size:16px;margin:0;">&#128230;</p>
                                    <p style="color:#94a3b8;font-size:10px;margin:3px 0 0;font-weight:600;">Easy Returns</p>
                                </td>
                                <td style="padding:0 14px;text-align:center;">
                                    <p style="color:#f59e0b;font-size:16px;margin:0;">&#9889;</p>
                                    <p style="color:#94a3b8;font-size:10px;margin:3px 0 0;font-weight:600;">Fast Shipping</p>
                                </td>
                                <td style="padding:0 14px;text-align:center;">
                                    <p style="color:#f59e0b;font-size:16px;margin:0;">&#128172;</p>
                                    <p style="color:#94a3b8;font-size:10px;margin:3px 0 0;font-weight:600;">Support</p>
                                </td>
                            </tr>
                        </table>
                    </div>

                    ${emailFooter()}
                </div>
            </div>
        `;

        const mailOptions = {
            from: `"Bagchee" <no-reply@bagchee.com>`,
            to: email,
            subject: `Welcome to Bagchee, ${displayName}! 📘`,
            html: emailTemplate
        };

        await transporter.sendMail(mailOptions);

    } catch (error) {
        console.error('Email send failed:', error.message);
    }
};

export default sendMail;

export const sendPasswordResetEmail = async (email, name, resetLink) => {
    try {
        const transporter = createTransporter();

        const emailTemplate = `
            <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: ${theme.cream}; padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e6decd;">
                    ${emailHeader()}
                    <div style="padding: 40px 30px; text-align: center;">
                        <h2 style="color: ${theme.textMain}; font-size: 22px; margin-bottom: 15px; font-weight: 600;">Reset Your Password</h2>
                        <p style="color: ${theme.textMain}; font-size: 15px; line-height: 1.6; margin-bottom: 10px; opacity: 0.8;">
                            Hi <strong>${escapeHtml(name)}</strong>,
                        </p>
                        <p style="color: ${theme.textMain}; font-size: 15px; line-height: 1.6; margin-bottom: 30px; opacity: 0.8;">
                            We received a request to reset your password. Click the button below to create a new password. This link will expire in <strong>15 minutes</strong>.
                        </p>
                        <a href="${resetLink}" style="display: inline-block; background-color: ${theme.primary}; color: ${theme.textLight}; text-decoration: none; padding: 14px 36px; font-size: 16px; font-weight: bold; border-radius: 8px;">
                            Reset Password
                        </a>
                        <p style="margin-top: 30px; font-size: 13px; color: ${theme.textMuted};">
                            If the button doesn't work, copy and paste this link:<br>
                            <a href="${resetLink}" style="color: ${theme.primary}; font-weight: 600; word-break: break-all;">${resetLink}</a>
                        </p>
                        <div style="margin-top: 30px; padding: 16px; background: #fff3cd; border-radius: 8px; border: 1px solid #ffc107;">
                            <p style="font-size: 13px; color: #856404; margin: 0;">
                                If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                            </p>
                        </div>
                    </div>
                    ${emailFooter()}
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"Bagchee" <no-reply@bagchee.com>`,
            to: email,
            subject: 'Reset Your Password - Bagchee',
            html: emailTemplate
        });

    } catch (error) {
        console.error('Password reset email failed:', error.message);
        throw error;
    }
};

export const sendOrderConfirmation = async (email, order) => {
    try {
        const transporter = createTransporter();

        // Read admin BCC addresses from settings
        let bccAddresses = null;
        try {
            const settings = await prisma.settings.findFirst({ orderBy: { id: 'desc' }, select: { emailsCopy: true } });
            if (settings?.emailsCopy?.trim()) bccAddresses = settings.emailsCopy.trim();
        } catch { /* non-critical — don't block the email */ }

        const itemRows = activeItems(order.items).map(item => `
            <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e6decd; color: ${theme.textMain};">${escapeHtml(item.name || item.product?.title || 'Item')}</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e6decd; text-align: center; color: ${theme.textMain};">${Number(item.quantity) || 0}</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e6decd; text-align: right; color: ${theme.textMain};">${escapeHtml(order.currency || 'USD')} ${Number(item.price).toFixed(2)}</td>
            </tr>
        `).join('');

        const giftCardRows = (order.giftCardItems || []).map(gc => `
            <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e6decd; color: ${theme.textMain};">E-gift Card${gc.recipientName ? ` (for ${escapeHtml(gc.recipientName)})` : ''}</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e6decd; text-align: center; color: ${theme.textMain};">1</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e6decd; text-align: right; color: ${theme.textMain};">${escapeHtml(order.currency || 'USD')} ${Number(gc.amount).toFixed(2)}</td>
            </tr>
        `).join('');

        const trackOrderUrl = order.customerId
            ? `${SITE_URL}/trace-order`
            : `${SITE_URL}/trace-order?tab=guest`;

        const estimatedDeliveryStr = order.estimatedDelivery
            ? new Date(order.estimatedDelivery).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
            : null;

        const template = `
            <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: ${theme.cream}; padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e6decd;">
                    ${emailHeader('Order Confirmed')}
                    <div style="padding: 40px 30px;">
                        <h2 style="color: ${theme.textMain}; font-size: 20px; margin-bottom: 6px;">Thank you for your order!</h2>
                        <p style="color: ${theme.textMain}; opacity: 0.7; margin-bottom: 20px;">Order #<strong>${escapeHtml(order.orderNumber)}</strong> has been placed successfully.</p>

                        <div style="text-align: center; margin: 0 0 28px;">
                            <a href="${trackOrderUrl}" style="display:inline-block;background-color:${theme.primary};color:#fff;text-decoration:none;padding:13px 32px;font-size:15px;font-weight:700;border-radius:8px;">
                                Track Your Order
                            </a>
                        </div>

                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="text-align: left; padding-bottom: 8px; border-bottom: 2px solid #e6decd; color: ${theme.textMuted}; font-size: 13px;">Item</th>
                                    <th style="text-align: center; padding-bottom: 8px; border-bottom: 2px solid #e6decd; color: ${theme.textMuted}; font-size: 13px;">Qty</th>
                                    <th style="text-align: right; padding-bottom: 8px; border-bottom: 2px solid #e6decd; color: ${theme.textMuted}; font-size: 13px;">Price</th>
                                </tr>
                            </thead>
                            <tbody>${itemRows}${giftCardRows}</tbody>
                        </table>
                        <div style="margin-top: 20px; text-align: right;">
                            ${payableShipping(order) > 0
                                ? `<p style="font-size:13px;color:${theme.textMuted};margin:0 0 4px;">Shipping: ${escapeHtml(order.currency || 'USD')} ${payableShipping(order).toFixed(2)}</p>`
                                : `<p style="font-size:13px;color:#16a34a;margin:0 0 4px;font-weight:600;">Shipping: FREE</p>`
                            }
                            ${Number(order.couponDiscount) > 0
                                ? `<p style="font-size:13px;color:#16a34a;margin:0 0 4px;font-weight:600;">Coupon${(order.coupon && order.coupon.code) ? ` (${escapeHtml(order.coupon.code)})` : ''}: &minus;${escapeHtml(order.currency || 'USD')} ${Number(order.couponDiscount).toFixed(2)}</p>`
                                : ''
                            }
                            <p style="font-size: 18px; font-weight: 700; color: ${theme.textMain};">Total: ${order.currency || 'USD'} ${payableTotal(order).toFixed(2)}</p>
                            ${(order.paymentType || order.payment_type) ? `<p style="font-size:13px;color:${theme.textMuted};margin:6px 0 0;"><strong>Payment Method:</strong> ${escapeHtml(order.paymentType || order.payment_type)}</p>` : ''}
                        </div>
                        <div style="margin-top: 24px; background: #f9f5ee; border-radius: 8px; padding: 16px; font-size: 13px; color: ${theme.textMain};">
                            <strong>Shipping to:</strong><br/>
                            ${escapeHtml(order.shippingFirstName)} ${escapeHtml(order.shippingLastName)}<br/>
                            ${order.shippingCompany ? escapeHtml(order.shippingCompany) + '<br/>' : ''}
                            ${escapeHtml(order.shippingAddress1)}${order.shippingAddress2 ? '<br/>' + escapeHtml(order.shippingAddress2) : ''}<br/>
                            ${escapeHtml(order.shippingCity)}, ${escapeHtml(order.shippingState)} ${escapeHtml(order.shippingPostcode)}<br/>
                            ${escapeHtml(order.shippingCountry)}
                            ${estimatedDeliveryStr ? `<br/><br/><strong>Estimated Delivery:</strong> ${estimatedDeliveryStr}` : ''}
                        </div>
                        ${order.isDeferredPayment ? `
                        <div style="margin-top: 24px; background: #e8f4fd; border: 1px solid #41C9E2; border-radius: 8px; padding: 16px; font-size: 13px; color: ${theme.textMain};">
                            <strong style="color: ${theme.primary}; font-size: 14px; letter-spacing: 0.04em; text-transform: uppercase;">Payment Pending Review</strong><br/>
                            <p style="margin: 10px 0 0;">Our team will review your order within <strong>2–12 hours</strong>. Once approved, you will receive a secure payment link via email to complete the purchase.</p>
                        </div>` : order.paymentAdditionalText ? `
                        <div style="margin-top: 24px; background: #fff8e6; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; font-size: 13px; color: ${theme.textMain};">
                            <strong style="color: #92400e;">${escapeHtml(order.paymentType || order.payment_type || 'Payment')} Instructions:</strong><br/>
                            <div style="margin-top: 8px;">${order.paymentAdditionalText}</div>
                            <p style="margin-top: 12px; font-size: 12px; color: #92400e;">
                                Please use your order number <strong>#${escapeHtml(order.orderNumber)}</strong> as the payment reference.<br/>
                                Your order will be processed once payment is confirmed.
                            </p>
                        </div>` : ''}
                    </div>
                    ${emailFooter()}
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"Bagchee" <no-reply@bagchee.com>`,
            to: email,
            ...(bccAddresses ? { bcc: bccAddresses } : {}),
            subject: `Order Confirmed — #${order.orderNumber}`,
            html: template
        });
    } catch (error) {
        console.error('Order confirmation email failed:', error.message);
    }
};

export const sendOrderShippedEmail = async (email, order) => {
    try {
        const transporter = createTransporter();

        const estDeliveryStr = (order.shippedAt && order.estimatedDelivery)
            ? new Date(order.estimatedDelivery).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
            : null;
        const trackPackageUrl = order.customerId
            ? `${SITE_URL}/trace-order`
            : `${SITE_URL}/trace-order?tab=guest`;

        const template = `
            <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: ${theme.cream}; padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e6decd;">
                    ${emailHeader()}
                    <div style="padding: 40px 30px;">
                        <h2 style="color: ${theme.textMain}; font-size: 20px; margin-bottom: 6px;">Your order has been shipped! 📦</h2>
                        <p style="color: ${theme.textMain}; opacity: 0.7; margin-bottom: 24px;">Order #<strong>${escapeHtml(order.orderNumber)}</strong> is on its way to you.</p>
                        <div style="background: #f9f5ee; border-radius: 8px; padding: 16px; font-size: 13px; color: ${theme.textMain}; margin-bottom: 20px;">
                            <strong>Shipping to:</strong><br/>
                            ${escapeHtml(order.shippingFirstName)} ${escapeHtml(order.shippingLastName)}<br/>
                            ${order.shippingCompany ? escapeHtml(order.shippingCompany) + '<br/>' : ''}
                            ${escapeHtml(order.shippingAddress1)}${order.shippingAddress2 ? '<br/>' + escapeHtml(order.shippingAddress2) : ''}<br/>
                            ${escapeHtml(order.shippingCity)}, ${escapeHtml(order.shippingState)} ${escapeHtml(order.shippingPostcode)}<br/>
                            ${escapeHtml(order.shippingCountry)}
                        </div>
                        ${order.courierName ? `<p style="font-size: 14px; color: ${theme.textMain};"><strong>Courier:</strong> ${escapeHtml(String(order.courierName))}</p>` : ''}
                        ${order.trackingId ? `<p style="font-size: 14px; color: ${theme.textMain};"><strong>Tracking ID:</strong> ${escapeHtml(String(order.trackingId))}</p>` : ''}
                        ${estDeliveryStr ? `<p style="font-size: 14px; color: ${theme.textMain};"><strong>Estimated Delivery Date:</strong> ${estDeliveryStr}</p>` : ''}
                        <div style="text-align: center; margin: 24px 0;">
                            <a href="${trackPackageUrl}" style="display:inline-block;background-color:${theme.primary};color:#fff;text-decoration:none;padding:12px 28px;font-size:14px;font-weight:700;border-radius:8px;">
                                Track Package
                            </a>
                        </div>
                        <p style="margin-top: 20px; font-size: 14px; color: ${theme.textMuted};">We'll notify you when your order is delivered. Thank you for shopping with Bagchee!</p>
                    </div>
                    ${emailFooter()}
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"Bagchee" <no-reply@bagchee.com>`,
            to: email,
            subject: `Your Order Has Been Shipped — #${order.orderNumber}`,
            html: template
        });
    } catch (error) {
        console.error('Order shipped email failed:', error.message);
        throw error;
    }
};

export const sendOrderStatusEmail = async (email, order) => {
    try {
        const transporter = createTransporter();

        const statusColor = {
            'Delivered': '#16a34a',
            'Shipped': '#2563eb',
            'Cancelled': '#dc2626',
            'Returned': '#dc2626',
            'Refunded': '#f59e0b',
            'On Hold': '#f59e0b',
        }[order.status] || theme.primary;

        const template = `
            <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: ${theme.cream}; padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e6decd;">
                    ${emailHeader()}
                    <div style="padding: 40px 30px; text-align: center;">
                        <h2 style="color: ${theme.textMain}; font-size: 20px; margin-bottom: 16px;">Order #${escapeHtml(order.orderNumber)}</h2>
                        <div style="display: inline-block; background-color: ${statusColor}; color: white; padding: 10px 28px; border-radius: 8px; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">
                            ${escapeHtml(order.status)}
                        </div>
                        <p style="margin-top: 24px; font-size: 14px; color: ${theme.textMain}; opacity: 0.7;">
                            Your order status has been updated. If you have any questions, please don't hesitate to contact us.
                        </p>
                    </div>
                    ${emailFooter()}
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"Bagchee" <no-reply@bagchee.com>`,
            to: email,
            subject: `Order Update: ${order.status} — #${order.orderNumber}`,
            html: template
        });
    } catch (error) {
        console.error('Order status email failed:', error.message);
        throw error;
    }
};

// Payment link email — sent to customer when admin approves a deferred CC/PayPal order
export const sendPaymentLinkEmail = async (email, order, paymentLink) => {
    try {
        const transporter = createTransporter();

        const firstName = escapeHtml(order.shippingFirstName || order.customer?.name?.split(' ')[0] || 'Valued Customer');
        const orderNum  = escapeHtml(order.orderNumber || `#${order.id}`);
        const safeLink  = paymentLink; // URL — not user-supplied, safe to embed

        const template = `
            <div style="font-family:'Inter',Helvetica,Arial,sans-serif;background-color:${theme.cream};padding:40px 0;">
              <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,.1);border:1px solid #e6decd;">
                ${emailHeader()}
                <div style="padding:40px 30px;">
                  <h2 style="color:${theme.textMain};font-size:22px;margin-bottom:8px;font-weight:700;">Your Order Has Been Approved!</h2>
                  <p style="color:${theme.textMain};font-size:15px;line-height:1.7;margin-bottom:6px;">Hi <strong>${firstName}</strong>,</p>
                  <p style="color:${theme.textMain};font-size:15px;line-height:1.7;margin-bottom:24px;">
                    Great news! Your order <strong>${orderNum}</strong> has been reviewed and approved by our team.
                    Please click the button below to complete your payment securely.
                  </p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="${safeLink}" style="display:inline-block;background:${theme.primary};color:#fff;text-decoration:none;padding:16px 40px;font-size:16px;font-weight:700;border-radius:8px;letter-spacing:.5px;">
                      Complete Payment →
                    </a>
                  </div>
                  <p style="font-size:13px;color:${theme.textMuted};margin-top:20px;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${safeLink}" style="color:${theme.primary};word-break:break-all;">${safeLink}</a>
                  </p>
                  <div style="margin-top:24px;padding:16px;background:#f0f9ff;border-radius:8px;border:1px solid #bae6fd;">
                    <p style="font-size:13px;color:#0369a1;margin:0;">
                      This payment link is unique to your order and expires once used.
                      If you have any questions, please reply to this email.
                    </p>
                  </div>
                </div>
                ${emailFooter()}
              </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"Bagchee" <no-reply@bagchee.com>`,
            to: email,
            subject: `Action Required: Complete Payment for Order ${orderNum}`,
            html: template
        });
    } catch (error) {
        console.error('Payment link email failed:', error.message);
        throw error;
    }
};

export const sendCustomConfirmationEmail = async (email, subject, bodyHtml) => {
    try {
        const transporter = createTransporter();
        const html = `
            <div style="font-family:'Inter',Helvetica,Arial,sans-serif;background-color:${theme.cream};padding:40px 0;">
              <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,.1);border:1px solid #e6decd;">
                ${emailHeader()}
                <div style="padding:40px 30px;font-size:15px;line-height:1.7;color:${theme.textMain};">
                  ${bodyHtml}
                </div>
                ${emailFooter()}
              </div>
            </div>`;
        await transporter.sendMail({
            from: `"Bagchee" <no-reply@bagchee.com>`,
            to: email,
            subject,
            html
        });
    } catch (error) {
        console.error('sendCustomConfirmationEmail failed:', error.message);
        throw error;
    }
};

export const sendInvoiceEmail = async (email, order) => {
    try {
        const transporter = createTransporter();

        const orderNum = order.orderNumber || order.order_number || order.id;
        const currency = order.currency || 'USD';
        const items = activeItems(order.items); // exclude cancelled out-of-print items (#5)
        const itemRows = items.map(item => `
            <tr>
                <td style="padding:10px 8px;border-bottom:1px solid #e6decd;color:${theme.textMain};">${escapeHtml(item.name || item.product?.title || 'Item')}</td>
                <td style="padding:10px 8px;border-bottom:1px solid #e6decd;text-align:center;color:${theme.textMain};">${Number(item.quantity) || 1}</td>
                <td style="padding:10px 8px;border-bottom:1px solid #e6decd;text-align:right;color:${theme.textMain};">${currency} ${Number(item.price || 0).toFixed(2)}</td>
            </tr>`).join('');

        const shippingName = [order.shippingFirstName, order.shippingLastName].filter(Boolean).join(' ');
        const shippingAddr = [order.shippingAddress1, order.shippingCity, order.shippingState, order.shippingPostcode, order.shippingCountry].filter(Boolean).join(', ');

        const template = `
            <div style="font-family:'Inter',Helvetica,Arial,sans-serif;background-color:${theme.cream};padding:40px 0;">
              <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.1);border:1px solid #e6decd;">
                ${emailHeader()}
                <div style="padding:36px 32px;">
                  <h2 style="color:${theme.textMain};font-size:20px;margin-bottom:4px;">Invoice #${escapeHtml(String(orderNum))}</h2>
                  <p style="color:#6b7280;font-size:13px;margin-bottom:24px;">Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</p>

                  <table style="width:100%;border-collapse:collapse;">
                    <thead>
                      <tr>
                        <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #e6decd;color:${theme.textMuted};font-size:12px;text-transform:uppercase;">Item</th>
                        <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid #e6decd;color:${theme.textMuted};font-size:12px;text-transform:uppercase;">Qty</th>
                        <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #e6decd;color:${theme.textMuted};font-size:12px;text-transform:uppercase;">Price</th>
                      </tr>
                    </thead>
                    <tbody>${itemRows}</tbody>
                  </table>

                  <div style="margin-top:20px;text-align:right;border-top:2px solid #e6decd;padding-top:16px;">
                    <p style="font-size:20px;font-weight:700;color:${theme.textMain};">Total: ${currency} ${payableTotal(order).toFixed(2)}</p>
                  </div>

                  ${shippingName ? `
                  <div style="margin-top:24px;background:#f9f5ee;border-radius:8px;padding:16px;font-size:13px;color:${theme.textMain};">
                    <strong>Shipped to:</strong><br/>
                    ${escapeHtml(shippingName)}<br/>
                    ${escapeHtml(shippingAddr)}
                  </div>` : ''}
                </div>
                ${emailFooter()}
              </div>
            </div>`;

        const mailOptions = {
            from: `"Bagchee" <no-reply@bagchee.com>`,
            to: email,
            subject: `Your Invoice — Order #${orderNum}`,
            html: template
        };

        // Attach a PDF copy of the invoice. If PDF generation fails for any reason,
        // fall back to the HTML-only email so the customer still receives their invoice.
        try {
            const pdfBuffer = await generateInvoicePdf(order);
            mailOptions.attachments = [{
                filename: `Invoice-${orderNum}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }];
        } catch (pdfErr) {
            console.error('Invoice PDF generation failed — sending HTML-only invoice:', pdfErr.message);
        }

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Invoice email failed:', error.message);
        throw error;
    }
};

// ─── Newsletter subscription confirmation ───────────────────────────────────
export const sendNewsletterConfirmation = async (email, firstName) => {
    try {
        const transporter = createTransporter();
        const name = escapeHtml(firstName || 'there');
        const unsubUrl = `${SITE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
        const html = `
            <div style="font-family:'Inter',Helvetica,Arial,sans-serif;background-color:${theme.cream};padding:40px 0;">
              <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,.1);border:1px solid #e6decd;">
                ${emailHeader(null, true)}
                <div style="padding:36px 30px;">
                  <p style="color:${theme.textMain};font-size:20px;font-weight:700;margin:0 0 16px;">Hello, ${name}!</p>
                  <p style="color:${theme.textMain};font-size:14px;line-height:1.7;margin:0 0 14px;">
                    Thank you for subscribing to our newsletter. You are just one step away — click on the link below to confirm your subscription.
                  </p>
                  <p style="margin:0 0 28px;">
                    <a href="${SITE_URL}?newsletter=confirmed&email=${encodeURIComponent(email)}" style="color:${theme.primary};font-size:14px;font-weight:600;text-decoration:underline;">
                      Yes, I would like to receive Bagchee's newsletter.
                    </a>
                  </p>
                  <div style="border-top:1px solid #e6decd;padding-top:16px;">
                    <p style="font-size:12px;color:${theme.textMuted};margin:0 0 4px;">You are receiving this email because you signed up on Bagchee.com.</p>
                    <p style="font-size:12px;color:${theme.textMuted};margin:0 0 4px;">If you received this email by mistake, simply ignore it.</p>
                    <p style="font-size:12px;color:${theme.textMuted};margin:0;">
                      You won't receive newsletters until you click the confirmation link above.
                      &nbsp;<a href="${unsubUrl}" style="color:${theme.primary};text-decoration:underline;">Unsubscribe</a>
                    </p>
                  </div>
                </div>
                ${emailFooter()}
              </div>
            </div>`;
        await transporter.sendMail({
            from: `"Bagchee" <no-reply@bagchee.com>`,
            to: email,
            subject: 'Confirm your Bagchee Newsletter subscription',
            html
        });
    } catch (error) {
        console.error('Newsletter confirmation email failed:', error.message);
    }
};

// ─── Membership welcome ──────────────────────────────────────────────────────
export const sendMembershipWelcome = async (email, name, expiryDate) => {
    try {
        const transporter = createTransporter();
        const expiry = new Date(expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        const html = `
            <div style="font-family:'Inter',Helvetica,Arial,sans-serif;background-color:${theme.cream};padding:40px 0;">
              <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,.1);border:1px solid #e6decd;">
                ${emailHeader('Membership Activated')}
                <div style="padding:40px 30px;text-align:center;">
                  <div style="background:linear-gradient(135deg,#f59e0b,#fbbf24);border-radius:50%;width:72px;height:72px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
                    <span style="font-size:36px;">⭐</span>
                  </div>
                  <h2 style="color:${theme.textMain};font-size:22px;margin-bottom:10px;font-weight:700;">Welcome to Bagchee Membership, ${escapeHtml(name)}!</h2>
                  <p style="color:${theme.textMain};font-size:15px;line-height:1.7;margin-bottom:8px;opacity:.85;">
                    Your membership is now <strong>active</strong>. Enjoy <strong>10% off every order</strong> for the next full year.
                  </p>
                  <p style="color:${theme.textMuted};font-size:13px;margin-bottom:28px;">Valid until: <strong>${expiry}</strong></p>
                  <a href="${SITE_URL}" style="display:inline-block;background-color:${theme.primary};color:#fff;text-decoration:none;padding:13px 32px;font-size:15px;font-weight:700;border-radius:8px;">
                    Start Shopping & Save
                  </a>
                  <div style="margin-top:32px;background:#f9f5ee;border-radius:8px;padding:20px;text-align:left;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${theme.textMain};">Your membership benefits:</p>
                    <ul style="margin:0;padding-left:18px;font-size:13px;color:${theme.textMain};line-height:2;">
                      <li>10% off on every item, including sale items</li>
                      <li>Free worldwide air delivery on orders over $35</li>
                      <li>Exclusive member-only offers throughout the year</li>
                    </ul>
                  </div>
                </div>
                ${emailFooter()}
              </div>
            </div>`;
        await transporter.sendMail({
            from: `"Bagchee" <no-reply@bagchee.com>`,
            to: email,
            subject: '⭐ Your Bagchee Membership is Active!',
            html
        });
    } catch (error) {
        console.error('Membership welcome email failed:', error.message);
    }
};

// ─── Membership expiry reminder (30 days before) ────────────────────────────
export const sendMembershipExpiryReminder = async (email, name, daysLeft, expiryDate) => {
    try {
        const transporter = createTransporter();
        const expiry = new Date(expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        const html = `
            <div style="font-family:'Inter',Helvetica,Arial,sans-serif;background-color:${theme.cream};padding:40px 0;">
              <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,.1);border:1px solid #e6decd;">
                ${emailHeader()}
                <div style="padding:36px 30px;">
                  <p style="color:${theme.textMain};font-size:20px;font-weight:700;margin:0 0 16px;">Hello, ${escapeHtml(name)}!</p>
                  <p style="color:${theme.textMain};font-size:14px;line-height:1.7;margin:0 0 10px;">
                    Your membership at Bagchee.com is about to expire in <strong>${daysLeft} days</strong> and you will no longer be able to enjoy member benefits and discounts.
                    Renew your membership to save with your every order for another year.
                  </p>
                  <p style="color:${theme.textMain};font-size:14px;line-height:1.7;margin:0 0 24px;">
                    Membership is applied immediately and gives you <strong>10% off all orders</strong>, free shipping, exclusive offers.
                  </p>
                  <div style="text-align:center;margin-bottom:28px;">
                    <a href="${SITE_URL}/membership" style="display:inline-block;background-color:${theme.primary};color:#fff;text-decoration:none;padding:13px 36px;font-size:15px;font-weight:700;border-radius:8px;">
                      Renew Membership
                    </a>
                  </div>
                  <div style="border-top:1px solid #e6decd;padding-top:16px;">
                    <p style="color:${theme.textMain};font-size:13px;margin:0 0 6px;">
                      <strong>Your membership status:</strong> <span style="color:#16a34a;">Member</span>
                    </p>
                    <p style="color:${theme.textMain};font-size:13px;margin:0 0 14px;">
                      <strong>Expiration date:</strong> <span style="color:#dc2626;">${expiry}</span>
                    </p>
                    <p style="font-size:12px;margin:0;">
                      <a href="${SITE_URL}/membership" style="color:${theme.primary};text-decoration:underline;">Membership FAQ</a>
                      &nbsp;&nbsp;
                      <a href="${SITE_URL}/terms-and-conditions" style="color:${theme.primary};text-decoration:underline;">Terms &amp; Conditions</a>
                    </p>
                  </div>
                </div>
                ${emailFooter()}
              </div>
            </div>`;
        await transporter.sendMail({
            from: `"Bagchee" <no-reply@bagchee.com>`,
            to: email,
            subject: `Your Bagchee Membership expires in ${daysLeft} days`,
            html
        });
    } catch (error) {
        console.error('Membership expiry reminder email failed:', error.message);
    }
};

// ─── Back in stock notification ──────────────────────────────────────────────
export const sendBackInStockEmail = async (email, recipientName, product, productUrl) => {
    try {
        const transporter = createTransporter();
        const name = escapeHtml(recipientName || 'there');
        const title = escapeHtml(product.title || '');
        const authorName = escapeHtml(product.authorName || '');
        // Price intentionally omitted: the subscriber's browsing currency isn't stored,
        // so we can't show the right symbol/amount — customers see accurate pricing on the
        // product page. (Per client direction, June 2026.)
        const synopsis = product.synopsis ? escapeHtml(product.synopsis).substring(0, 200) + (product.synopsis.length > 200 ? `... <a href="${productUrl}" target="_blank" style="color:${theme.primary};text-decoration:none;font-weight:600;">Read more &#9658;</a>` : '') : '';
        const imageUrl = product.defaultImage || '';

        // Star rating (out of 5)
        const rating = Math.round(Number(product.rating) || 0);
        const stars = Array.from({ length: 5 }, (_, i) =>
            `<span style="color:${i < rating ? '#f59e0b' : '#d1d5db'};font-size:16px;">&#9733;</span>`
        ).join('');

        const html = `
            <div style="font-family:'Inter',Helvetica,Arial,sans-serif;background-color:${theme.cream};padding:40px 0;">
              <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,.1);border:1px solid #e6decd;">
                ${emailHeader()}
                <div style="padding:36px 30px;">
                  <p style="color:${theme.textMain};font-size:20px;font-weight:700;margin:0 0 12px;">Hello, ${name}!</p>
                  <p style="color:${theme.textMain};font-size:14px;line-height:1.7;margin:0 0 24px;">
                    We just wanted to let you know that <strong>${title}${authorName ? `, ${authorName}` : ''}</strong> is back in stock at Bagchee.com.
                    You can use the link below to purchase it.
                  </p>
                  <p style="color:${theme.textMain};font-size:16px;font-weight:700;margin:0 0 14px;border-bottom:2px solid #e6decd;padding-bottom:10px;">Back in stock</p>
                  <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #e6decd;border-radius:8px;overflow:hidden;margin-bottom:20px;">
                    <tr>
                      ${imageUrl ? `<td style="width:130px;padding:16px;background:#fafaf8;vertical-align:top;text-align:center;">
                        <a href="${productUrl}" target="_blank">
                          <img src="${imageUrl}" alt="${title}" style="width:100px;height:auto;border-radius:4px;display:block;margin:0 auto;" />
                        </a>
                      </td>` : ''}
                      <td style="padding:16px;vertical-align:top;">
                        <p style="font-size:16px;font-weight:700;color:${theme.textMain};margin:0 0 4px;">${title}</p>
                        ${authorName ? `<p style="font-size:13px;color:${theme.primary};margin:0 0 6px;">Author: <strong>${authorName}</strong></p>` : ''}
                        <p style="margin:0 0 8px;line-height:1;">${stars}</p>
                        ${synopsis ? `<p style="font-size:13px;color:#555;line-height:1.6;margin:0 0 10px;">${synopsis}</p>` : ''}
                        <table cellpadding="0" cellspacing="0" border="0"><tr>
                          <td style="padding-right:8px;">
                            <a href="${productUrl}" target="_blank" style="display:inline-block;background-color:${theme.primary};color:#fff;text-decoration:none;padding:10px 22px;font-size:13px;font-weight:700;border-radius:6px;">
                              &#9658; See more details
                            </a>
                          </td>
                          <td>
                            <a href="${productUrl}" target="_blank" style="display:inline-block;background-color:#f59e0b;color:#fff;text-decoration:none;padding:10px 14px;font-size:16px;font-weight:700;border-radius:6px;" title="Add to Wishlist">
                              &#9829;
                            </a>
                          </td>
                        </tr></table>
                      </td>
                    </tr>
                  </table>
                  <p style="font-size:12px;color:${theme.textMuted};margin:0;">Hurry — stock may be limited!</p>
                </div>
                ${emailFooter()}
              </div>
            </div>`;
        await transporter.sendMail({
            from: `"Bagchee" <no-reply@bagchee.com>`,
            to: email,
            subject: `Back in Stock: ${product.title || productUrl}`,
            html
        });
    } catch (error) {
        console.error('Back-in-stock email failed:', error.message);
    }
};