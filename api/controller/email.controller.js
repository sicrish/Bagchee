import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import prisma from '../lib/prisma.js';

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

const sendMail = async (email, name) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const shopUrl = process.env.FRONTEND_URL || 'https://bagchee.com';

        // template
        const emailTemplate = `
            <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: ${theme.cream}; padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e6decd;">

                    <div style="background-color: ${theme.primary}; padding: 35px; text-align: center;">
                        <h1 style="color: ${theme.textLight}; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">Bagchee</h1>
                        <p style="color: ${theme.textLight}; margin-top: 5px; opacity: 0.9; font-size: 14px;">Your Favorite Bookstore</p>
                    </div>

                    <div style="padding: 40px 30px; text-align: center;">
                        <h2 style="color: ${theme.textMain}; font-size: 24px; margin-bottom: 20px; font-weight: 600;">Welcome, ${escapeHtml(name)}! 👋</h2>

                        <p style="color: ${theme.textMain}; font-size: 16px; line-height: 1.6; margin-bottom: 30px; opacity: 0.8;">
                            Thank you for joining <strong>Bagchee</strong>! We are excited to help you find your next great read.
                        </p>

                        <a href="${shopUrl}" style="display: inline-block; background-color: ${theme.primary}; color: ${theme.textLight}; text-decoration: none; padding: 14px 32px; font-size: 16px; font-weight: bold; border-radius: 8px;">
                            Start Shopping
                        </a>
                    </div>

                    <div style="background-color: #fffdf5; padding: 20px; text-align: center; border-top: 1px solid #e6decd;">
                        <p style="font-size: 12px; color: ${theme.textMuted}; margin: 0;">&copy; ${new Date().getFullYear()} Bagchee. All rights reserved.</p>
                        <div style="margin-top: 8px;">
                            <span style="font-size: 12px; color: ${theme.textMuted}; opacity: 0.7;">Indore, India</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const mailOptions = {
            from: `"Bagchee Team" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome! Verify your Account 📘',
            html: emailTemplate
        };

        const info = await transporter.sendMail(mailOptions);
        // console.log('Theme Email sent: ' + info.response);

    } catch (error) {
        console.error('Email send failed:', error.message);
    }
};

export default sendMail;

