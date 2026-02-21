import express from 'express';
import { 
    saveSocial, 
    listSocials, 
    getSocialById, 
    updateSocial, 
    deleteSocial 
} from '../controller/socialController.js';


const router = express.Router();

router.post('/save',  saveSocial);
router.get('/list', listSocials);
router.get('/get/:id', getSocialById);
router.put('/update/:id', updateSocial);
router.delete('/delete/:id', deleteSocial);

export default router;