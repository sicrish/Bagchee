import BannerSchemaModel from '../models/banner.model.js';

import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// ==========================================
// 🟢 1. SAVE BANNER (Handling 2 Images)
// ==========================================
export const save = async (req, res) => {
    try {
        // Step A: Check images
        if (!req.files || !req.files.bgImage || !req.files.overlayImage) {
            return res.status(400).json({ status: false, msg: "Both Background and Overlay images are required" });
        }

        let bgPath = "";
        let overlayPath = "";

        try {
            // Step B: Use Utility for saving (Saving to 'banners' sub-folder)
            bgPath = await saveFileLocal(req.files.bgImage, 'banners');
            overlayPath = await saveFileLocal(req.files.overlayImage, 'banners');
        } catch (uploadError) {
            // Cleanup: Agar koi ek bhi fail hui to uploadError handle hoga
            if (bgPath) await deleteFileLocal(bgPath);
            return res.status(400).json({ status: false, msg: uploadError.message });
        }

        // Step C: Database Object Prepare
        const bannerDetails = { 
            title: req.body.title,
            description: req.body.description,
            buttonText: req.body.buttonText,
            accentColor: req.body.accentColor, 
            bgImageName: bgPath,      // Full path save hoga: /uploads/banners/bg-...
            overlayImageName: overlayPath,
            status: req.body.status || 'active'
        };

        const banner = await BannerSchemaModel.create(bannerDetails);

        res.status(201).json({ 
            status: true, 
            msg: "Banner added successfully", 
            data: banner 
        });

    } catch (error) {
        console.error("Banner Save Error:", error);
        res.status(500).json({ status: false, msg: "Server Error" });
    }
};

// ==========================================
// 🔵 2. FETCH BANNERS
// ==========================================
export const fetch = async (req, res) => {
    try {
        // Sort by latest banner first
        const banners = await BannerSchemaModel.find({ status: "active" }).sort({ createdAt: -1 });
        
        if (banners.length > 0) {
            res.status(200).json({ status: true, data: banners });
        } else {
            res.status(404).json({ status: false, msg: "No active banners found" });
        }
    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error" });
    }
};

// ==========================================
// 🔴 3. DELETE BANNER
// ==========================================
export const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params; // ID use karna hamesha safe rehta hai
        const banner = await BannerSchemaModel.findById(id);

        if (!banner) {
            return res.status(404).json({ status: false, msg: "Banner not found" });
        }

        // 🟢 Step A: Local Files Cleanup
        if (banner.bgImageName) await deleteFileLocal(banner.bgImageName);
        if (banner.overlayImageName) await deleteFileLocal(banner.overlayImageName);

        // Step B: DB record delete
        await BannerSchemaModel.findByIdAndDelete(id);

        res.status(200).json({ status: true, msg: "Banner and associated files deleted successfully" });

    } catch (error) {
        console.error("Banner Delete Error:", error);
        res.status(500).json({ status: false, msg: "Server Error" });
    }
};