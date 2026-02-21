import express from 'express';
import * as NewsletterSubscriberController from '../controller/newsletterController.js';

const router = express.Router();

// Define Routes
router.post('/save', NewsletterSubscriberController.saveSubscriber);          // Create
router.get('/list', NewsletterSubscriberController.getAllSubscribers);        // Read All
router.get('/get/:id', NewsletterSubscriberController.getSubscriberById);     // Read One
router.patch('/update/:id', NewsletterSubscriberController.updateSubscriber); // Update
router.delete('/delete/:id', NewsletterSubscriberController.deleteSubscriber);// Delete

export default router;