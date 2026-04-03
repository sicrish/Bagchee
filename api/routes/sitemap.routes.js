import express from 'express';
import { getSitemapIndex, getSitemapStatic, getSitemapCategories, getSitemapProducts } from '../controller/sitemap.controller.js';

const router = express.Router();

router.get('/sitemap.xml',            getSitemapIndex);
router.get('/sitemap-static.xml',     getSitemapStatic);
router.get('/sitemap-categories.xml', getSitemapCategories);
router.get('/sitemap-products.xml',   getSitemapProducts);

export default router;
