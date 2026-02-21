import express from 'express';
const category = express.Router();
import * as categorycontroller from '../controller/category.controller.js'
category.post("/save", categorycontroller.save);
category.get("/fetch", categorycontroller.fetchCategory);
category.post("/update", categorycontroller.updateCategory);
category.delete("/delete/:id", categorycontroller.deletecategory);



export default category;