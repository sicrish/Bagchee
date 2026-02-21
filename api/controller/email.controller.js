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
                        <h1 style="color: ${theme.textLight}; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">Pick&Pay Store</h1>
                        <p style="color: ${theme.textLight}; margin-top: 5px; opacity: 0.9; font-size: 14px;">Your Favorite Bookstore</p>
                    </div>

                    <div style="padding: 40px 30px; text-align: center;">
                        <h2 style="color: ${theme.textMain}; font-size: 24px; margin-bottom: 20px; font-weight: 600;">Welcome, ${name}! 👋</h2>
                        
                        <p style="color: ${theme.textMain}; font-size: 16px; line-height: 1.6; margin-bottom: 30px; opacity: 0.8;">
                            Thank you for joining <strong>Pick&Pay</strong>! We are excited to help you find your next great read. <br>
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
                        <p style="font-size: 12px; color: ${theme.textMuted}; margin: 0;">&copy; ${new Date().getFullYear()} Pick&Pay Store. All rights reserved.</p>
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
        console.log('Email Error:', error);
    }
};

export default sendMail;