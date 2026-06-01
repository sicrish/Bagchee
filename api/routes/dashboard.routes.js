import express from 'express';
import { getDashboardSummary } from '../controller/dashboard.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

router.get('/summary', adminAuth, getDashboardSummary);

export default router;
