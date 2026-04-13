import express from 'express';
import { listMetaTags, getMetaTag, saveMetaTag, deleteMetaTag, getMetaTagByPage } from '../controller/metaTagController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — frontend fetches meta tags by page URL
router.get('/page', getMetaTagByPage);

// ADMIN — meta tag management
router.get('/list',         adminAuth, listMetaTags);
router.get('/get/:id',      adminAuth, getMetaTag);
router.post('/save',        adminAuth, saveMetaTag);
router.delete('/delete/:id', adminAuth, deleteMetaTag);

export default router;
