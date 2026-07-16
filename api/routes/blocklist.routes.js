import express from 'express';
import adminAuth from '../middleware/adminAuth.middleware.js';
import { listBlocked, createBlocked, deleteBlocked } from '../controller/blocklist.controller.js';

const router = express.Router();

router.get('/list', adminAuth, listBlocked);
router.post('/create', adminAuth, createBlocked);
router.delete('/:id', adminAuth, deleteBlocked);

export default router;
