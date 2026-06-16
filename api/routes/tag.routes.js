import express from "express";
import * as TagController from "../controller/tag.controller.js";
import adminOrStaff from '../middleware/adminOrStaff.middleware.js';

const router = express.Router();

// PUBLIC — tags used in website filters
router.get("/list",    TagController.getAllTags);
router.get("/get/:id", TagController.getTagById);

// ADMIN — mutations
router.post("/save",         adminOrStaff, TagController.saveTag);
router.patch("/update/:id",  adminOrStaff, TagController.updateTag);
router.delete("/delete/:id", adminOrStaff, TagController.deleteTag);

export default router;
