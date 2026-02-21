import express from "express";
import * as ProductTypeController from "../controller/productType.controller.js";

const router = express.Router();

// 🟢 Save (Create)
router.post("/save", ProductTypeController.saveProductType);

// 🔵 Fetch All (Read List)
router.get("/list", ProductTypeController.getAllProductTypes);

// 🟡 Fetch Single (Read One - Edit karte waqt data bharne ke liye)
router.get("/get/:id", ProductTypeController.getProductTypeById);

// 🟠 Update
router.patch("/update/:id", ProductTypeController.updateProductType);

// 🔴 Delete
router.delete("/delete/:id", ProductTypeController.deleteProductType);

export default router;