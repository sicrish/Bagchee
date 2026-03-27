import express from 'express';
import * as bannerController from '../controller/banner.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — banners displayed on website
router.get("/fetch",    bannerController.fetch);
router.get("/list",     bannerController.list);
router.get("/get/:id",  bannerController.getOne);

// ADMIN — mutations
router.post("/save",         adminAuth, bannerController.save);
router.patch("/update/:id",  adminAuth, bannerController.updateBanner);
router.delete("/delete/:id", adminAuth, bannerController.deleteBanner);

export default router;
