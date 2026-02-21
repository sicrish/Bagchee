import express from 'express';
import * as mainCategoryController from '../controller/mainCategoryController.js';

const router = express.Router();

router.post('/save', mainCategoryController.saveCategory);
router.get('/list', mainCategoryController.listCategories);
router.get('/get/:id', mainCategoryController.getCategoryById);
router.put('/update/:id', mainCategoryController.updateCategory);
router.delete('/delete/:id', mainCategoryController.deleteCategory);

export default router;