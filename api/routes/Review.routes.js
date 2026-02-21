import express from 'express';
import * as ReviewController from '../controller/Review.controller.js';

const router = express.Router();

router.post('/save', ReviewController.saveReview);
router.get('/list',ReviewController.getAllReviews);
router.get('/get/:id',ReviewController.getReviewById);
router.patch('/update/:id', ReviewController.updateReview);
router.delete('/delete/:id', ReviewController.deleteReview);

export default router;