import PaymentModel from '../models/Payment.model.js';

import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// ==========================================
// 🟢 1. CREATE (SAVE)
// ==========================================
export const savePayment = async (req, res) => {
    try {
        const data = req.body;

        // Validation
        if (!data.title) {
            return res.status(400).json({ status: false, msg: "Payment Title is required" });
        }

        // 1. Handle "Active" status
        let activeStatus = true;
        if (data.status === 'inactive') activeStatus = false;

        // 2. Handle "Additional Text Active" status
        let additionalActive = false;
        if (data.additional_text_status === 'active') additionalActive = true;

        // 🟢 3. Local Image Upload
        let imagePath = null;

        if (req.files && req.files.image) {
            try {
                // 'payments' folder me save hoga
                imagePath = await saveFileLocal(req.files.image, 'payments');
            } catch (uploadError) {
                return res.status(400).json({ status: false, msg: uploadError.message });
            }
        }

        const newPayment = new PaymentModel({
            title: data.title,
            isActive: activeStatus,
            order: Number(data.order) || 0,
            additional_text: data.additional_text || "",
            additional_text_isActive: additionalActive,
            image: imagePath, // e.g. "/uploads/payments/logo.png"     
            image_public_id: null // Local storage me iski jarurat nahi
        });

        await newPayment.save();

        res.status(201).json({ 
            status: true, 
            msg: "Payment method added successfully!", 
            data: newPayment 
        });

    } catch (error) {
        console.error("Save Payment Error:", error);
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 2. READ (LIST ALL)
// ==========================================
export const getAllPayments = async (req, res) => {
    try {
        const list = await PaymentModel.find().sort({ order: 1, createdAt: -1 });
        
        res.status(200).json({ 
            status: true, 
            msg: "Payments fetched successfully",
            data: list 
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 3. READ ONE (GET BY ID)
// ==========================================
export const getPaymentById = async (req, res) => {
    try {
        const id = req.params.id;
        const payment = await PaymentModel.findById(id);

        if (!payment) {
            return res.status(404).json({ status: false, msg: "Payment method not found" });
        }

        res.status(200).json({ status: true, data: payment });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 4. UPDATE (Safe Local Swap)
// ==========================================
export const updatePayment = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const { remove_image } = req.body; 

        const existingPayment = await PaymentModel.findById(id);
        if (!existingPayment) {
            return res.status(404).json({ status: false, msg: "Payment method not found" });
        }

        // Logic for Boolean Status
        let activeStatus = undefined;
        if (data.status === 'active') activeStatus = true;
        else if (data.status === 'inactive') activeStatus = false;

        let additionalActive = undefined;
        if (data.additional_text_status === 'active') additionalActive = true;
        else if (data.additional_text_status === 'inactive') additionalActive = false;

        const updateData = {
            title: data.title,
            order: Number(data.order) || 0,
            additional_text: data.additional_text,
        };

        if (activeStatus !== undefined) updateData.isActive = activeStatus;
        if (additionalActive !== undefined) updateData.additional_text_isActive = additionalActive;

        // 🟢 IMAGE UPDATE LOGIC
        if (req.files && req.files.image) {
            try {
                // 1. New Save
                const newImagePath = await saveFileLocal(req.files.image, 'payments');
                
                // 2. Old Delete (Safe Swap)
                if (newImagePath) {
                    if (existingPayment.image) {
                        await deleteFileLocal(existingPayment.image);
                    }
                    updateData.image = newImagePath;
                    updateData.image_public_id = null; // Clear old cloud ID if present
                }
            } catch (uploadError) {
                return res.status(400).json({ status: false, msg: uploadError.message });
            }

        } else if (remove_image === 'true') {
            // Delete Old Image (No new upload)
            if (existingPayment.image) {
                await deleteFileLocal(existingPayment.image);
            }
            updateData.image = null;
            updateData.image_public_id = null;
        }

        const updatedPayment = await PaymentModel.findByIdAndUpdate(id, updateData, { new: true });

        res.status(200).json({ 
            status: true, 
            msg: "Payment updated successfully!", 
            data: updatedPayment 
        });

    } catch (error) {
        console.error("Update Payment Error:", error);
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 5. DELETE (With File Cleanup)
// ==========================================
export const deletePayment = async (req, res) => {
    try {
        const id = req.params.id;
        
        const payment = await PaymentModel.findById(id);
        if (!payment) {
            return res.status(404).json({ status: false, msg: "Payment method not found" });
        }

        // 🟢 Delete Local Image
        if (payment.image) {
            await deleteFileLocal(payment.image);
        }

        await PaymentModel.findByIdAndDelete(id);

        res.status(200).json({ 
            status: true, 
            msg: "Payment deleted successfully!" 
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};