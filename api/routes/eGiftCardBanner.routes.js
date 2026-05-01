import express from 'express';
import * as ctrl from '../controller/eGiftCardBanner.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

router.get('/list',     ctrl.list);
router.get('/get/:id',  ctrl.getOne);

router.post('/save',         adminAuth, ctrl.save);
router.patch('/update/:id',  adminAuth, ctrl.updateBanner);
router.delete('/delete/:id', adminAuth, ctrl.deleteBanner);

export default router;
