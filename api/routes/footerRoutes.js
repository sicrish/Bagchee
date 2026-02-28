import express from 'express';
import * as FooterController from '../controller/footerController.js';

const router = express.Router();

router.post('/save', FooterController.saveFooter);
router.get('/list', FooterController.listFooter);
router.get('/get/:id', FooterController.getFooterById);
router.patch('/update/:id', FooterController.updateFooter);
router.delete('/delete/:id', FooterController.deleteFooter)

export default router;