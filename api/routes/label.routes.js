import express from "express";
import * as LabelController from "../controller/label.controller.js";
import adminOrStaff from '../middleware/adminOrStaff.middleware.js';

const router = express.Router();

// PUBLIC — labels used in website
router.get("/list",    LabelController.getAllLabels);
router.get("/get/:id", LabelController.getLabelById);

// ADMIN — mutations
router.post("/save",         adminOrStaff, LabelController.saveLabel);
router.patch("/update/:id",  adminOrStaff, LabelController.updateLabel);
router.delete("/delete/:id", adminOrStaff, LabelController.deleteLabel);

export default router;
