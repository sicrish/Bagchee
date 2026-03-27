import express from 'express';
import * as sectionController from '../controller/homeSectionController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — home sections displayed on website
router.get('/list',    sectionController.getSections);
router.get('/get/:id', sectionController.getSectionById);

// ADMIN — mutations
router.post('/save',          adminAuth, sectionController.saveSection);
router.patch('/update/:id',   adminAuth, sectionController.updateSection);
router.post('/bulk-update',   adminAuth, sectionController.bulkUpdateSections);
router.delete('/delete/:id',  adminAuth, sectionController.deleteSection);

export default router;
