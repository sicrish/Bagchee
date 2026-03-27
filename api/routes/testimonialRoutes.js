import express from 'express';
import * as TestimonialController from '../controller/testimonialController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — testimonials displayed on website
// NOTE: /get/:id must be registered BEFORE /get to avoid route shadowing
router.get('/get/:id', TestimonialController.getTestimonialById);
router.get('/get',     TestimonialController.getTestimonial);
router.get('/list',    TestimonialController.listTestimonials);

// ADMIN — mutations
router.post('/save',        adminAuth, TestimonialController.saveTestimonial);
router.patch('/update',     adminAuth, TestimonialController.updateTestimonial);
router.delete('/delete/:id',adminAuth, TestimonialController.deleteTestimonial);

export default router;
