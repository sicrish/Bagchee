import express from 'express';
import * as AboutController from '../controller/aboutController.js';

const router = express.Router();

router.get('/get', AboutController.getAboutUs);
router.patch('/update', AboutController.updateAboutUs);

export default router;