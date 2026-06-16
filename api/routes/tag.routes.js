import express from "express";
import * as TagController from "../controller/tag.controller.js";
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — tags used in website filters
router.get("/list",    TagController.getAllTags);
router.get("/get/:id", TagController.getTagById);

// ADMIN — mutations
router.post("/save",         adminAuth, TagController.saveTag);
router.patch("/update/:id",  adminAuth, TagController.updateTag);
router.delete("/delete/:id", adminAuth, TagController.deleteTag);

export default router;
