import express from 'express';
import * as HomeBestSellerController from '../controller/HomeBestSeller.controller.js';

const router = express.Router();

router.post('/save', HomeBestSellerController.save);
router.get('/list', HomeBestSellerController.list);
router.delete('/delete/:id', HomeBestSellerController.remove);

// 🟢 4. EDIT KE LIYE (Ye missing tha - Zaroori hai)
router.get('/get/:id', HomeBestSellerController.getOne);
router.patch('/update/:id', HomeBestSellerController.update);
router.get('/search-inventory', HomeBestSellerController.searchMainInventory);
// 🟢 Frontend Route
router.get('/frontend-list', HomeBestSellerController.fetchForHome);

export default router;