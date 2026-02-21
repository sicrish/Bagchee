import express from "express";
import * as TagController from "../controller/tag.controller.js";

const router = express.Router();

// Define Routes
router.post("/save", TagController.saveTag);          // Create
router.get("/list", TagController.getAllTags);        // Read All
router.get("/get/:id", TagController.getTagById);     // Read One
router.patch("/update/:id", TagController.updateTag);   // Update
router.delete("/delete/:id", TagController.deleteTag);// Delete

export default router;