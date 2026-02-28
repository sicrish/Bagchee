import CourierModel from '../models/Courier.model.js';

// ==========================================
// 🟢 1. CREATE (SAVE)
// ==========================================
export const saveCourier = async (req, res) => {
    try {
        const { title, trackingPage, isActive, active } = req.body;

        // 1. Validation & Trim
        if (!title || title.trim() === "") {
            return res.status(400).json({ status: false, msg: "Courier Title is required" });
        }
        if (!trackingPage || trackingPage.trim() === "") {
            return res.status(400).json({ status: false, msg: "Tracking Page URL is required" });
        }

        const cleanTitle = title.trim();

        // 🟢 2. DUPLICATE CHECK (Case Insensitive)
        const existingCourier = await CourierModel.findOne({ 
            title: { $regex: new RegExp(`^${cleanTitle}$`, "i") } 
        });

        if (existingCourier) {
            return res.status(400).json({ status: false, msg: "Courier partner already exists" });
        }

        // 3. Handle Active Status Logic
        let activeStatus = true;
        if (isActive !== undefined) activeStatus = (isActive === true || isActive === 'true');
        else if (active !== undefined) activeStatus = (active === 'active');

        const newCourier = new CourierModel({
            title: cleanTitle,
            trackingPage: trackingPage.trim(),
            isActive: activeStatus
        });

        await newCourier.save();

        res.status(201).json({ 
            status: true, 
            msg: "Courier added successfully!", 
            data: newCourier 
        });

    } catch (error) {
        console.error("Save Courier Error:", error);
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🔵 2. READ (LIST ALL WITH PAGINATION)
// ==========================================
export const getAllCouriers = async (req, res) => {
    try {
        const { page, limit } = req.query;

        // 1. Pagination Settings
        const pageNum = parseInt(page) || 1;
        const pageSize = parseInt(limit) || 10;
        const skip = (pageNum - 1) * pageSize;

        // 2. Fetch Data with Pagination
        const couriers = await CourierModel.find()
            .sort({ title: 1 })
            .skip(skip)
            .limit(pageSize);

        // 3. Total Count for Pagination calculation
        const total = await CourierModel.countDocuments();

        res.status(200).json({ 
            status: true, 
            msg: "Couriers fetched successfully",
            data: couriers,
            total,
            totalPages: Math.ceil(total / pageSize),
            page: pageNum
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟡 3. READ ONE
// ==========================================
export const getCourierById = async (req, res) => {
    try {
        const id = req.params.id;
        const courier = await CourierModel.findById(id);

        if (!courier) {
            return res.status(404).json({ status: false, msg: "Courier not found" });
        }

        res.status(200).json({ status: true, data: courier });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟠 4. UPDATE (Safe Logic)
// ==========================================
export const updateCourier = async (req, res) => {
    try {
        const id = req.params.id;
        const { title, trackingPage, isActive, active } = req.body;

        // 1. Duplicate Check for New Title
        if (title) {
            const cleanTitle = title.trim();
            const existingCourier = await CourierModel.findOne({ 
                title: { $regex: new RegExp(`^${cleanTitle}$`, "i") },
                _id: { $ne: id } 
            });

            if (existingCourier) {
                return res.status(400).json({ status: false, msg: "Another courier already has this name." });
            }
        }

        // 2. Determine Active Status
        let activeStatus = undefined;
        if (isActive !== undefined) activeStatus = (isActive === true || isActive === 'true');
        else if (active !== undefined) activeStatus = (active === 'active');

        const updateData = {};
        if (title) updateData.title = title.trim();
        if (trackingPage) updateData.trackingPage = trackingPage.trim();
        if (activeStatus !== undefined) updateData.isActive = activeStatus;

        const updatedCourier = await CourierModel.findByIdAndUpdate(
            id, 
            { $set: updateData }, 
            { new: true }
        );

        if (!updatedCourier) {
            return res.status(404).json({ status: false, msg: "Courier not found" });
        }

        res.status(200).json({ 
            status: true, 
            msg: "Courier updated successfully!", 
            data: updatedCourier 
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🔴 5. DELETE
// ==========================================
export const deleteCourier = async (req, res) => {
    try {
        const id = req.params.id;
        const deletedCourier = await CourierModel.findByIdAndDelete(id);

        if (!deletedCourier) {
            return res.status(404).json({ status: false, msg: "Courier not found" });
        }

        res.status(200).json({ 
            status: true, 
            msg: "Courier deleted successfully!" 
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};