import express from 'express';
import { saveSocial, listSocials, getSocialById, updateSocial, deleteSocial } from '../controller/socialController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — social links displayed in website footer/header
router.get('/list',    listSocials);
router.get('/get/:id', getSocialById);

// ADMIN — mutations
router.post('/save',         adminAuth, saveSocial);
router.put('/update/:id',    adminAuth, updateSocial);
router.delete('/delete/:id', adminAuth, deleteSocial);

export default router;
