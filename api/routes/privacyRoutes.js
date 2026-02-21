import express from 'express';
import * as PrivacyController from '../controller/privacyController.js';

const router = express.Router();

router.get('/get', PrivacyController.getPrivacy);
router.patch('/update', PrivacyController.updatePrivacy);

export default router;