import express from 'express';
import * as TestimonialController from '../controller/testimonialController.js';

const router = express.Router();

router.get('/get', TestimonialController.getTestimonial);
router.patch('/update', TestimonialController.updateTestimonial);

export default router;