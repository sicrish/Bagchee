import express from 'express';
import { save, list, getOne, update, remove, searchMainInventory,fetchForHome } from '../controller/HomeSaleProduct.controller.js';

const router = express.Router();

router.post('/save', save);
router.get('/list', list);
router.get('/get/:id', getOne);
router.put('/update/:id', update);
router.delete('/delete/:id', remove);

// 🟢 NEW ROUTE FOR DROPDOWN SEARCH
router.get('/search-inventory', searchMainInventory);
router.get('/frontend-list', fetchForHome);

export default router;