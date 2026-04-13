import express from "express";
import rateLimit from "express-rate-limit";
import * as CouponController from "../controller/coupon.controller.js";
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

const couponApplyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { status: false, msg: "Too many coupon attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// PUBLIC — checkout operations (guests + logged-in users)
router.get("/active", CouponController.getActiveCoupons);
router.post("/apply", couponApplyLimiter, CouponController.applyCoupon);

// ADMIN — coupon management
router.post("/save",          adminAuth, CouponController.saveCoupon);
router.get("/list",           adminAuth, CouponController.getAllCoupons);
router.get("/get/:id",        adminAuth, CouponController.getCouponById);
router.patch("/update/:id",   adminAuth, CouponController.updateCoupon);
router.delete("/delete/:id",  adminAuth, CouponController.deleteCoupon);

export default router;
