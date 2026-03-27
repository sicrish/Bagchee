import express from "express";
import * as SeriesController from "../controller/series.controller.js";
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — series data used in website
router.get("/list",    SeriesController.getAllSeries);
router.get("/get/:id", SeriesController.getSeriesById);

// ADMIN — mutations
router.post("/save",         adminAuth, SeriesController.saveSeries);
router.patch("/update/:id",  adminAuth, SeriesController.updateSeries);
router.delete("/delete/:id", adminAuth, SeriesController.deleteSeries);

export default router;
