import express from 'express';
import * as PrivacyController from '../controller/privacyController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — privacy policy page
router.get('/get', PrivacyController.getPrivacy);

// ADMIN — update content
router.patch('/update', adminAuth, PrivacyController.updatePrivacy);

export default router;
