import express from 'express';

const router = express.Router();

//to link a controller on router
import * as subcategoryController from '../controller/SubCategory.controller.js';

router.post("/save",subcategoryController.save);
router.get("/fetch",subcategoryController.fetch);
router.post("/update",subcategoryController.update);
router.delete("/delete",subcategoryController.deleteSubCategory);
export default router;