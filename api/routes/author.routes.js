import express from "express";
import * as AuthorController from "../controller/author.controller.js";

const router = express.Router();

// Define Routes
router.post("/save", AuthorController.saveAuthor);          // Create
router.get("/list", AuthorController.getAllAuthors);        // Read All
router.get("/get/:id", AuthorController.getAuthorById);     // Read One
router.patch("/update/:id", AuthorController.updateAuthor);   // Update
router.delete("/delete/:id", AuthorController.deleteAuthor);// Delete

export default router;