import ShippingOptionModel from '../models/ShippingOption.model.js';

// ==========================================
// 🟢 1. CREATE (SAVE)
// ==========================================
export const saveShippingOption = async (req, res) => {
    try {
        const data = req.body;

        if (!data.title) {
            return res.status(400).json({ status: false, msg: "Title is required" });
        }

        // Active Status Check
        let activeStatus = true;
        if (data.active === 'yes') activeStatus = true;
        else if (data.active === 'no') activeStatus = false;
        else if (data.isActive !== undefined) {
             activeStatus = (data.isActive === true || data.isActive === 'true');
        }

        const newOption = new ShippingOptionModel({
            title: data.title,
            maxDayLimit: Number(data.max_day_limit) || 0,
            priceUsd: Number(data.price_usd) || 0,
            priceEur: Number(data.price_eur) || 0,
            priceInr: Number(data.price_inr) || 0,
            
            // 🟢 MAPPING: Frontend 'order' -> DB 'displayOrder'
            displayOrder: Number(data.order) || 0,
            
            isActive: activeStatus
        });

        await newOption.save();

        res.status(201).json({ 
            status: true, 
            msg: "Shipping Option added successfully!", 
            data: newOption 
        });

    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 2. READ (LIST ALL) - WITH MAPPING FIX
// ==========================================
export const getAllShippingOptions = async (req, res) => {
    try {
        // Fetch data from DB
        const list = await ShippingOptionModel.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
        
        // 🟢 SMART MAPPING: Backend se bhejte waqt 'displayOrder' ko wapas 'order' bana do
        // Taaki Frontend bina change kiye chal jaye.
        const formattedList = list.map(item => ({
            ...item,
            order: item.displayOrder // Frontend 'order' dhoond raha hai
        }));
        
        res.status(200).json({ 
            status: true, 
            msg: "Shipping options fetched successfully",
            data: formattedList 
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 3. READ ONE (GET BY ID) - WITH MAPPING FIX
// ==========================================
export const getShippingOptionById = async (req, res) => {
    try {
        const id = req.params.id;
        const option = await ShippingOptionModel.findById(id).lean();

        if (!option) {
            return res.status(404).json({ status: false, msg: "Shipping option not found" });
        }

        // 🟢 MAPPING: Single item ke liye bhi 'order' key add karo
        const formattedOption = {
            ...option,
            order: option.displayOrder
        };

        res.status(200).json({ status: true, data: formattedOption });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 4. UPDATE

export const updateShippingOption = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;

        // 1. Find Existing Data first (Optional validation)
        const existingOption = await ShippingOptionModel.findById(id);
        if (!existingOption) {
            return res.status(404).json({ status: false, msg: "Shipping option not found" });
        }

        // 2. Prepare Update Object dynamically
        const updateData = {};

        // Sirf tabhi update karo jab data bheja gaya ho
        if (data.title) updateData.title = data.title;
        
        // Numeric Fields Check (Undefined check zaroori hai)
        if (data.max_day_limit !== undefined) updateData.maxDayLimit = Number(data.max_day_limit);
        if (data.price_usd !== undefined) updateData.priceUsd = Number(data.price_usd);
        if (data.price_eur !== undefined) updateData.priceEur = Number(data.price_eur);
        if (data.price_inr !== undefined) updateData.priceInr = Number(data.price_inr);
        
        // 🟢 MAPPING FIX (Safe Mode)
        if (data.order !== undefined) {
            updateData.displayOrder = Number(data.order);
        }

        // Active Status Logic
        if (data.active === 'yes') updateData.isActive = true;
        else if (data.active === 'no') updateData.isActive = false;
        else if (data.isActive !== undefined) {
             updateData.isActive = (data.isActive === true || data.isActive === 'true');
        }

        // 3. Update in DB
        const updatedOption = await ShippingOptionModel.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true } // Return updated document
        );

        res.status(200).json({ 
            status: true, 
            msg: "Shipping option updated successfully!", 
            data: updatedOption 
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 5. DELETE
// ==========================================
export const deleteShippingOption = async (req, res) => {
    try {
        const id = req.params.id;
        const deletedOption = await ShippingOptionModel.findByIdAndDelete(id);

        if (!deletedOption) {
            return res.status(404).json({ status: false, msg: "Shipping option not found" });
        }

        res.status(200).json({ 
            status: true, 
            msg: "Shipping option deleted successfully!" 
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};