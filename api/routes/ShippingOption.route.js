import express from 'express';
import * as ShippingOption from '../controller/ShippingOption.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — shipping options needed for checkout
router.get('/list',    ShippingOption.getAllShippingOptions);
router.get('/get/:id', ShippingOption.getShippingOptionById);

// ADMIN — mutations
router.post('/save',         adminAuth, ShippingOption.saveShippingOption);
router.patch('/update/:id',  adminAuth, ShippingOption.updateShippingOption);
router.delete('/delete/:id', adminAuth, ShippingOption.deleteShippingOption);

export default router;
