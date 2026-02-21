import Social from '../models/Social.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js'; 

// ==========================================
// 🟢 1. SAVE SOCIAL (Create)
// ==========================================
export const saveSocial = async (req, res) => {
    try {
        const { 
            title, link, order, 
            isActive, isShareActive, showInFooter, showInProduct, showInCategory 
        } = req.body;

        // 1. Image Check
        if (!req.files || !req.files.icon_image) {
            return res.status(400).json({ status: false, msg: "Icon image is required!" });
        }

        // 2. Save Image
        const iconPath = await saveFileLocal(req.files.icon_image, 'socials');

        // 3. Save Data
        const newSocial = new Social({
            title,
            link,
            icon_image: iconPath,
            order: Number(order) || 0,
            // Boolean Conversion (FormData sends strings)
            isActive: isActive === 'true',
            isShareActive: isShareActive === 'true',
            showInFooter: showInFooter === 'true',
            showInProduct: showInProduct === 'true',
            showInCategory: showInCategory === 'true'
        });

        await newSocial.save();
        res.status(201).json({ status: true, msg: "Social media added successfully! 🚀" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, msg: error.message || "Server Error" });
    }
};

// ==========================================
// 🔵 2. LIST ALL SOCIALS (Read All)
// ==========================================
export const listSocials = async (req, res) => {
    try {
        // Sort by Order (Ascending: 1, 2, 3...)
        const data = await Social.find().sort({ order: 1, createdAt: -1 });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// ==========================================
// 🟡 3. GET SINGLE SOCIAL (Read One - For Edit)
// ==========================================
export const getSocialById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await Social.findById(id);
        
        if (!data) {
            return res.status(404).json({ status: false, msg: "Social media not found" });
        }
        
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// ==========================================
// 🟠 4. UPDATE SOCIAL (Update)
// ==========================================
export const updateSocial = async (req, res) => {
    try {
        const { id } = req.params;
        const social = await Social.findById(id);
        if (!social) return res.status(404).json({ msg: "Not found" });

        let updateData = { ...req.body };

        // Boolean Conversions
        if (req.body.isActive) updateData.isActive = req.body.isActive === 'true';
        if (req.body.isShareActive) updateData.isShareActive = req.body.isShareActive === 'true';
        if (req.body.showInFooter) updateData.showInFooter = req.body.showInFooter === 'true';
        if (req.body.showInProduct) updateData.showInProduct = req.body.showInProduct === 'true';
        if (req.body.showInCategory) updateData.showInCategory = req.body.showInCategory === 'true';

        // Image Update Logic
        if (req.files && req.files.icon_image) {
            // Purani image delete karo (Clean server)
            if (social.icon_image) {
                await deleteFileLocal(social.icon_image);
            }
            // Nayi image save karo
            updateData.icon_image = await saveFileLocal(req.files.icon_image, 'socials');
        }

        await Social.findByIdAndUpdate(id, updateData, { new: true });
        res.status(200).json({ status: true, msg: "Social updated successfully!" });

    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// ==========================================
// 🔴 5. DELETE SOCIAL (Delete)
// ==========================================
export const deleteSocial = async (req, res) => {
    try {
        const { id } = req.params;
        const social = await Social.findById(id);
        
        if (!social) {
            return res.status(404).json({ status: false, msg: "Social media not found" });
        }

        // 1. Delete Image from Server
        if (social.icon_image) {
            await deleteFileLocal(social.icon_image);
        }

        // 2. Delete Record from DB
        await Social.findByIdAndDelete(id);

        res.status(200).json({ status: true, msg: "Social deleted successfully!" });

    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};