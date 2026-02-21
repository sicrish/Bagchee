import Service from '../models/Service.js';

// 🟢 1. Save New Service
export const saveService = async (req, res) => {
    try {
        const newService = new Service(req.body);
        await newService.save();
        res.status(201).json({ status: true, msg: "Service added successfully! ✨" });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 2. List All Services (For Table View)
export const listServices = async (req, res) => {
    try {
        const data = await Service.find().sort({ createdAt: -1 });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 3. Get Single Service (For Edit Page)
export const getService = async (req, res) => {
    try {
        const data = await Service.findById(req.params.id);
        if (!data) return res.status(404).json({ status: false, msg: "Service not found" });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 4. Update Service
export const updateService = async (req, res) => {
    try {
        const updated = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ status: true, msg: "Service updated successfully!", data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 5. Delete Service
export const deleteService = async (req, res) => {
    try {
        await Service.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: true, msg: "Service deleted successfully!" });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};