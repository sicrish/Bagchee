import express from "express";
import * as CouponController from "../controller/coupon.controller.js";

const router = express.Router();

router.get("/active", CouponController.getActiveCoupons);

// Define Routes
router.post("/save", CouponController.saveCoupon);          // Create
router.get("/list", CouponController.getAllCoupons);        // Read All
router.get("/get/:id", CouponController.getCouponById);     // Read One
router.patch("/update/:id", CouponController.updateCoupon);   // Update
router.delete("/delete/:id", CouponController.deleteCoupon);// Delete

export default router;