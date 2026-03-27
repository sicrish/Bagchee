import express from 'express';
import * as RazorpayController from '../controller/razorpay.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// AUTH — must be logged in to initiate or verify payment
router.post('/create-order',              authMiddleware, RazorpayController.createRazorpayOrder);
router.post('/verify-payment',            authMiddleware, RazorpayController.verifyPayment);
router.post('/create-membership-order',   authMiddleware, RazorpayController.createMembershipOrder);
router.post('/verify-membership-payment', authMiddleware, RazorpayController.verifyMembershipPayment);

export default router;
