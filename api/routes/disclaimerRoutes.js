import express from 'express';
import * as DisclaimerController from '../controller/disclaimerController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

router.get('/get', DisclaimerController.getDisclaimer);
router.patch('/update', adminAuth, DisclaimerController.updateDisclaimer);

export default router;
