import express from 'express';
import * as AboutController from '../controller/aboutController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — about us page
router.get('/get', AboutController.getAboutUs);

// ADMIN — update content
router.patch('/update', adminAuth, AboutController.updateAboutUs);

export default router;
