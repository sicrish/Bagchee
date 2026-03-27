import express from 'express';
import * as SettingsController from '../controller/settingsController.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const router = express.Router();

router.get('/public',        SettingsController.getPublicConfig); // no auth — for frontend
// ADMIN only — settings contain sensitive data (bank details, thresholds)
router.post('/save',         adminAuth, SettingsController.saveSetting);
router.get('/list',          adminAuth, SettingsController.listSettings);
router.get('/get/:id',       adminAuth, SettingsController.getSetting);
router.put('/update/:id',    adminAuth, SettingsController.updateSetting);
router.delete('/delete/:id', adminAuth, SettingsController.deleteSetting);

export default router;
