import express from 'express';
import { 
    saveBooksOfMonth, 
    getActiveBooksOfMonth, 
    getAllBooksOfMonthHistory, 
    deleteBooksOfMonth 
} from '../controller/booksOfMonth.controller.js';

const router = express.Router();

// Public Route (Website ke liye)
router.get('/active', getActiveBooksOfMonth);

// Admin Routes (Add ProtectedRoute middleware if needed)
router.post('/save', saveBooksOfMonth);
router.get('/history', getAllBooksOfMonthHistory);
router.delete('/delete/:id', deleteBooksOfMonth);

export default router;