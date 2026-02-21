import express from 'express';
import * as TopAuthorController from '../controller/topAuthorController.js';

const router = express.Router();

// --- Define Routes ---

// 🟢 1. Create (Save)
router.post('/save', TopAuthorController.saveTopAuthor);

// 🟢 2. Read All (Frontend Website + Admin List)
router.get('/list', TopAuthorController.listTopAuthors);

// 🟢 3. Search Books (Admin Search Dropdown ke liye)
// Iska use AddEditTopAuthor form mein book select karne ke liye hoga
router.get('/search-inventory', TopAuthorController.searchInventory);

// 🟢 4. Read One (Edit Mode mein data load karne ke liye)
router.get('/get/:id', TopAuthorController.getTopAuthor);

// 🟢 5. Update (Edit form save karne ke liye)
router.patch('/update/:id', TopAuthorController.updateTopAuthor);

// 🟢 6. Delete
router.delete('/delete/:id', TopAuthorController.deleteTopAuthor);

export default router;