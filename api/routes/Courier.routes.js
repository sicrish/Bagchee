import express from 'express';
import * as courierController from '../controller/Courier.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — courier list may be needed for order tracking display
router.get('/list',    courierController.getAllCouriers);
router.get('/get/:id', courierController.getCourierById);

// ADMIN — courier management
router.post('/save',         adminAuth, courierController.saveCourier);
router.patch('/update/:id',  adminAuth, courierController.updateCourier);
router.delete('/delete/:id', adminAuth, courierController.deleteCourier);

export default router;
