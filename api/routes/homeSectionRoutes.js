import express from 'express';
import * as sectionController from '../controller/homeSectionController.js';

const router = express.Router();

router.get('/list', sectionController.getSections);
router.get('/get/:id', sectionController.getSectionById);
router.post('/save', sectionController.saveSection);
router.patch('/update/:id', sectionController.updateSection);
router.post('/bulk-update', sectionController.bulkUpdateSections);
router.delete('/delete/:id', sectionController.deleteSection);

export default router;