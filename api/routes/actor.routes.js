import express from "express";
import * as ActorController from "../controller/actor.controller.js";
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — actor data used in website
router.get("/list",    ActorController.getAllActors);
router.get("/get/:id", ActorController.getActorById);

// ADMIN — mutations
router.post("/save",         adminAuth, ActorController.saveActor);
router.patch("/update/:id",  adminAuth, ActorController.updateActor);
router.delete("/delete/:id", adminAuth, ActorController.deleteActor);

export default router;
