import express from 'express';
import * as FooterController from '../controller/footerController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — footer content displayed on every page
router.get('/list',    FooterController.listFooter);
router.get('/get/:id', FooterController.getFooterById);

// ADMIN — mutations
router.post('/save',         adminAuth, FooterController.saveFooter);
router.patch('/update/:id',  adminAuth, FooterController.updateFooter);
router.delete('/delete/:id', adminAuth, FooterController.deleteFooter);

export default router;
