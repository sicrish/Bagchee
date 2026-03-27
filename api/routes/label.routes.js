import express from "express";
import * as LabelController from "../controller/label.controller.js";
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — labels used in website
router.get("/list",    LabelController.getAllLabels);
router.get("/get/:id", LabelController.getLabelById);

// ADMIN — mutations
router.post("/save",         adminAuth, LabelController.saveLabel);
router.patch("/update/:id",  adminAuth, LabelController.updateLabel);
router.delete("/delete/:id", adminAuth, LabelController.deleteLabel);

export default router;
