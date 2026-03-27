import express from "express";
import * as ProductTypeController from "../controller/productType.controller.js";
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — product types used in website filters/dropdowns
router.get("/list",    ProductTypeController.getAllProductTypes);
router.get("/get/:id", ProductTypeController.getProductTypeById);

// ADMIN — mutations
router.post("/save",         adminAuth, ProductTypeController.saveProductType);
router.patch("/update/:id",  adminAuth, ProductTypeController.updateProductType);
router.delete("/delete/:id", adminAuth, ProductTypeController.deleteProductType);

export default router;
