import express from "express";
import * as SeriesController from "../controller/series.controller.js";

const router = express.Router();

// Route: /api/series/...
router.post("/save", SeriesController.saveSeries);          // Create
router.get("/list", SeriesController.getAllSeries);         // Read All
router.get("/get/:id", SeriesController.getSeriesById);     // Read One
router.patch("/update/:id", SeriesController.updateSeries);   // Update
router.delete("/delete/:id", SeriesController.deleteSeries);// Delete

export default router;