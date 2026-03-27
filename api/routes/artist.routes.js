import express from "express";
import * as ArtistController from "../controller/artist.controller.js";
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — artist data used in website
router.get("/list",    ArtistController.getAllArtists);
router.get("/get/:id", ArtistController.getArtistById);

// ADMIN — mutations
router.post("/save",         adminAuth, ArtistController.saveArtist);
router.patch("/update/:id",  adminAuth, ArtistController.updateArtist);
router.delete("/delete/:id", adminAuth, ArtistController.deleteArtist);

export default router;
