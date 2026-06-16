import express from 'express';
import * as categorycontroller from '../controller/category.controller.js';
import adminOrStaff from '../middleware/adminOrStaff.middleware.js';

const category = express.Router();

// PUBLIC — website needs category listing
category.get("/fetch", categorycontroller.fetchCategory);

// ADMIN — mutations
category.post("/save",          adminOrStaff, categorycontroller.save);
category.post("/update",        adminOrStaff, categorycontroller.updateCategory);
category.delete("/delete/:id",  adminOrStaff, categorycontroller.deletecategory);

export default category;
