import express from "express";
import * as AuthorController from "../controller/author.controller.js";
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — author data used in website dropdowns and detail pages
router.get("/list",           AuthorController.getAllAuthors);
router.get("/batch",          AuthorController.getAuthorsByIds);
router.get("/by-slug/:slug",  AuthorController.getAuthorBySlug);
router.get("/get/:id",        AuthorController.getAuthorById);

// ADMIN — mutations
router.post("/save",         adminAuth, AuthorController.saveAuthor);
router.patch("/update/:id",  adminAuth, AuthorController.updateAuthor);
router.delete("/delete/:id", adminAuth, AuthorController.deleteAuthor);

export default router;
