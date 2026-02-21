import express from 'express';
import * as SettingsController from '../controller/settingsController.js';

const router = express.Router();

router.post('/save', SettingsController.saveSetting);
router.get('/list', SettingsController.listSettings);
router.get('/get/:id', SettingsController.getSetting);
router.put('/update/:id', SettingsController.updateSetting);
router.delete('/delete/:id', SettingsController.deleteSetting);

export default router;