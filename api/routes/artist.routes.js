import express from "express";
import * as ArtistController from "../controller/artist.controller.js";

const router = express.Router();

// Define Routes
router.post("/save", ArtistController.saveArtist);          // Create
router.get("/list", ArtistController.getAllArtists);        // Read All
router.get("/get/:id", ArtistController.getArtistById);     // Read One
router.patch("/update/:id", ArtistController.updateArtist);   // Update
router.delete("/delete/:id", ArtistController.deleteArtist);// Delete

export default router;