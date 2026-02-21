import express from 'express';
import * as orderStatus from '../controller/orderStatus.controller.js';

const router = express.Router();

// Define Routes
router.post('/save', orderStatus.createOrderStatus);        // Create
router.get('/list', orderStatus.getAllOrderStatus);         // Read All
router.get('/get/:id', orderStatus.getOrderStatusById);         // Read One
router.patch('/update/:id', orderStatus.updateOrderStatus);   // Update
router.delete('/delete/:id', orderStatus.deleteOrderStatus);// Delete

export default router;