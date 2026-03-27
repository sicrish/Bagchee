import express from "express";
import * as Controller from "../controller/navigation.controller.js";
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — navigation rendered on every page of the website
router.get("/list",    Controller.getAllNavs);
router.get("/get/:id", Controller.getNavById);

// ADMIN — mutations
router.post("/save",         adminAuth, Controller.createNav);
router.patch("/update/:id",  adminAuth, Controller.updateNav);
router.delete("/delete/:id", adminAuth, Controller.deleteNav);

export default router;
