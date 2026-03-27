import express from "express";
import * as OrderController from "../controller/order.controller.js";
import authMiddleware from '../middleware/auth.middleware.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// AUTH — any logged-in user can create an order or view own orders
router.post("/save",       authMiddleware, OrderController.saveOrder);
router.get("/my-orders",   authMiddleware, OrderController.getUserOrders);
router.get("/get/:id",     authMiddleware, OrderController.getOrderById); // ownership enforced in controller (Phase 2)

// ADMIN — full order management
router.get("/list",         adminAuth, OrderController.getAllOrders);
router.patch("/update/:id", adminAuth, OrderController.updateOrder);
router.delete("/delete/:id",adminAuth, OrderController.deleteOrder);

export default router;
