import Footer from '../models/Footer.js';

// footerController.js

// 🟢 1. SAVE NEW COLUMN (Naya column add karne ke liye)
export const saveFooter = async (req, res) => {
    try {
        const { name, title, subtitle, content } = req.body;

        // Auto-calculate index (Sabse last wala index + 1)
        const lastItem = await Footer.findOne().sort({ index: -1 });
        const nextIndex = lastItem ? lastItem.index + 1 : 1;

        const newFooter = new Footer({
            name,
            title,
            subtitle,
            content,
            index: nextIndex
        });

        await newFooter.save();
        res.status(201).json({ status: true, msg: "Footer column added successfully! 🚀", data: newFooter });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

// 🔴 2. DELETE COLUMN (Kisi column ko hamesha ke liye delete karne ke liye)
export const deleteFooter = async (req, res) => {
    try {
        const data = await Footer.findByIdAndDelete(req.params.id);
        if (!data) return res.status(404).json({ status: false, msg: "Column not found" });

        res.status(200).json({ status: true, msg: "Footer column deleted successfully! 🗑️" });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

// ... baaki listFooter, getFooterById, updateFooter same rahenge

export const listFooter = async (req, res) => {
    try {
        // Frontend pagination handle karne ke liye
        const data = await Footer.find().sort({ index: 1 });
        const total = await Footer.countDocuments();

        res.status(200).json({ 
            status: true, 
            data: data,
            total: total,
            totalPages: 1 // Footer columns hamesha 4 hi hote hain isliye 1 page kaafi hai
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

// 3. 🟡 GET SINGLE (Edit page par data bharne ke liye)
export const getFooterById = async (req, res) => {
    try {
        const data = await Footer.findById(req.params.id);
        if (!data) return res.status(404).json({ status: false, msg: "Not found" });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

// 4. 🟠 UPDATE (Edit save karne ke liye)
export const updateFooter = async (req, res) => {
    try {
        const data = await Footer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ status: true, msg: "Updated successfully!", data });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};