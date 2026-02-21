import OrderStatusModel from '../models/OrderStatus.model.js';

// ==========================================
// 🟢 1. CREATE (SAVE)
// ==========================================
export const createOrderStatus = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;

        // 1. Validation & Trim
        if (!name || name.trim() === "") {
            return res.status(400).json({ status: false, msg: "Status Name is required" });
        }

        const cleanName = name.trim();

        // 2. Check Duplicate (Case Insensitive)
        // "Pending" aur "pending" same maane jayenge
        const existingStatus = await OrderStatusModel.findOne({ 
            name: { $regex: new RegExp(`^${cleanName}$`, "i") } 
        });

        if (existingStatus) {
            return res.status(400).json({ status: false, msg: "Order Status with this name already exists" });
        }

        const newStatus = new OrderStatusModel({
            name: cleanName,
            description: description ? description.trim() : "",
            isActive: isActive !== undefined ? isActive : true
        });

        await newStatus.save();

        res.status(201).json({ 
            status: true, 
            msg: "Order Status added successfully!", 
            data: newStatus 
        });

    } catch (error) {
        console.error("Create Status Error:", error);
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 2. READ (LIST ALL)
// ==========================================
export const getAllOrderStatus = async (req, res) => {
    try {
        // Sort Alphabetically (A-Z) - Dropdown ke liye better rehta hai
        const statuses = await OrderStatusModel.find().sort({ name: 1 });
        
        res.status(200).json({ 
            status: true, 
            msg: "List fetched successfully",
            data: statuses 
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 3. READ ONE (GET BY ID)
// ==========================================
export const getOrderStatusById = async (req, res) => {
    try {
        const id = req.params.id;
        const statusData = await OrderStatusModel.findById(id);

        if (!statusData) {
            return res.status(404).json({ status: false, msg: "Status not found" });
        }

        res.status(200).json({ status: true, data: statusData });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 4. UPDATE (Safe Logic)
// ==========================================
export const updateOrderStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, isActive } = req.body;

        // 1. Validation
        if (!name || name.trim() === "") {
            return res.status(400).json({ status: false, msg: "Status Name is required" });
        }

        const cleanName = name.trim();

        // 🟢 2. DUPLICATE CHECK (Smart)
        // Check karo: "Kya ye naya naam kisi aur Status ka hai?" (Current ID ko chhodkar)
        const existingStatus = await OrderStatusModel.findOne({ 
            name: { $regex: new RegExp(`^${cleanName}$`, "i") },
            _id: { $ne: id } // Exclude current ID
        });

        if (existingStatus) {
            return res.status(400).json({ status: false, msg: "Order Status with this name already exists." });
        }

        // 3. Update
        const updatedStatus = await OrderStatusModel.findByIdAndUpdate(
            id,
            { 
                name: cleanName, 
                description: description ? description.trim() : "", 
                isActive 
            },
            { new: true }
        );

        if (!updatedStatus) {
            return res.status(404).json({ status: false, msg: "Status not found" });
        }

        res.status(200).json({ 
            status: true, 
            msg: "Order Status updated successfully!", 
            data: updatedStatus 
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 5. DELETE
// ==========================================
export const deleteOrderStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const deletedStatus = await OrderStatusModel.findByIdAndDelete(id);

        if (!deletedStatus) {
            return res.status(404).json({ status: false, msg: "Status not found" });
        }

        res.status(200).json({ 
            status: true, 
            msg: "Order Status deleted successfully!" 
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};