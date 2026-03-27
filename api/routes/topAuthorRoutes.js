import express from 'express';
import * as TopAuthorController from '../controller/topAuthorController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// PUBLIC — top authors displayed on homepage
router.get('/list', TopAuthorController.listTopAuthors);

// ADMIN — management
router.get('/search-inventory', adminAuth, TopAuthorController.searchInventory);
router.get('/get/:id',          adminAuth, TopAuthorController.getTopAuthor);
router.post('/save',            adminAuth, TopAuthorController.saveTopAuthor);
router.patch('/update/:id',     adminAuth, TopAuthorController.updateTopAuthor);
router.delete('/delete/:id',    adminAuth, TopAuthorController.deleteTopAuthor);

export default router;
