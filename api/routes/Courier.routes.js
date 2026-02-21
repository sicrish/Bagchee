import express from 'express';
import * as courierController from '../controller/Courier.controller.js';

const router = express.Router();

router.post('/save', courierController.saveCourier);
router.get('/list', courierController.getAllCouriers);
router.get('/get/:id', courierController.getCourierById);
router.patch('/update/:id', courierController.updateCourier);
router.delete('/delete/:id', courierController.deleteCourier);

export default router;