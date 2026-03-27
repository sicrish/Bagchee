import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

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

        const domain=process.env.FRONTEND_URL;
        const verificationLink = `${domain}/verify?email=${email}`;

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
                            Thank you for joining <strong>Bagchee</strong>! We are excited to help you find your next great read. <br>
                            Please verify your email to unlock full access.
                        </p>

                        <a href="${verificationLink}" style="display: inline-block; background-color: ${theme.primary}; color: ${theme.textLight}; text-decoration: none; padding: 14px 32px; font-size: 16px; font-weight: bold; border-radius: 8px; transition: background-color 0.3s ease;">
                            Verify My Account
                        </a>

                        <p style="margin-top: 35px; font-size: 13px; color: ${theme.textMuted};">
                            If the button doesn't work, verify using this link:<br>
                            <a href="${verificationLink}" style="color: ${theme.primary}; font-weight: 600;">${verificationLink}</a>
                        </p>
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

export const sendOrderConfirmation = async (email, order) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

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
            subject: `Order Confirmed — #${order.orderNumber}`,
            html: template
        });
    } catch (error) {
        console.error('Order confirmation email failed:', error.message);
    }
};