import express from 'express';
import * as categorycontroller from '../controller/category.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const category = express.Router();

// PUBLIC — website needs category listing
category.get("/fetch", categorycontroller.fetchCategory);

// ADMIN — mutations
category.post("/save",          adminAuth, categorycontroller.save);
category.post("/update",        adminAuth, categorycontroller.updateCategory);
category.delete("/delete/:id",  adminAuth, categorycontroller.deletecategory);

export default category;
