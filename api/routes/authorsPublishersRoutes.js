import express from 'express';
import * as APController from '../controller/authorsPublishersController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — authors/publishers page on website
router.get('/get', APController.getData);

// ADMIN — update content
router.patch('/update', adminAuth, APController.updateData);

export default router;
