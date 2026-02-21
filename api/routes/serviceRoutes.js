import express from 'express';
import * as ServiceController from '../controller/serviceController.js';

const router = express.Router();

router.post('/save', ServiceController.saveService);
router.get('/list', ServiceController.listServices);
router.get('/get/:id', ServiceController.getService);
router.put('/update/:id', ServiceController.updateService);
router.delete('/delete/:id', ServiceController.deleteService);

export default router;