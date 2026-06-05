import 'dotenv/config'; // Must be first — loads .env before any other module reads process.env

// Fail fast — crash at startup if critical env vars are missing
const REQUIRED_ENV = ['JWT_SECRET_KEY', 'ENCRYPTION_SECRET', 'DATABASE_URL'];
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k]);
if (missingEnv.length) {
    throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
}

import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fileupload from 'express-fileupload';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
// 🟢 FIX 1: Decrypt Body Import karein (Check karein file path sahi ho)
import { decryptBody } from './middleware/decryptBody.js'

// Router Imports
import userroute from './routes/user.router.js';
import categoryroute from './routes/category.router.js';
import SubCategoryroute from './routes/Subcategory.js';
import Productrouter from './routes/Product.router.js';
import paymentRoutes from './routes/payment.router.js';
import bannerRoutes from './routes/banner.js';
import productTypeRoutes from "./routes/productType.routes.js";
import navigationRoutes from "./routes/navigation.routes.js";
import actorRoutes from "./routes/actor.routes.js";
import artistRoutes from "./routes/artist.routes.js";
import authorRoutes from "./routes/author.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import languageRoutes from "./routes/language.routes.js";
import tagRoutes from "./routes/tag.routes.js";
import formatRoutes from "./routes/format.routes.js";
import publisherRoutes from "./routes/publisher.routes.js";
import seriesRoutes from "./routes/series.routes.js";
import labelRoutes from "./routes/label.routes.js";
import helpPageRoutes from "./routes/helpPage.routes.js";
import orderRoutes from "./routes/order.routes.js";
import orderStatusRoutes from './routes/OrderStatus.routes.js';
import reviewRoutes from './routes/Review.routes.js';
import giftCardRoutes from './routes/giftCard.routes.js';
import courierRoutes from './routes/Courier.routes.js';
import shippingOptionRoutes from './routes/ShippingOption.route.js';
import homeSectionRoutes from './routes/homeSectionRoutes.js'
import homeSectionProductRoutes from './routes/homeSectionProductRoutes.js';
import mainCategoryRoutes from './routes/mainCategoryRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import metaTagRoutes from './routes/metaTagRoutes.js';
import topAuthorRoutes from './routes/topAuthorRoutes.js';
import homeSaleRoutes from './routes/HomeSaleProduct.routes.js';
import homeNewNoteworthyRoutes from './routes/HomeNewNoteworthy.routes.js'; 
import homeBestSellerRoutes from './routes/homeBestSeller.routes.js';
// 🟢 1. Import Route (File ke upar)
import homeSliderRoutes from './routes/HomeSlider.routes.js';
import booksOfMonthRoutes from './routes/booksOfMonth.routes.js';
import SettingRoutes from './routes/settingsRoutes.js'
import serviceRoutes from './routes/serviceRoutes.js'
import aboutRoutes from './routes/aboutRoutes.js'
import testimonialRoutes from './routes/testimonialRoutes.js'
import authorsPublishersRoutes from './routes/authorsPublishersRoutes.js'
import privacyRoutes from './routes/privacyRoutes.js'
import termsRoutes from './routes/termsRoutes.js'
import sideBannerOneRoutes from './routes/sideBannerOneRoutes.js';
import socialRoutes from './routes/socialRoutes.js'
import sideBannerTwoRoutes from './routes/sideBannerTwoRoutes.js'
import eGiftCardBannerRoutes from './routes/eGiftCardBanner.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js';
import footerRoutes from './routes/footerRoutes.js';
import razorpayRoutes from './routes/razorpay.routes.js';
import paypalRoutes from './routes/paypalRoutes.js';
import backInStockRoutes from './routes/backInStock.routes.js';
import emailCampaignRoutes from './routes/emailCampaignRoutes.js';
import { processScheduledEmails } from './controller/emailCampaignController.js';
import { sendMembershipExpiryReminder } from './controller/email.controller.js';
import { renderBookMeta } from './controller/ssr.controller.js';
import prisma from './lib/prisma.js';
import sitemapRoutes from './routes/sitemap.routes.js';
import disclaimerRoutes from './routes/disclaimerRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import geoRoutes from './routes/geo.routes.js';



const app = express();

// Trust proxy — required for Railway/Vercel (reverse proxy) so rate limiting works correctly
app.set('trust proxy', 1);

// Global Limiter
// Ek IP se 15 minute mein maximum 200 requests
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 200 : 2000,
    message: { status: false, msg: "Too many requests, please try again later." },
    standardHeaders: true, 
    legacyHeaders: false,
});

// 🟢 Strict Limiter: Sirf Login aur Register ke liye
// Ek IP se 1 ghante mein sirf 10 attempts (Brute force protection)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { status: false, msg: "Too many login attempts. Try again after an hour." }
});



// Prisma connects lazily on first query — no explicit connectDB() call needed.

const PORT = process.env.PORT || 3001;

// Directory Path Setup (ES Module fix)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Middlewares
// Prevent Cloudflare / browsers from caching any API response
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    next();
});
app.use(compression());

// ── Server-side meta injection for book pages (SEO / View-Source) ──
// Apache proxies the 2-segment book URL (/books/:bagcheeId/:slug) to this route so the
// pre-JS HTML (View Source / Bing / social scrapers) carries each book's admin meta
// title/description/keywords. Registered BEFORE the rate limiter so crawlers hitting
// many book pages are never throttled; it always falls back to the plain SPA shell.
app.get('/render/books/:bagcheeId/:slug', renderBookMeta);

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
}));
app.use(globalLimiter);// 1. Middlewares


const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(o => o.trim());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // Pre-flight cache for 24h
}));
app.use(express.json({ limit: '2mb' })); // 2mb — Jodit editor HTML can be large; encrypted payloads are ~33% bigger
app.use(express.urlencoded({ extended: true }));
app.use(decryptBody);

