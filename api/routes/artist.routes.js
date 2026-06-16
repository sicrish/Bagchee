import express from "express";
import * as ArtistController from "../controller/artist.controller.js";
import adminOrStaff from '../middleware/adminOrStaff.middleware.js';

const router = express.Router();

// PUBLIC — artist data used in website
router.get("/list",    ArtistController.getAllArtists);
router.get("/get/:id", ArtistController.getArtistById);

// ADMIN — mutations
router.post("/save",         adminOrStaff, ArtistController.saveArtist);
router.patch("/update/:id",  adminOrStaff, ArtistController.updateArtist);
router.delete("/delete/:id", adminOrStaff, ArtistController.deleteArtist);

export default router;
