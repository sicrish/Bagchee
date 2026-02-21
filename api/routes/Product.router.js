import express from 'express';
// Controller ka naam ab 'ProductController' hi rahega standard maintain karne ke liye
import * as ProductController from '../controller/Product.controller.js'; 

const router = express.Router();

// 🟢 1. SAVE (Create)
router.post("/save", ProductController.save);
router.get("/filter-options", ProductController.getFilterOptions);

// 🟢 2. FETCH LIST (Read) 
// Maine dono raste khol diye hain taaki 404 Error kabhi na aaye
router.get("/list", ProductController.fetch); 
router.get("/fetch", ProductController.fetch);

// 🟢 3. FETCH SINGLE BY ID (Book route se liya)
// Iske liye Controller me 'getProductById' function hona chahiye, 
// agar nahi hai to filhal ise comment kar sakte hain.
router.get("/get/:id", ProductController.fetch); 

router.get("/best-sellers", ProductController.getBestSellers);
router.get("/recommended", ProductController.getRecommended);

router.get("/sale-products", ProductController.getSaleProducts); 
router.get("/new-arrivals", ProductController.getNewArrivals);

// 🟢 4. UPDATE (PATCH use kiya)
// Frontend ko ID body me bhejni hogi ya URL me, ye controller par depend karta hai.
// Safe side ke liye maine body wala approach rakha hai jo Product controller me tha.
router.patch("/update/:id", ProductController.update);

// 🟢 5. DELETE
// Delete ke liye ID URL me aana zaroori hai (Safety ke liye)
router.delete("/delete/:id", ProductController.deleteProduct);

export default router;