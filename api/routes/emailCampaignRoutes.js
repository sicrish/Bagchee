import express from 'express';
import {
    sendCampaignEmail,
    sendTestEmail,
    getRecipientsCount,
    scheduleCampaignEmail,
    getScheduledEmails,
    cancelScheduledEmail,
    fetchProductsForEmail
} from '../controller/emailCampaignController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// ADMIN ONLY — send campaign emails immediately
router.post('/send', adminAuth, sendCampaignEmail);

// ADMIN ONLY — schedule campaign for later
router.post('/schedule', adminAuth, scheduleCampaignEmail);

// ADMIN ONLY — list scheduled emails
router.get('/scheduled', adminAuth, getScheduledEmails);

// ADMIN ONLY — cancel a scheduled email
router.delete('/scheduled/:id', adminAuth, cancelScheduledEmail);

// ADMIN ONLY — send test email to single address
router.post('/send-test', adminAuth, sendTestEmail);

// ADMIN ONLY — get recipient count for preview
router.get('/recipients-count', adminAuth, getRecipientsCount);

// ADMIN ONLY — fetch product details by IDs for email product picker
router.post('/products-preview', adminAuth, fetchProductsForEmail);

export default router;
