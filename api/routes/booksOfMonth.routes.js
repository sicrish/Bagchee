import express from 'express';
import { saveBooksOfMonth, getActiveBooksOfMonth, getAllBooksOfMonthHistory, deleteBooksOfMonth, toggleBooksOfMonthStatus } from '../controller/booksOfMonth.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — active books of the month displayed on website
router.get('/active', getActiveBooksOfMonth);

// ADMIN — management
router.post('/save',         adminAuth, saveBooksOfMonth);
router.get('/history',       adminAuth, getAllBooksOfMonthHistory);
router.delete('/delete/:id',        adminAuth, deleteBooksOfMonth);
router.patch('/toggle/:id',         adminAuth, toggleBooksOfMonthStatus);

export default router;
