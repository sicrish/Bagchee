import express from 'express';
import * as ProductController from '../controller/Product.controller.js';
import adminOrStaff from '../middleware/adminOrStaff.middleware.js';
import optionalAuth from '../middleware/optionalAuth.middleware.js';

const router = express.Router();

// PUBLIC — product catalog reads (optionalAuth so admin showAll param works)
router.get("/list",              optionalAuth, ProductController.fetch);
router.get("/fetch",             optionalAuth, ProductController.fetch);
router.get("/get/:id",           optionalAuth, ProductController.fetch);
router.get("/related/:bagcheeId",             ProductController.getRelatedProducts);
router.get("/search-suggestions",             ProductController.searchSuggestions);
router.get("/filter-options",                 ProductController.getFilterOptions);
router.get("/best-sellers",                   ProductController.getBestSellers);
router.get("/recommended",                    ProductController.getRecommended);
router.get("/sale-products",                  ProductController.getSaleProducts);
router.get("/sale-categories",                ProductController.getSaleCategories);
router.get("/new-arrival-categories",         ProductController.getNewArrivalCategories);
router.get("/new-arrivals",                   ProductController.getNewArrivals);

// ADMIN — product mutations
router.post("/save",          adminOrStaff, ProductController.save);
router.patch("/update/:id",   adminOrStaff, ProductController.update);
router.delete("/delete/:id",  adminOrStaff, ProductController.deleteProduct);

export default router;
