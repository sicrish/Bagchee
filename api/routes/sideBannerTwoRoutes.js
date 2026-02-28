import express from 'express';
import * as SideBannerTwoController from '../controller/sideBannerTwoController.js';

const router = express.Router();

router.post('/save', SideBannerTwoController.saveBanner);
router.get('/list', SideBannerTwoController.listBanners);
router.get('/get/:id', SideBannerTwoController.getBanner);
router.patch('/update/:id', SideBannerTwoController.updateBanner);
router.delete('/delete/:id', SideBannerTwoController.deleteBanner);

export default router;