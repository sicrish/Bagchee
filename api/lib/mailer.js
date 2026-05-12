import nodemailer from 'nodemailer';

export const createTransporter = () => nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'mail.bagchee.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const FROM = () => `"Bagchee" <${process.env.EMAIL_USER}>`;
export const FROM_TEAM = () => `"Bagchee Team" <${process.env.EMAIL_USER}>`;
