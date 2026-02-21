import express from "express";
import * as Controller from "../controller/navigation.controller.js";

const router = express.Router();

router.post("/save", Controller.createNav);
router.get("/list", Controller.getAllNavs);
router.get("/get/:id", Controller.getNavById);
router.patch("/update/:id", Controller.updateNav);
router.delete("/delete/:id", Controller.deleteNav);

export default router;