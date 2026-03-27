import express from "express";
import * as FormatController from "../controller/format.controller.js";
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — formats used in website filters/dropdowns
router.get("/list",    FormatController.getAllFormats);
router.get("/get/:id", FormatController.getFormatById);

// ADMIN — mutations
router.post("/save",         adminAuth, FormatController.saveFormat);
router.patch("/update/:id",  adminAuth, FormatController.updateFormat);
router.delete("/delete/:id", adminAuth, FormatController.deleteFormat);

export default router;
