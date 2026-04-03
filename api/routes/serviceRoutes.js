import express from 'express';
import * as ServiceController from '../controller/serviceController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — services displayed on website
router.get('/list',    ServiceController.listServices);
router.get('/get/:id', ServiceController.getService);

// ADMIN — mutations
router.post('/save',         adminAuth, ServiceController.saveService);
router.patch('/update/:id',  adminAuth, ServiceController.updateService);
router.delete('/delete/:id', adminAuth, ServiceController.deleteService);

export default router;
