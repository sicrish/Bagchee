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
    getCampaignById,
    getCampaignPreviewHtml,
    getCampaignDeliveryLogs,
    viewCampaignInBrowser,
} from '../controller/emailCampaignController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

router.post('/send',                    adminAuth, sendCampaignEmail);
router.post('/schedule',                adminAuth, scheduleCampaignEmail);
router.get('/scheduled',                adminAuth, getScheduledEmails);
router.delete('/scheduled/:id',         adminAuth, cancelScheduledEmail);
router.post('/send-test',               adminAuth, sendTestEmail);
router.get('/recipients-count',         adminAuth, getRecipientsCount);
router.get('/audience-counts',          adminAuth, getAudienceCounts);
router.get('/history',                  adminAuth, getCampaignHistory);
router.post('/resend/:id',              adminAuth, resendCampaign);
router.post('/products-preview',        adminAuth, fetchProductsForEmail);
router.post('/banner/upload',           adminAuth, uploadNewsletterBanner);
router.get('/banner/list',              adminAuth, listNewsletterBanners);
router.delete('/banner',                adminAuth, deleteNewsletterBanner);
// PUBLIC — "View in Browser" link in every sent newsletter footer (no auth; newsletter is public content)
router.get('/:id/view',                 viewCampaignInBrowser);
// Campaign detail / delivery logs — keep these after named routes to avoid conflicts
router.get('/:id/preview',              adminAuth, getCampaignPreviewHtml);
router.get('/:id/delivery-logs',        adminAuth, getCampaignDeliveryLogs);
router.get('/:id',                      adminAuth, getCampaignById);

export default router;
