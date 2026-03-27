import express from 'express';
import * as TermsController from '../controller/termsController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — terms & conditions page
router.get('/get', TermsController.getTerms);

// ADMIN — update content
router.patch('/update', adminAuth, TermsController.updateTerms);

export default router;
