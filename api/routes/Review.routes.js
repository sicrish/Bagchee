import express from 'express';
import * as ReviewController from '../controller/Review.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — reviews displayed on product pages
router.get('/list',    ReviewController.getAllReviews);
router.get('/get/:id', ReviewController.getReviewById);

// AUTH — any logged-in user can submit a review
router.post('/save', authMiddleware, ReviewController.saveReview);

// ADMIN — review moderation
router.patch('/update/:id',  adminAuth, ReviewController.updateReview);
router.delete('/delete/:id', adminAuth, ReviewController.deleteReview);

export default router;
