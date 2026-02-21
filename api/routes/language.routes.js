import express from "express";
import * as LanguageController from "../controller/language.controller.js";

const router = express.Router();

// Define Routes
router.post("/save", LanguageController.saveLanguage);          // Create
router.get("/list", LanguageController.getAllLanguages);        // Read All
router.get("/get/:id", LanguageController.getLanguageById);     // Read One
router.patch("/update/:id", LanguageController.updateLanguage);   // Update
router.delete("/delete/:id", LanguageController.deleteLanguage);// Delete

export default router;