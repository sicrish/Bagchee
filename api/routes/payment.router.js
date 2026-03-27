import express from 'express';
import * as PaymentController from '../controller/payment.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — checkout page needs to list available payment methods
router.get('/list',    PaymentController.getAllPayments);
router.get('/get/:id', PaymentController.getPaymentById);

// ADMIN — payment method management
router.post('/save',         adminAuth, PaymentController.savePayment);
router.patch('/update/:id',  adminAuth, PaymentController.updatePayment);
router.delete('/delete/:id', adminAuth, PaymentController.deletePayment);

export default router;
