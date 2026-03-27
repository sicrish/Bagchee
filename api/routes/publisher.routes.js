import express from "express";
import * as PublisherController from "../controller/publisher.controller.js";
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — publisher data used in website
router.get("/list",    PublisherController.getAllPublishers);
router.get("/get/:id", PublisherController.getPublisherById);

// ADMIN — mutations
router.post("/save",         adminAuth, PublisherController.savePublisher);
router.patch("/update/:id",  adminAuth, PublisherController.updatePublisher);
router.delete("/delete/:id", adminAuth, PublisherController.deletePublisher);

export default router;
