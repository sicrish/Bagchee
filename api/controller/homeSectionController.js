import HomeSection from '../models/HomeSection.js';

// Get all sections for the list
export const getSections = async (req, res) => {
    try {
        const sections = await HomeSection.find().sort({ section: 1 });
        res.json({ status: true, data: sections });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error" });
    }
};

// Get single section by ID for the edit page
export const getSectionById = async (req, res) => {
    try {
        const section = await HomeSection.findById(req.params.id);
        if (!section) return res.status(404).json({ status: false, msg: "Not Found" });
        res.json({ status: true, data: section });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Invalid ID" });
    }
};

// 🟢 SAVE SECTION
export const saveSection = async (req, res) => {
    try {
        // Tagline ko bhi destructure karein
        const { section, title, tagline } = req.body; 
        
        // Tagline ko database object me dalein
        const newSection = new HomeSection({ section, title, tagline });
        
        await newSection.save();
        res.json({ status: true, msg: "Section added successfully" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ status: false, msg: "Section name already exists" });
        }
        res.status(500).json({ status: false, msg: "Failed to save" });
    }
};

// Update single section
export const updateSection = async (req, res) => {
    try {
        // req.body me ab tagline bhi aayega, to ye apne aap update ho jayega
        await HomeSection.findByIdAndUpdate(req.params.id, req.body);
        res.json({ status: true, msg: "Section updated" });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Update failed" });
    }
};  

// Bulk Update for the "Save All Changes" button
export const bulkUpdateSections = async (req, res) => {
    try {
        const { sections } = req.body;
        const promises = sections.map(item => 
            // Ab title ke saath Tagline bhi update hogi
            HomeSection.findByIdAndUpdate(item._id, { 
                title: item.title,
                tagline: item.tagline 
            })
        );
        await Promise.all(promises);
        res.json({ status: true, msg: "Bulk update successful" });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Bulk update failed" });
    }
};

// Delete section
export const deleteSection = async (req, res) => {
    try {
        await HomeSection.findByIdAndDelete(req.params.id);
        res.json({ status: true, msg: "Section deleted" });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Delete failed" });
    }
};