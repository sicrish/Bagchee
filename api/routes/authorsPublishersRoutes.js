import express from 'express';
import * as APController from '../controller/authorsPublishersController.js';

const router = express.Router();

router.get('/get', APController.getData);
router.patch('/update', APController.updateData);

export default router;