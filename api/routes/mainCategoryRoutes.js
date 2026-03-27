import express from 'express';
import * as mainCategoryController from '../controller/mainCategoryController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — main categories displayed on website
router.get('/list',    mainCategoryController.listCategories);
router.get('/get/:id', mainCategoryController.getCategoryById);

// ADMIN — mutations
router.post('/save',         adminAuth, mainCategoryController.saveCategory);
router.put('/update/:id',    adminAuth, mainCategoryController.updateCategory);
router.delete('/delete/:id', adminAuth, mainCategoryController.deleteCategory);

export default router;
