import express from 'express';
import { save, list, getOne, update, remove, searchMainInventory, fetchForHome } from '../controller/HomeSaleProduct.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — homepage display
router.get('/frontend-list', fetchForHome);

// ADMIN — management
router.get('/list',             adminAuth, list);
router.get('/get/:id',          adminAuth, getOne);
router.get('/search-inventory', adminAuth, searchMainInventory);
router.post('/save',            adminAuth, save);
router.put('/update/:id',       adminAuth, update);
router.delete('/delete/:id',    adminAuth, remove);

export default router;
