import express from 'express';
import * as TermsController from '../controller/termsController.js'; 
const router = express.Router();

router.get('/get', TermsController.getTerms);
router.patch('/update', TermsController.updateTerms);

export default router;