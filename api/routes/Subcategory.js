import express from 'express';
import * as subcategoryController from '../controller/SubCategory.controller.js';
import adminOrStaff from '../middleware/adminOrStaff.middleware.js';

const router = express.Router();

// PUBLIC — website needs subcategory listing
router.get("/fetch", subcategoryController.fetch);

// ADMIN — mutations
router.post("/save",   adminOrStaff, subcategoryController.save);
router.post("/update", adminOrStaff, subcategoryController.update);
router.delete("/delete", adminOrStaff, subcategoryController.deleteSubCategory);

export default router;
