import express from 'express';
import { createPayPalOrder, capturePayPalOrder, createPayPalOrderByToken, capturePayPalOrderByToken } from '../controller/paypal.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { decryptBody } from '../middleware/decryptBody.js';

const router = express.Router();

// create-order routes receive encrypted bodies from axiosConfig interceptor
router.post('/create-order-by-token', decryptBody, createPayPalOrderByToken);
router.post('/capture-by-token',      capturePayPalOrderByToken); // plain axios from PayPalReturn.jsx — no encryption
router.post('/create-order',   decryptBody, authMiddleware, createPayPalOrder);
router.post('/capture-order',  authMiddleware, capturePayPalOrder); // plain axios from PayPalReturn.jsx — no encryption

export default router;
