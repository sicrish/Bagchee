import express from "express";
import * as HelpPageController from "../controller/helpPage.controller.js";

const router = express.Router();

router.post("/save", HelpPageController.saveHelpPage);
router.get("/list", HelpPageController.getAllHelpPages);
router.get("/get/:id", HelpPageController.getHelpPageById);
router.patch("/update/:id", HelpPageController.updateHelpPage);
router.delete("/delete/:id", HelpPageController.deleteHelpPage);

export default router;