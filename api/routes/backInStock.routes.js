import express from 'express';
import { subscribe } from '../controller/backInStock.controller.js';

const router = express.Router();

router.post('/subscribe', subscribe);

export default router;
