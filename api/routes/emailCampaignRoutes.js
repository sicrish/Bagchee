import express from 'express';
import { sendCampaignEmail, sendTestEmail, getRecipientsCount } from '../controller/emailCampaignController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// ADMIN ONLY — send campaign emails
router.post('/send', adminAuth, sendCampaignEmail);

// ADMIN ONLY — send test email to single address
router.post('/send-test', adminAuth, sendTestEmail);

// ADMIN ONLY — get recipient count for preview
router.get('/recipients-count', adminAuth, getRecipientsCount);

export default router;
