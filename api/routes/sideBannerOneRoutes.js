import express from 'express';
import * as SideBannerOneController from '../controller/sideBannerOneController.js';


const router = express.Router();



router.post('/save', SideBannerOneController.saveBanner);
router.get('/list', SideBannerOneController.listBanners);
router.get('/get/:id', SideBannerOneController.getBanner);
router.patch('/update/:id', SideBannerOneController.updateBanner);
router.delete('/delete/:id', SideBannerOneController.deleteBanner);

export default router;