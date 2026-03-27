import express from 'express';
import * as SideBannerOneController from '../controller/sideBannerOneController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — side banners displayed on website
router.get('/list',    SideBannerOneController.listBanners);
router.get('/get/:id', SideBannerOneController.getBanner);

// ADMIN — mutations
router.post('/save',         adminAuth, SideBannerOneController.saveBanner);
router.patch('/update/:id',  adminAuth, SideBannerOneController.updateBanner);
router.delete('/delete/:id', adminAuth, SideBannerOneController.deleteBanner);

export default router;
