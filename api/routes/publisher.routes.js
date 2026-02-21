import express from "express";
import * as PublisherController from "../controller/publisher.controller.js";


const router = express.Router();

// Define Routes
// Use upload.single('image') if you are uploading files
router.post("/save", PublisherController.savePublisher);
router.get("/list", PublisherController.getAllPublishers);
router.get("/get/:id", PublisherController.getPublisherById);
router.patch("/update/:id", PublisherController.updatePublisher);
router.delete("/delete/:id", PublisherController.deletePublisher);

export default router;