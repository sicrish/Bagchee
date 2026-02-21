import express from 'express';
import * as HomeSliderController from '../controller/HomeSlider.controller.js';

const router = express.Router();

// ==============================
// 🛡️ ADMIN ROUTES
// ==============================

// 1. Save (No middleware needed here if express-fileupload is in app.js)
router.post('/save', HomeSliderController.save);

// 2. List
router.get('/list', HomeSliderController.list);

// 3. Delete
router.delete('/delete/:id', HomeSliderController.remove);

// 4. Get One
router.get('/get/:id', HomeSliderController.getOne);

// 5. Update
router.put('/update/:id', HomeSliderController.update);

export default router;