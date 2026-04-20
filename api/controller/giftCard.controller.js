import prisma from '../lib/prisma.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const theme = {
    primary: "#008DDA",
    textMain: "#0B2F3A",
    textLight: "#FFFFFF",
    cream: "#F7EEDD",
    textMuted: "#4A6fa5"
};

const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

const generateCode = () => {
    const seg = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${seg()}-${seg()}-${seg()}-${seg()}`;
};

const sendGiftCardEmail = async (giftCard) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const shopUrl = process.env.FRONTEND_URL || 'https://bagchee.com';
    const redeemUrl = `${shopUrl}/account/gift-cards`;

    const html = `
    <div style="font-family:'Inter',Helvetica,Arial,sans-serif;background-color:${theme.cream};padding:40px 0;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,.1);border:1px solid #e6decd;">

        <div style="background:${theme.primary};padding:28px 35px;display:flex;align-items:center;justify-content:space-between;">
          <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;letter-spacing:.5px;">Bagchee</h1>
          <span style="color:rgba(255,255,255,.85);font-size:13px;">E-Gift Card</span>
        </div>

        <div style="padding:40px 35px;">
          <h2 style="color:${theme.textMain};font-size:22px;margin:0 0 10px;">Hello, ${escapeHtml(giftCard.recipientName)}!</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 28px;">
            You have received a <strong>$${giftCard.amount.toFixed(2)} Bagchee E-Gift Card</strong> from
            <strong>${escapeHtml(giftCard.senderName)}</strong>. You can redeem your card code at your account page.
          </p>

          <!-- Gift card visual -->
          <div style="background:linear-gradient(135deg,#005f9e 0%,${theme.primary} 60%,#41C9E2 100%);border-radius:14px;padding:32px 28px;margin-bottom:28px;position:relative;overflow:hidden;">
            <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;background:rgba(255,255,255,.08);border-radius:50%;"></div>
            <p style="color:rgba(255,255,255,.8);font-size:11px;letter-spacing:.2em;text-transform:uppercase;margin:0 0 4px;">Bagchee</p>
            <p style="color:#fff;font-size:14px;font-weight:600;margin:0 0 20px;">E-Gift Card</p>
            <p style="color:#fff;font-size:38px;font-weight:700;margin:0 0 20px;letter-spacing:1px;">$${giftCard.amount.toFixed(2)}</p>
            <p style="color:rgba(255,255,255,.75);font-size:11px;letter-spacing:.15em;text-transform:uppercase;margin:0 0 4px;">Instant Delivery</p>
            <p style="color:#fff;font-size:13px;margin:0;">Valid for all Bagchee products</p>
          </div>

          ${giftCard.message ? `
          <div style="background:#fffdf5;border-left:3px solid ${theme.primary};padding:16px 20px;border-radius:6px;margin-bottom:28px;">
            <p style="color:#888;font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin:0 0 6px;">Personal Message</p>
            <p style="color:${theme.textMain};font-size:14px;line-height:1.6;margin:0;font-style:italic;">"${escapeHtml(giftCard.message)}"</p>
          </div>
          ` : ''}

          <div style="background:#f4f8fb;border-radius:10px;padding:20px 24px;margin-bottom:28px;text-align:center;">
            <p style="color:#888;font-size:11px;letter-spacing:.15em;text-transform:uppercase;margin:0 0 8px;">Your Card Code</p>
            <p style="color:${theme.textMain};font-size:24px;font-weight:700;letter-spacing:.2em;margin:0;font-family:monospace;">${escapeHtml(giftCard.code)}</p>
          </div>

          <div style="text-align:center;">
            <a href="${redeemUrl}" style="display:inline-block;background:${theme.textMain};color:#fff;text-decoration:none;padding:14px 36px;font-size:14px;font-weight:700;border-radius:8px;letter-spacing:.05em;">Redeem Card Now</a>
          </div>
        </div>

        <div style="background:#fffdf5;padding:20px 35px;border-top:1px solid #e6decd;text-align:center;">
          <p style="font-size:12px;color:${theme.textMuted};margin:0 0 6px;">www.bagchee.com</p>
          <p style="font-size:11px;color:#aaa;margin:0;">Please do not reply to this email. This mailbox is not monitored.</p>
        </div>
      </div>
    </div>`;

    await transporter.sendMail({
        from: `"Bagchee Team" <${process.env.EMAIL_USER}>`,
        to: giftCard.recipientEmail,
        subject: `You've received a $${giftCard.amount.toFixed(2)} Bagchee E-Gift Card from ${giftCard.senderName}!`,
        html
    });
};

