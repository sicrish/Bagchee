import express from 'express';
import * as PaymentController from '../controller/payment.controller.js';

const router = express.Router();

router.post('/save', PaymentController.savePayment);
router.get('/list', PaymentController.getAllPayments);
router.get('/get/:id', PaymentController.getPaymentById);
router.patch('/update/:id', PaymentController.updatePayment);
router.delete('/delete/:id', PaymentController.deletePayment);

export default router;