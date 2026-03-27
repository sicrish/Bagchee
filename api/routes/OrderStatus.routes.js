import express from 'express';
import * as orderStatus from '../controller/orderStatus.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — order statuses needed for display (e.g. order tracking page)
router.get('/list',    orderStatus.getAllOrderStatus);
router.get('/get/:id', orderStatus.getOrderStatusById);

// ADMIN — mutations
router.post('/save',         adminAuth, orderStatus.createOrderStatus);
router.patch('/update/:id',  adminAuth, orderStatus.updateOrderStatus);
router.delete('/delete/:id', adminAuth, orderStatus.deleteOrderStatus);

export default router;
