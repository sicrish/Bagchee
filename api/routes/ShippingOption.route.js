import express from 'express';
import * as ShippingOption from '../controller/ShippingOption.controller.js';

const router = express.Router();

router.post('/save', ShippingOption.saveShippingOption);        // Create
router.get('/list', ShippingOption.getAllShippingOptions);      // Read All
router.get('/get/:id', ShippingOption.getShippingOptionById);       // Read One
router.patch('/update/:id', ShippingOption.updateShippingOption); // Update
router.delete('/delete/:id', ShippingOption.deleteShippingOption);// Delete

export default router;