export const sendPasswordResetEmail = async (email, name, resetLink) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const emailTemplate = `
            <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: ${theme.cream}; padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e6decd;">

                    <div style="background-color: ${theme.primary}; padding: 35px; text-align: center;">
                        <h1 style="color: ${theme.textLight}; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">Bagchee</h1>
                        <p style="color: ${theme.textLight}; margin-top: 5px; opacity: 0.9; font-size: 14px;">Your Favorite Bookstore</p>
                    </div>

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

                    <div style="background-color: #fffdf5; padding: 20px; text-align: center; border-top: 1px solid #e6decd;">
                        <p style="font-size: 12px; color: ${theme.textMuted}; margin: 0;">&copy; ${new Date().getFullYear()} Bagchee. All rights reserved.</p>
                        <div style="margin-top: 8px;">
                            <span style="font-size: 12px; color: ${theme.textMuted}; opacity: 0.7;">Indore, India</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"Bagchee" <${process.env.EMAIL_USER}>`,
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
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        // Read admin BCC addresses from settings
        let bccAddresses = null;
        try {
            const settings = await prisma.settings.findFirst({ orderBy: { id: 'desc' }, select: { emailsCopy: true } });
            if (settings?.emailsCopy?.trim()) bccAddresses = settings.emailsCopy.trim();
        } catch { /* non-critical — don't block the email */ }

        const itemRows = (order.items || []).map(item => `
            <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e6decd; color: ${theme.textMain};">${escapeHtml(item.name || item.product?.title || 'Item')}</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e6decd; text-align: center; color: ${theme.textMain};">${Number(item.quantity) || 0}</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e6decd; text-align: right; color: ${theme.textMain};">${escapeHtml(order.currency || 'INR')} ${Number(item.price).toFixed(2)}</td>
            </tr>
        `).join('');

        const template = `
            <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: ${theme.cream}; padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e6decd;">
                    <div style="background-color: ${theme.primary}; padding: 35px; text-align: center;">
                        <h1 style="color: ${theme.textLight}; margin: 0; font-size: 26px; font-weight: 700;">Bagchee</h1>
                        <p style="color: ${theme.textLight}; margin-top: 5px; opacity: 0.9; font-size: 14px;">Order Confirmed!</p>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: ${theme.textMain}; font-size: 20px; margin-bottom: 6px;">Thank you for your order!</h2>
                        <p style="color: ${theme.textMain}; opacity: 0.7; margin-bottom: 24px;">Order #<strong>${escapeHtml(order.orderNumber)}</strong> has been placed successfully.</p>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="text-align: left; padding-bottom: 8px; border-bottom: 2px solid #e6decd; color: ${theme.textMuted}; font-size: 13px;">Item</th>
                                    <th style="text-align: center; padding-bottom: 8px; border-bottom: 2px solid #e6decd; color: ${theme.textMuted}; font-size: 13px;">Qty</th>
                                    <th style="text-align: right; padding-bottom: 8px; border-bottom: 2px solid #e6decd; color: ${theme.textMuted}; font-size: 13px;">Price</th>
                                </tr>
                            </thead>
                            <tbody>${itemRows}</tbody>
                        </table>
                        <div style="margin-top: 20px; text-align: right;">
                            <p style="font-size: 18px; font-weight: 700; color: ${theme.textMain};">Total: ${order.currency || 'INR'} ${Number(order.total).toFixed(2)}</p>
                        </div>
                        <div style="margin-top: 24px; background: #f9f5ee; border-radius: 8px; padding: 16px; font-size: 13px; color: ${theme.textMain};">
                            <strong>Shipping to:</strong><br/>
                            ${escapeHtml(order.shippingFirstName)} ${escapeHtml(order.shippingLastName)}<br/>
                            ${escapeHtml(order.shippingAddress1)}${order.shippingAddress2 ? ', ' + escapeHtml(order.shippingAddress2) : ''}<br/>
                            ${escapeHtml(order.shippingCity)}, ${escapeHtml(order.shippingState)} ${escapeHtml(order.shippingPostcode)}<br/>
                            ${escapeHtml(order.shippingCountry)}
                        </div>
                    </div>
                    <div style="background-color: #fffdf5; padding: 20px; text-align: center; border-top: 1px solid #e6decd;">
                        <p style="font-size: 12px; color: ${theme.textMuted}; margin: 0;">&copy; ${new Date().getFullYear()} Bagchee. All rights reserved.</p>
                    </div>
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"Bagchee" <${process.env.EMAIL_USER}>`,
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
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        const template = `
            <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: ${theme.cream}; padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e6decd;">
                    <div style="background-color: ${theme.primary}; padding: 35px; text-align: center;">
                        <h1 style="color: ${theme.textLight}; margin: 0; font-size: 26px; font-weight: 700;">Bagchee</h1>
                        <p style="color: ${theme.textLight}; margin-top: 5px; opacity: 0.9; font-size: 14px;">Your order is on its way!</p>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: ${theme.textMain}; font-size: 20px; margin-bottom: 6px;">Your order has been shipped! 📦</h2>
                        <p style="color: ${theme.textMain}; opacity: 0.7; margin-bottom: 24px;">Order #<strong>${escapeHtml(order.orderNumber)}</strong> is on its way to you.</p>
                        <div style="background: #f9f5ee; border-radius: 8px; padding: 16px; font-size: 13px; color: ${theme.textMain}; margin-bottom: 20px;">
                            <strong>Shipping to:</strong><br/>
                            ${escapeHtml(order.shippingFirstName)} ${escapeHtml(order.shippingLastName)}<br/>
                            ${escapeHtml(order.shippingAddress1)}${order.shippingAddress2 ? ', ' + escapeHtml(order.shippingAddress2) : ''}<br/>
                            ${escapeHtml(order.shippingCity)}, ${escapeHtml(order.shippingState)} ${escapeHtml(order.shippingPostcode)}<br/>
                            ${escapeHtml(order.shippingCountry)}
                        </div>
                        ${order.courierName ? `<p style="font-size: 14px; color: ${theme.textMain};"><strong>Courier:</strong> ${escapeHtml(String(order.courierName))}</p>` : ''}
                        ${order.trackingId ? `<p style="font-size: 14px; color: ${theme.textMain};"><strong>Tracking ID:</strong> ${escapeHtml(String(order.trackingId))}</p>` : ''}
                        <p style="margin-top: 20px; font-size: 14px; color: ${theme.textMuted};">We'll notify you when your order is delivered. Thank you for shopping with Bagchee!</p>
                    </div>
                    <div style="background-color: #fffdf5; padding: 20px; text-align: center; border-top: 1px solid #e6decd;">
                        <p style="font-size: 12px; color: ${theme.textMuted}; margin: 0;">&copy; ${new Date().getFullYear()} Bagchee. All rights reserved.</p>
                    </div>
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"Bagchee" <${process.env.EMAIL_USER}>`,
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
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

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
                    <div style="background-color: ${theme.primary}; padding: 35px; text-align: center;">
                        <h1 style="color: ${theme.textLight}; margin: 0; font-size: 26px; font-weight: 700;">Bagchee</h1>
                        <p style="color: ${theme.textLight}; margin-top: 5px; opacity: 0.9; font-size: 14px;">Order Status Update</p>
                    </div>
                    <div style="padding: 40px 30px; text-align: center;">
                        <h2 style="color: ${theme.textMain}; font-size: 20px; margin-bottom: 16px;">Order #${escapeHtml(order.orderNumber)}</h2>
                        <div style="display: inline-block; background-color: ${statusColor}; color: white; padding: 10px 28px; border-radius: 8px; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">
                            ${escapeHtml(order.status)}
                        </div>
                        <p style="margin-top: 24px; font-size: 14px; color: ${theme.textMain}; opacity: 0.7;">
                            Your order status has been updated. If you have any questions, please don't hesitate to contact us.
                        </p>
                    </div>
                    <div style="background-color: #fffdf5; padding: 20px; text-align: center; border-top: 1px solid #e6decd;">
                        <p style="font-size: 12px; color: ${theme.textMuted}; margin: 0;">&copy; ${new Date().getFullYear()} Bagchee. All rights reserved.</p>
                    </div>
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"Bagchee" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Order Update: ${order.status} — #${order.orderNumber}`,
            html: template
        });
    } catch (error) {
        console.error('Order status email failed:', error.message);
        throw error;
    }
};