import HomeSliderModel from "../models/HomeSlider.model.js";
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js'; 

// 1. SAVE
export const save = async (req, res) => {
    try {
        const { link, isActive, order } = req.body;

        // Frontend se 'desktopImage' aur 'mobileImage' naam se file aayegi
        const desktopFile = req.files?.desktopImage;
        const mobileFile = req.files?.mobileImage;

        if (!desktopFile || !mobileFile) {
            return res.status(400).json({ status: false, msg: "Both Desktop and Mobile images are required" });
        }

        let desktopPath = "";
        let mobilePath = "";

        try {
            desktopPath = await saveFileLocal(desktopFile, 'homesliders');
            mobilePath = await saveFileLocal(mobileFile, 'homesliders');
        } catch (uploadError) {
            return res.status(400).json({ status: false, msg: uploadError.message });
        }

        const newSlider = await HomeSliderModel.create({
            desktopImage: desktopPath,
            mobileImage: mobilePath,
            link: link || "",
            isActive: isActive === 'true' || isActive === 'yes' || isActive === true,
            order: Number(order) || 0
        });

        res.status(201).json({ status: true, msg: "Slider added successfully 🚀", data: newSlider });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// 2. UPDATE
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { link, isActive, order } = req.body;

        const slider = await HomeSliderModel.findById(id);
        if (!slider) return res.status(404).json({ status: false, msg: "Slider not found" });

        if (link !== undefined) slider.link = link;
        if (isActive !== undefined) slider.isActive = (isActive === 'true' || isActive === 'yes' || isActive === true);
        if (order !== undefined) slider.order = Number(order);

        // Check Desktop Image Update
        if (req.files?.desktopImage) {
            const newDesktopPath = await saveFileLocal(req.files.desktopImage, 'homesliders');
            if (newDesktopPath) {
                if (slider.desktopImage) await deleteFileLocal(slider.desktopImage);
                slider.desktopImage = newDesktopPath;
            }
        }

        // Check Mobile Image Update
        if (req.files?.mobileImage) {
            const newMobilePath = await saveFileLocal(req.files.mobileImage, 'homesliders');
            if (newMobilePath) {
                if (slider.mobileImage) await deleteFileLocal(slider.mobileImage);
                slider.mobileImage = newMobilePath;
            }
        }

        await slider.save();
        res.status(200).json({ status: true, msg: "Slider updated successfully" });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// 3. DELETE (Cleanup both images)
export const remove = async (req, res) => {
    try {
        const slider = await HomeSliderModel.findById(req.params.id);
        if (!slider) return res.status(404).json({ status: false, msg: "Slider not found" });

        if (slider.desktopImage) await deleteFileLocal(slider.desktopImage);
        if (slider.mobileImage) await deleteFileLocal(slider.mobileImage);

        await HomeSliderModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: true, msg: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Error deleting" });
    }
};
// ==========================================
// 🟢 LIST (Fetch All for Admin & Frontend)
// ==========================================
export const list = async (req, res) => {
    try {
        const { page, limit, link, isActive, order } = req.query;

        // Filters setup
        let query = {};
        if (link) query.link = { $regex: link, $options: 'i' };
        
        // isActive filter fix: 
        // Agar value 'yes'/'true' aati hai to true, 'no'/'false' aati hai to false
        if (isActive && isActive !== '') {
            query.isActive = (isActive === 'yes' || isActive === 'true' || isActive === true);
        }
        
        if (order) query.order = Number(order);

        const pageNum = Number(page) || 1;
        const pageSize = limit === 'all' ? 100000 : (Number(limit) || 25);
        const skip = (pageNum - 1) * pageSize;

        // Fetch Data
        const sliders = await HomeSliderModel.find(query)
            .sort({ order: 1, createdAt: -1 }) // Sort by order
            .skip(skip)
            .limit(pageSize);

        const total = await HomeSliderModel.countDocuments(query);

        res.status(200).json({ 
            status: true, 
            data: sliders, 
            total 
        });

    } catch (error) {
        console.error("List Error:", error);
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 GET ONE (For Edit Form)
// ==========================================
export const getOne = async (req, res) => {
    try {
        const slider = await HomeSliderModel.findById(req.params.id);
        if (!slider) return res.status(404).json({ status: false, msg: "Slider not found" });
        res.status(200).json({ status: true, data: slider });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error" });
    }
};