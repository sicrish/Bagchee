import express from 'express';
import { validateGiftCard, redeemToWallet, getMyBalance } from '../controller/giftCard.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/validate', validateGiftCard);
router.post('/redeem',   authMiddleware, redeemToWallet);
router.get('/my-balance', authMiddleware, getMyBalance);

export default router;
