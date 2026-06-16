import express from "express";
import * as PublisherController from "../controller/publisher.controller.js";
import adminOrStaff from '../middleware/adminOrStaff.middleware.js';

const router = express.Router();

// PUBLIC — publisher data used in website
router.get("/list",           PublisherController.getAllPublishers);
router.get("/by-slug/:slug",  PublisherController.getPublisherBySlug);
router.get("/get/:id",        PublisherController.getPublisherById);

// ADMIN — mutations
router.post("/save",         adminOrStaff, PublisherController.savePublisher);
router.patch("/update/:id",  adminOrStaff, PublisherController.updatePublisher);
router.delete("/delete/:id", adminOrStaff, PublisherController.deletePublisher);

export default router;
