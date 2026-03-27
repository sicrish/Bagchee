import express from 'express';
import * as controller from '../controller/homeSectionProductController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — section product lists displayed on website homepage
router.get('/section-one/list',   controller.getSectionOneProducts);
router.get('/section-two/list',   controller.getSectionTwoProducts);
router.get('/section-three/list', controller.getSectionThreeProducts);
router.get('/section-four/list',  controller.getSectionFourProducts);

// ADMIN — management
router.get('/get/:id',       adminAuth, controller.getSectionProductById);
router.post('/save',         adminAuth, controller.saveProductToSection);
router.patch('/update/:id',  adminAuth, controller.updateSectionProduct);
router.delete('/delete/:id', adminAuth, controller.deleteSectionProduct);

export default router;
