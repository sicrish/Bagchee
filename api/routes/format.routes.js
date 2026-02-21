import express from "express";
import * as FormatController from "../controller/format.controller.js";

const router = express.Router();

// Define Routes
router.post("/save", FormatController.saveFormat);          // Create
router.get("/list", FormatController.getAllFormats);        // Read All
router.get("/get/:id", FormatController.getFormatById);     // Read One
router.patch("/update/:id", FormatController.updateFormat);   // Update
router.delete("/delete/:id", FormatController.deleteFormat);// Delete

export default router;