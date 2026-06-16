import express from "express";
import * as ActorController from "../controller/actor.controller.js";
import adminOrStaff from '../middleware/adminOrStaff.middleware.js';

const router = express.Router();

// PUBLIC — actor data used in website
router.get("/list",    ActorController.getAllActors);
router.get("/get/:id", ActorController.getActorById);

// ADMIN — mutations
router.post("/save",         adminOrStaff, ActorController.saveActor);
router.patch("/update/:id",  adminOrStaff, ActorController.updateActor);
router.delete("/delete/:id", adminOrStaff, ActorController.deleteActor);

export default router;
