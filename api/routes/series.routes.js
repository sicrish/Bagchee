import express from "express";
import * as SeriesController from "../controller/series.controller.js";
import adminOrStaff from '../middleware/adminOrStaff.middleware.js';

const router = express.Router();

// PUBLIC — series data used in website
router.get("/list",           SeriesController.getAllSeries);
router.get("/by-slug/:slug",  SeriesController.getSeriesBySlug);
router.get("/get/:id",        SeriesController.getSeriesById);

// ADMIN — mutations
router.post("/save",         adminOrStaff, SeriesController.saveSeries);
router.patch("/update/:id",  adminOrStaff, SeriesController.updateSeries);
router.delete("/delete/:id", adminOrStaff, SeriesController.deleteSeries);

export default router;
