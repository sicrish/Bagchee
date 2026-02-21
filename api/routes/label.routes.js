import express from "express";
import * as LabelController from "../controller/label.controller.js";

const router = express.Router();

router.post("/save", LabelController.saveLabel);
router.get("/list", LabelController.getAllLabels);
router.get("/get/:id", LabelController.getLabelById);
router.patch("/update/:id", LabelController.updateLabel);
router.delete("/delete/:id", LabelController.deleteLabel);

export default router;