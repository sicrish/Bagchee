import SideBannerOne from '../models/SideBannerOne.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js'; // 🟢 Import Utility

// ==========================================
// 🟢 1. SAVE BANNER (With File Handler Utility)
// ==========================================
export const saveBanner = async (req, res) => {
    try {
        const { link1, link2, isActive, order } = req.body;
        
        let image1Path = "";
        let image2Path = "";

        // Step A: Try saving images locally
        try {
            // Hum 'side-banners' folder me save karenge
            if (req.files && req.files.image1) {
                image1Path = await saveFileLocal(req.files.image1, 'side-banners');
            }
            if (req.files && req.files.image2) {
                image2Path = await saveFileLocal(req.files.image2, 'side-banners');
            }
        } catch (uploadError) {
            // Cleanup: Agar ek upload hua aur dusra fail hua, to pehla wala delete karo
            if (image1Path) await deleteFileLocal(image1Path);
            if (image2Path) await deleteFileLocal(image2Path);
            return res.status(400).json({ status: false, msg: "Image upload failed: " + uploadError.message });
        }

        // Step B: Save to Database
        const newBanner = new SideBannerOne({
            image1: image1Path,
            link1,
            image2: image2Path,
            link2,
            isActive: isActive === 'true', // Convert string to boolean
            order
        });

        await newBanner.save();
        res.status(201).json({ status: true, msg: "Side Banner added successfully! 🚀", data: newBanner });

    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ status: false, msg: error.message });
    }
};

// ==========================================
// 🔵 2. LIST BANNERS
// ==========================================
export const listBanners = async (req, res) => {
    try {
        const data = await SideBannerOne.find().sort({ order: 1, createdAt: -1 });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// ==========================================
// 🟡 3. GET SINGLE BANNER
// ==========================================
export const getBanner = async (req, res) => {
    try {
        const data = await SideBannerOne.findById(req.params.id);
        if (!data) return res.status(404).json({ status: false, msg: "Banner not found" });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// ==========================================
// 🟠 4. UPDATE BANNER (Replaces Old Images)
// ==========================================
export const updateBanner = async (req, res) => {
    try {
        const { link1, link2, isActive, order } = req.body;
        const bannerId = req.params.id;

        // Pehle purana data nikalo taaki purani images delete kar sakein
        const oldBanner = await SideBannerOne.findById(bannerId);
        if (!oldBanner) {
            return res.status(404).json({ status: false, msg: "Banner not found" });
        }

        let updateData = {
            link1,
            link2,
            isActive: isActive === 'true',
            order
        };

        // 🟢 Image 1 Update Logic
        if (req.files && req.files.image1) {
            try {
                // Nayi image save karo
                const newPath1 = await saveFileLocal(req.files.image1, 'side-banners');
                updateData.image1 = newPath1;

                // Purani image delete karo (agar exist karti hai)
                if (oldBanner.image1) {
                    await deleteFileLocal(oldBanner.image1);
                }
            } catch (err) {
                return res.status(400).json({ status: false, msg: "Failed to update Image 1" });
            }
        }

        // 🟢 Image 2 Update Logic
        if (req.files && req.files.image2) {
            try {
                // Nayi image save karo
                const newPath2 = await saveFileLocal(req.files.image2, 'side-banners');
                updateData.image2 = newPath2;

                // Purani image delete karo
                if (oldBanner.image2) {
                    await deleteFileLocal(oldBanner.image2);
                }
            } catch (err) {
                return res.status(400).json({ status: false, msg: "Failed to update Image 2" });
            }
        }

        const updatedBanner = await SideBannerOne.findByIdAndUpdate(bannerId, updateData, { new: true });
        res.status(200).json({ status: true, msg: "Banner updated successfully! ✨", data: updatedBanner });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ status: false, msg: error.message });
    }
};

// ==========================================
// 🔴 5. DELETE BANNER (Clean up Files)
// ==========================================
export const deleteBanner = async (req, res) => {
    try {
        const banner = await SideBannerOne.findById(req.params.id);
        if (!banner) return res.status(404).json({ status: false, msg: "Banner not found" });

        // 🟢 Step A: Local Files Cleanup (Delete actual files from folder)
        if (banner.image1) await deleteFileLocal(banner.image1);
        if (banner.image2) await deleteFileLocal(banner.image2);

        // Step B: DB Record Delete
        await SideBannerOne.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: true, msg: "Banner deleted successfully!" });

    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ status: false, msg: error.message });
    }
};