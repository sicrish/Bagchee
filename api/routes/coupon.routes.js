import express from "express";
import * as CouponController from "../controller/coupon.controller.js";
import authMiddleware from '../middleware/auth.middleware.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// AUTH — checkout operations (logged-in users only)
router.get("/active", authMiddleware, CouponController.getActiveCoupons);
router.post("/apply", authMiddleware, CouponController.applyCoupon);

// ADMIN — coupon management
router.post("/save",          adminAuth, CouponController.saveCoupon);
router.get("/list",           adminAuth, CouponController.getAllCoupons);
router.get("/get/:id",        adminAuth, CouponController.getCouponById);
router.patch("/update/:id",   adminAuth, CouponController.updateCoupon);
router.delete("/delete/:id",  adminAuth, CouponController.deleteCoupon);

export default router;
