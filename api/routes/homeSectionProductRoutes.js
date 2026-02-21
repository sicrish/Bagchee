import express from 'express';
import * as controller from '../controller/homeSectionProductController.js';

const router = express.Router();

// ✅ NEW: Section 1 ki specific list
router.get('/section-one/list', controller.getSectionOneProducts);

// ✅ NEW: Section 2 ki specific list
router.get('/section-two/list', controller.getSectionTwoProducts);

router.get('/section-three/list', controller.getSectionThreeProducts);

router.get('/section-four/list', controller.getSectionFourProducts);
// router.get('/list', controller.);
router.get('/get/:id', controller.getSectionProductById);
router.post('/save', controller.saveProductToSection);
router.patch('/update/:id', controller.updateSectionProduct);
router.delete('/delete/:id', controller.deleteSectionProduct);

export default router;