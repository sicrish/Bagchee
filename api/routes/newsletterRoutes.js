import express from 'express';
import * as NewsletterSubscriberController from '../controller/newsletterController.js';
import { unsubscribeNewsletter } from '../controller/emailCampaignController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — anyone can subscribe or unsubscribe
router.post('/save', NewsletterSubscriberController.saveSubscriber);
router.get('/unsubscribe', unsubscribeNewsletter);

// ADMIN — subscriber management
router.get('/list',           adminAuth, NewsletterSubscriberController.getAllSubscribers);
router.get('/get/:id',        adminAuth, NewsletterSubscriberController.getSubscriberById);
router.patch('/update/:id',   adminAuth, NewsletterSubscriberController.updateSubscriber);
router.delete('/delete/:id',  adminAuth, NewsletterSubscriberController.deleteSubscriber);

export default router;
