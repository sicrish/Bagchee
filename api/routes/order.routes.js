import express from "express";
import * as OrderController from "../controller/order.controller.js";
import authMiddleware from '../middleware/auth.middleware.js';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — payment page token validation (no auth needed, token is the secret)
router.get("/pay/:orderId/:token", OrderController.getOrderForPayment);

// PUBLIC — guest order lookup by order number + shipping email
router.post("/guest-track", OrderController.guestTrackOrder);

// AUTH — logged-in or guest can create an order; optionalAuth populates req.user if token present
router.post("/save",       optionalAuth, OrderController.saveOrder);
router.get("/my-orders",   authMiddleware, OrderController.getUserOrders);
router.get("/get/:id",     authMiddleware, OrderController.getOrderById);

// ADMIN — full order management
router.get("/admin/get/:id", adminAuth, OrderController.getOrderById);
router.get("/list",         adminAuth, OrderController.getAllOrders);
router.patch("/update/:id", adminAuth, OrderController.updateOrder);
router.delete("/delete/:id",adminAuth, OrderController.deleteOrder);
router.post("/:id/approve",                adminAuth, OrderController.approveOrder);
router.post("/:id/resend-payment-link",    adminAuth, OrderController.resendPaymentLink);
router.post("/:id/send-shipped-email", adminAuth, OrderController.sendShippedEmail);
router.post("/:id/send-status-email",  adminAuth, OrderController.sendStatusEmail);
router.post("/:id/cancel",             authMiddleware, OrderController.cancelOrder);

export default router;
