import express from 'express';
import rateLimit from 'express-rate-limit';
import * as NewsletterSubscriberController from '../controller/newsletterController.js';
import { unsubscribeNewsletter } from '../controller/emailCampaignController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// Strict per-IP limiter for the public anti-spam endpoints. A real person
// subscribes once; this caps automated bursts (and the confirmation emails
// they would trigger) while staying invisible to genuine users.
const newsletterLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,   // 1 hour
    max: 8,                     // 8 attempts / hour / IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: false, msg: 'Too many attempts. Please try again later.' },
});

// PUBLIC — captcha + honeypot + rate-limited double opt-in subscription
router.get('/categories',  NewsletterSubscriberController.getNewsletterCategories);
router.post('/subscribe',  newsletterLimiter, NewsletterSubscriberController.subscribePublic);
router.post('/confirm',    newsletterLimiter, NewsletterSubscriberController.confirmSubscriber);
router.get('/unsubscribe', unsubscribeNewsletter);

// ADMIN — subscriber management (/save is admin-only: it creates an active
// subscriber with no captcha. The public path is /subscribe above.)
router.post('/save',          adminAuth, NewsletterSubscriberController.saveSubscriber);
router.get('/list',           adminAuth, NewsletterSubscriberController.getAllSubscribers);
router.get('/get/:id',        adminAuth, NewsletterSubscriberController.getSubscriberById);
router.patch('/update/:id',   adminAuth, NewsletterSubscriberController.updateSubscriber);
router.delete('/delete/:id',  adminAuth, NewsletterSubscriberController.deleteSubscriber);

export default router;
