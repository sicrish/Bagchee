import express from 'express';
import * as SideBannerTwoController from '../controller/sideBannerTwoController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — side banners displayed on website
router.get('/list',    SideBannerTwoController.listBanners);
router.get('/get/:id', SideBannerTwoController.getBanner);

// ADMIN — mutations
router.post('/save',         adminAuth, SideBannerTwoController.saveBanner);
router.patch('/update/:id',  adminAuth, SideBannerTwoController.updateBanner);
router.delete('/delete/:id', adminAuth, SideBannerTwoController.deleteBanner);

export default router;
