import express from "express";
import * as HelpPageController from "../controller/helpPage.controller.js";
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — help pages displayed on website
router.get("/list",    HelpPageController.getAllHelpPages);
router.get("/get/:id", HelpPageController.getHelpPageById);

// ADMIN — mutations
router.post("/save",         adminAuth, HelpPageController.saveHelpPage);
router.patch("/update/:id",  adminAuth, HelpPageController.updateHelpPage);
router.delete("/delete/:id", adminAuth, HelpPageController.deleteHelpPage);

export default router;
