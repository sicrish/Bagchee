import Settings from '../models/Settings.js';

// 🟢 1. Save Setting
export const saveSetting = async (req, res) => {
    try {
        const newSetting = new Settings(req.body);
        await newSetting.save();
        res.status(201).json({ status: true, msg: "Settings saved successfully!" });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 2. List Settings (For Table View)
export const listSettings = async (req, res) => {
    try {
        const data = await Settings.find().sort({ createdAt: -1 });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 3. Get One Setting (For Edit Page)
export const getSetting = async (req, res) => {
    try {
        const data = await Settings.findById(req.params.id);
        if (!data) return res.status(404).json({ status: false, msg: "Not found" });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 4. Update Setting
export const updateSetting = async (req, res) => {
    try {
        const updated = await Settings.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ status: true, msg: "Settings updated!", data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 5. Delete Setting
export const deleteSetting = async (req, res) => {
    try {
        await Settings.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: true, msg: "Deleted!" });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};