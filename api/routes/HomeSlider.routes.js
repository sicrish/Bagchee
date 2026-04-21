import express from 'express';
import * as HomeSliderController from '../controller/HomeSlider.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — slider displayed on homepage
router.get('/list',    HomeSliderController.list);
router.get('/get/:id', HomeSliderController.getOne);

// ADMIN — management
router.post('/save',         adminAuth, HomeSliderController.save);
router.patch('/update/:id',  adminAuth, HomeSliderController.update);
router.delete('/delete/:id', adminAuth, HomeSliderController.remove);

export default router;