// Called internally from order.controller after order is saved
export const createGiftCardsForOrder = async (giftCardItems, orderId) => {
    for (const item of giftCardItems) {
        let code;
        let attempts = 0;
        do {
            code = generateCode();
            attempts++;
        } while (attempts < 5 && await prisma.giftCard.findUnique({ where: { code } }));

        const amount = parseFloat(item.amount);
        const giftCard = await prisma.giftCard.create({
            data: {
                code,
                amount,
                balance: amount,
                recipientEmail: item.recipientEmail,
                recipientName: item.recipientName,
                senderName: item.senderName,
                message: item.message || null,
                orderId: orderId || null,
                isActive: true
            }
        });

        sendGiftCardEmail(giftCard).catch(() => {});
    }
};

// POST /gift-cards/validate  — check a code and return its balance
export const validateGiftCard = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ status: false, msg: 'Code is required' });

        const gc = await prisma.giftCard.findUnique({ where: { code: code.trim().toUpperCase() } });
        if (!gc || !gc.isActive) return res.status(404).json({ status: false, msg: 'Invalid or expired gift card code' });
        if (gc.balance <= 0) return res.status(400).json({ status: false, msg: 'This gift card has no remaining balance' });

        res.json({ status: true, balance: gc.balance, amount: gc.amount, code: gc.code });
    } catch (err) {
        res.status(500).json({ status: false, msg: 'Server error' });
    }
};

// POST /gift-cards/redeem  — add gift card balance to user's wallet (requires auth)
export const redeemToWallet = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ status: false, msg: 'Code is required' });

        const userId = parseInt(req.user.userId);

        const gc = await prisma.giftCard.findUnique({ where: { code: code.trim().toUpperCase() } });
        if (!gc || !gc.isActive) return res.status(404).json({ status: false, msg: 'Invalid or expired gift card code' });
        if (gc.balance <= 0) return res.status(400).json({ status: false, msg: 'This gift card has no remaining balance' });

        // Move the full remaining balance to user wallet, zero out the gift card
        const [updatedUser] = await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { giftCardBalance: { increment: gc.balance } }
            }),
            prisma.giftCard.update({
                where: { code: gc.code },
                data: { balance: 0, isActive: false }
            })
        ]);

        res.json({ status: true, msg: `$${gc.balance.toFixed(2)} added to your wallet!`, newBalance: updatedUser.giftCardBalance });
    } catch (err) {
        res.status(500).json({ status: false, msg: 'Server error' });
    }
};

// GET /gift-cards/my-balance  — get logged-in user's wallet balance
export const getMyBalance = async (req, res) => {
    try {
        const userId = parseInt(req.user.userId);
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { giftCardBalance: true } });
        res.json({ status: true, balance: user?.giftCardBalance || 0 });
    } catch (err) {
        res.status(500).json({ status: false, msg: 'Server error' });
    }
};

// POST /gift-cards/apply-wallet  — deduct wallet balance during checkout (called server-side, or from order controller)
export const applyWalletBalance = async (userId, amountToDeduct) => {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { giftCardBalance: true } });
    const available = user?.giftCardBalance || 0;
    const deducted = Math.min(available, amountToDeduct);
    if (deducted > 0) {
        await prisma.user.update({ where: { id: userId }, data: { giftCardBalance: { decrement: deducted } } });
    }
    return deducted;
};
