import express from 'express';
import { getGeo } from '../controller/geo.controller.js';

const router = express.Router();
router.get('/', getGeo);
export default router;
