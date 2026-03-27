import express from 'express';
import * as HomeBestSellerController from '../controller/HomeBestSeller.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — homepage display
router.get('/frontend-list', HomeBestSellerController.fetchForHome);

// ADMIN — management
router.get('/list',             adminAuth, HomeBestSellerController.list);
router.get('/get/:id',          adminAuth, HomeBestSellerController.getOne);
router.get('/search-inventory', adminAuth, HomeBestSellerController.searchMainInventory);
router.post('/save',            adminAuth, HomeBestSellerController.save);
router.patch('/update/:id',     adminAuth, HomeBestSellerController.update);
router.delete('/delete/:id',    adminAuth, HomeBestSellerController.remove);

export default router;
