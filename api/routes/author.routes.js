import express from "express";
import * as AuthorController from "../controller/author.controller.js";
import adminOrStaff from '../middleware/adminOrStaff.middleware.js';

const router = express.Router();

// PUBLIC — author data used in website dropdowns and detail pages
router.get("/list",           AuthorController.getAllAuthors);
router.get("/batch",          AuthorController.getAuthorsByIds);
router.get("/by-slug/:slug",  AuthorController.getAuthorBySlug);
router.get("/get/:id",        AuthorController.getAuthorById);
router.get("/:id/books",      AuthorController.getBooksByAuthorId);

// ADMIN — mutations
router.post("/save",         adminOrStaff, AuthorController.saveAuthor);
router.patch("/update/:id",  adminOrStaff, AuthorController.updateAuthor);
router.delete("/delete/:id", adminOrStaff, AuthorController.deleteAuthor);

export default router;
