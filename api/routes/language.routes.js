import express from "express";
import * as LanguageController from "../controller/language.controller.js";
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — languages used in website filters/dropdowns
router.get("/list",    LanguageController.getAllLanguages);
router.get("/get/:id", LanguageController.getLanguageById);

// ADMIN — mutations
router.post("/save",         adminAuth, LanguageController.saveLanguage);
router.patch("/update/:id",  adminAuth, LanguageController.updateLanguage);
router.delete("/delete/:id", adminAuth, LanguageController.deleteLanguage);

export default router;
