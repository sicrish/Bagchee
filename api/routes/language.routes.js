import express from "express";
import * as LanguageController from "../controller/language.controller.js";
import adminOrStaff from '../middleware/adminOrStaff.middleware.js';

const router = express.Router();

// PUBLIC — languages used in website filters/dropdowns
router.get("/list",    LanguageController.getAllLanguages);
router.get("/get/:id", LanguageController.getLanguageById);

// ADMIN — mutations
router.post("/save",         adminOrStaff, LanguageController.saveLanguage);
router.patch("/update/:id",  adminOrStaff, LanguageController.updateLanguage);
router.delete("/delete/:id", adminOrStaff, LanguageController.deleteLanguage);

export default router;
