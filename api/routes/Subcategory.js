import express from 'express';
import * as subcategoryController from '../controller/SubCategory.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — website needs subcategory listing
router.get("/fetch", subcategoryController.fetch);

// ADMIN — mutations
router.post("/save",   adminAuth, subcategoryController.save);
router.post("/update", adminAuth, subcategoryController.update);
router.delete("/delete", adminAuth, subcategoryController.deleteSubCategory);

export default router;
