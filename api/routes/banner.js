import express from 'express';
import * as bannerController from '../controller/banner.controller.js';

const router = express.Router();

// Banner Routes
router.post("/save", bannerController.save);      // Banner save karne ke liye
router.get("/fetch", bannerController.fetch);     // Frontend par dikhane ke liye
router.delete("/delete", bannerController.deleteBanner); // Delete karne ke liye

export default router;