import express from "express";
import * as ActorController from "../controller/actor.controller.js";

const router = express.Router();

// Routes Definition
router.post("/save", ActorController.saveActor);          // Create
router.get("/list", ActorController.getAllActors);        // Read All
router.get("/get/:id", ActorController.getActorById);     // Read One
router.patch("/update/:id", ActorController.updateActor);   // Update
router.delete("/delete/:id", ActorController.deleteActor);// Delete

export default router;