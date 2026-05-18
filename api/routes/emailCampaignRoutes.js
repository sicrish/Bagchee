import express from 'express';
import {
    sendCampaignEmail,
    sendTestEmail,
    getRecipientsCount,
    getAudienceCounts,
    scheduleCampaignEmail,
    getScheduledEmails,
    cancelScheduledEmail,
    getCampaignHistory,
    resendCampaign,
    fetchProductsForEmail,
    uploadNewsletterBanner,
    listNewsletterBanners,
    deleteNewsletterBanner,
} from '../controller/emailCampaignController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

router.post('/send',            adminAuth, sendCampaignEmail);
router.post('/schedule',        adminAuth, scheduleCampaignEmail);
router.get('/scheduled',        adminAuth, getScheduledEmails);
router.delete('/scheduled/:id', adminAuth, cancelScheduledEmail);
router.post('/send-test',       adminAuth, sendTestEmail);
router.get('/recipients-count', adminAuth, getRecipientsCount);
router.get('/audience-counts',  adminAuth, getAudienceCounts);
router.get('/history',          adminAuth, getCampaignHistory);
router.post('/resend/:id',      adminAuth, resendCampaign);
router.post('/products-preview',adminAuth, fetchProductsForEmail);
router.post('/banner/upload',   adminAuth, uploadNewsletterBanner);
router.get('/banner/list',      adminAuth, listNewsletterBanners);
router.delete('/banner',        adminAuth, deleteNewsletterBanner);

export default router;
