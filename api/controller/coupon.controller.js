import Coupon from "../models/Coupon.js";

// ==========================================
// 🟢 1. CREATE (SAVE COUPON)
// ==========================================
export const saveCoupon = async (req, res) => {
  try {
    let { code } = req.body;

    // 1. Validation & Formatting
    if (!code || code.trim() === "") {
      return res.status(400).json({ status: false, msg: "Coupon Code is required." });
    }

    // 🟢 CODE STANDARDIZATION: " save50 " -> "SAVE50"
    const cleanCode = code.trim().toUpperCase();

    // 2. Check for Duplicate Code (Case Insensitive)
    const existingCoupon = await Coupon.findOne({ 
        code: { $regex: new RegExp(`^${cleanCode}$`, "i") } 
    });

    if (existingCoupon) {
      return res.status(400).json({ status: false, msg: "Coupon Code already exists." });
    }

    // 3. Save Data (Spread operator handles other fields like discount, type etc.)
    const newCoupon = new Coupon({
        ...req.body,
        code: cleanCode
    });

    await newCoupon.save();

    res.status(201).json({ 
      status: true, 
      msg: "Coupon created successfully!", 
      data: newCoupon 
    });

  } catch (error) {
    console.error("Error saving coupon:", error);
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🔵 2. READ ALL (FETCH LIST WITH PAGINATION)
// ==========================================
export const getAllCoupons = async (req, res) => {
  try {
    const { page, limit } = req.query;

    // 1. Pagination Settings
    const pageNum = parseInt(page) || 1;       // Default page 1
    const pageSize = parseInt(limit) || 25;    // Default 25 records as per your requirement
    const skip = (pageNum - 1) * pageSize;     // Kitne records chhodne hain

    // 2. Database Fetching with Skip and Limit
    const coupons = await Coupon.find()
      .sort({ createdAt: -1 })
      .skip(skip)   // Pagination logic
      .limit(pageSize);

    // 3. Total count for frontend buttons
    const total = await Coupon.countDocuments();

    res.status(200).json({ 
      status: true, 
      data: coupons,
      total,                         // Kul kitne coupons hain
      page: pageNum,                 // Current page number
      limit: pageSize,               // Per page limit
      totalPages: Math.ceil(total / pageSize) // Total kitne pages banenge
    });

  } catch (error) {
    console.error("Fetch Coupons Error:", error);
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🟣 3. FETCH ACTIVE COUPONS (FOR DROPDOWN)
// ==========================================
export const getActiveCoupons = async (req, res) => {
  try {
    // Only active coupons with necessary fields
    const coupons = await Coupon.find({ active: 'active' }).select('code discount');
    res.status(200).json({ status: true, data: coupons });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🟡 4. READ ONE
// ==========================================
export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ status: false, msg: "Coupon not found" });
    }
    res.status(200).json({ status: true, data: coupon });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};


// ==========================================
// 🟠 5. UPDATE (SAFE LOGIC WITH SANITIZATION)
// ==========================================
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    let data = { ...req.body };

    // 1. Code Clean & Duplicate Check
    if (data.code) {
        data.code = data.code.trim().toUpperCase();
        const existingCoupon = await Coupon.findOne({ 
            code: data.code, 
            _id: { $ne: id } 
        });
        if (existingCoupon) {
            return res.status(400).json({ status: false, msg: "This Coupon Code is already in use." });
        }
    }

    // 🟢 2. SANITIZATION (The Fix for Edit Issues)
    // Convert empty strings to null for Dates
    if (data.valid_from === "") data.valid_from = null;
    if (data.valid_to === "") data.valid_to = null;
    
    // Convert empty strings to 0 for Numbers
    if (data.amount === "") data.amount = 0;
    if (data.minimum_buy === "") data.minimum_buy = 0;
    if (data.price_over_only === "") data.price_over_only = 0;

    // Force Category to be an Array as per Schema
    if (data.categories === "") {
        data.categories = [];
    } else if (typeof data.categories === 'string') {
        data.categories = [data.categories]; // Convert single ID string to Array
    }
    
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!updatedCoupon) {
      return res.status(404).json({ status: false, msg: "Coupon not found" });
    }

    res.status(200).json({ 
      status: true, 
      msg: "Coupon updated successfully!", 
      data: updatedCoupon 
    });

  } catch (error) {
    console.error("Update failed:", error);
    res.status(500).json({ status: false, msg: "Update failed", error: error.message });
  }
};

// ==========================================
// 🔴 6. DELETE
// ==========================================
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCoupon = await Coupon.findByIdAndDelete(id);

    if (!deletedCoupon) {
      return res.status(404).json({ status: false, msg: "Coupon not found" });
    }

    res.status(200).json({ status: true, msg: "Coupon deleted successfully!" });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Delete failed", error: error.message });
  }
};