app.use(fileupload({
    createParentPath: true,
    limits: {
        fileSize: 10 * 1024 * 1024,   // 10MB per file
        fieldSize: 10 * 1024 * 1024,  // 10MB per text field (covers large Jodit HTML)
    },
    abortOnLimit: true,
    responseOnLimit: "File size limit has been exceeded. Max 10MB allowed.",
    limitHandler: (req, res, next) => {
        return res.status(413).json({ status: false, msg: "File too large! Max 10MB allowed." });
    }
}));


const cacheOptions = {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        if (process.env.NODE_ENV === 'production') {
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        } else {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
};


// Static folder for uploaded images
app.use('/uploads',(req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim());
    next();
}, express.static(path.join(__dirname, 'uploads'),cacheOptions));


// ==========================================================
// 🛡️ APPLY AUTH LIMITER (Must be above /user route)
// ==========================================================
app.use("/user/login", authLimiter);
app.use("/user/register", authLimiter);
// ==========================================================

// 3. Application Routes
app.use("/user", userroute);
app.use("/category", categoryroute);
app.use("/subcategory", SubCategoryroute);
app.use("/product", Productrouter);
app.use('/payments', paymentRoutes);
app.use("/banner", bannerRoutes);

app.use("/product-types", productTypeRoutes);
app.use("/navigation", navigationRoutes);
app.use("/actors", actorRoutes);
app.use("/artists", artistRoutes);
app.use("/authors", authorRoutes);
app.use("/coupons", couponRoutes);
app.use("/languages", languageRoutes);
app.use("/tags", tagRoutes);
app.use("/formats", formatRoutes);
app.use("/publishers", publisherRoutes);
app.use("/series", seriesRoutes);
app.use("/labels", labelRoutes);
app.use("/help-pages", helpPageRoutes);
app.use("/orders", orderRoutes);
app.use('/order-status', orderStatusRoutes);
app.use('/reviews', reviewRoutes);
app.use('/gift-cards', giftCardRoutes);
app.use('/couriers', courierRoutes);
app.use('/shipping-options', shippingOptionRoutes);
app.use('/home-sections', homeSectionRoutes);
app.use('/home-sections/products', homeSectionProductRoutes);
app.use('/main-categories', mainCategoryRoutes);
app.use('/newsletter-subs', newsletterRoutes);
app.use('/meta-tags', metaTagRoutes);
app.use('/top-authors', topAuthorRoutes);
app.use('/home-sale-products', homeSaleRoutes);
app.use('/home-new-noteworthy', homeNewNoteworthyRoutes);
app.use('/home-best-seller', homeBestSellerRoutes);
// 🟢 3. Use Route (Routes section mein)
app.use('/home-slider', homeSliderRoutes);
app.use('/books-of-the-month', booksOfMonthRoutes);
app.use('/settings',SettingRoutes);
app.use('/services', serviceRoutes)
app.use('/about-us', aboutRoutes);
app.use('/testimonials', testimonialRoutes);
app.use('/authors-publishers', authorsPublishersRoutes);
app.use('/privacy', privacyRoutes);
app.use('/terms', termsRoutes);
app.use('/disclaimer', disclaimerRoutes);
app.use('/contact', contactRoutes);
app.use('/geo', geoRoutes);
app.use('/side-banner-one', sideBannerOneRoutes);
app.use('/socials', socialRoutes);
app.use('/side-banner-two', sideBannerTwoRoutes);
app.use('/e-gift-card-banner', eGiftCardBannerRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/footer', footerRoutes);
app.use('/razorpay', razorpayRoutes);
app.use('/paypal', paypalRoutes);
app.use('/back-in-stock', backInStockRoutes);
app.use('/email-campaign', emailCampaignRoutes);
app.use('/', sitemapRoutes);

// Global 404 handler — must be after all routes
app.use((req, res) => {
    res.status(404).json({ status: false, msg: 'Route not found' });
});

// Global error handler — catches unhandled errors from any route
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message;
    if (process.env.NODE_ENV !== 'production') {
        console.error('Unhandled Error:', err);
    }
    res.status(statusCode).json({ status: false, msg: message });
});

// Prevent unhandled promise rejections from crashing the process
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
});

// Server Listen
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);

    // Check for scheduled emails every 60 seconds
    setInterval(() => processScheduledEmails().catch(err => console.error('Scheduler error:', err)), 60 * 1000);
    console.log('Scheduled email processor started (checks every 60s)');

    // Check for membership expiry reminders once per day
    let lastMembershipReminderCheck = null;
    const checkMembershipReminders = async () => {
        const now = new Date();
        if (lastMembershipReminderCheck && (now - lastMembershipReminderCheck) < 23 * 60 * 60 * 1000) return;
        lastMembershipReminderCheck = now;
        try {
            const in30 = new Date(now); in30.setDate(in30.getDate() + 30);
            const in28 = new Date(now); in28.setDate(in28.getDate() + 28);
            const users = await prisma.user.findMany({
                where: { membership: 'active', membershipEnd: { gte: in28, lte: in30 } },
                select: { email: true, name: true, membershipEnd: true }
            });
            for (const u of users) {
                const daysLeft = Math.ceil((new Date(u.membershipEnd) - now) / 86400000);
                await sendMembershipExpiryReminder(u.email, u.name, daysLeft, u.membershipEnd).catch(() => {});
            }
            if (users.length) console.log(`Membership reminders sent to ${users.length} user(s)`);
        } catch (err) {
            console.error('Membership reminder error:', err.message);
        }
    };
    setInterval(() => checkMembershipReminders().catch(() => {}), 60 * 60 * 1000);
    checkMembershipReminders().catch(() => {});
});

export default app;