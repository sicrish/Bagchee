import ProductType from "../models/productType.js";

// 🟢 1. Save New Product Type (Create)
export const saveProductType = async (req, res) => {
  try {
    const { name, image_folder, bagchee_prefix } = req.body;

    // 1. Validation & Trim
    if (!name || !image_folder || !bagchee_prefix) {
      return res.status(400).json({ status: false, msg: "All fields are required." });
    }

    const cleanName = name.trim();

    // 2. Check Duplicate (Case Insensitive)
    // "Book" aur "book" same maane jayenge
    const existingType = await ProductType.findOne({ 
        name: { $regex: new RegExp(`^${cleanName}$`, "i") } 
    });

    if (existingType) {
      return res.status(400).json({ status: false, msg: "This Product Type already exists." });
    }

    // Save
    const newProductType = new ProductType({ 
        name: cleanName, 
        image_folder: image_folder.trim(), 
        bagchee_prefix: bagchee_prefix.trim() 
    });

    await newProductType.save();

    return res.status(201).json({ status: true, msg: "Product Type added successfully!", data: newProductType });

  } catch (error) {
    return res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// 🔵 2. Fetch All Product Types (Read List)
export const getAllProductTypes = async (req, res) => {
  try {
    // Sort Alphabetically (A-Z) - Dropdown ke liye best rehta hai
    const types = await ProductType.find().sort({ name: 1 });
    res.status(200).json({ status: true, data: types });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// 🟡 3. Fetch Single Product Type by ID
export const getProductTypeById = async (req, res) => {
  try {
    const type = await ProductType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({ status: false, msg: "Product Type not found" });
    }
    res.status(200).json({ status: true, data: type });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// 🟠 4. Update Product Type (Safe Logic)
export const updateProductType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image_folder, bagchee_prefix } = req.body;

    // Validation
    if (!name || !image_folder || !bagchee_prefix) {
        return res.status(400).json({ status: false, msg: "All fields are required." });
    }

    const cleanName = name.trim();

    // 🟢 DUPLICATE CHECK (Smart)
    // Check karo: "Kya ye naya naam kisi aur Product Type ka hai?" (Current ID ko chhodkar)
    const existingType = await ProductType.findOne({ 
        name: { $regex: new RegExp(`^${cleanName}$`, "i") },
        _id: { $ne: id } // Exclude current ID
    });

    if (existingType) {
        return res.status(400).json({ status: false, msg: "Product Type with this name already exists." });
    }

    // Find and Update
    const updatedType = await ProductType.findByIdAndUpdate(
      id,
      { 
          name: cleanName, 
          image_folder: image_folder.trim(), 
          bagchee_prefix: bagchee_prefix.trim() 
      },
      { new: true } 
    );

    if (!updatedType) {
      return res.status(404).json({ status: false, msg: "Product Type not found" });
    }

    res.status(200).json({ status: true, msg: "Product Type updated successfully!", data: updatedType });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Update failed", error: error.message });
  }
};

// 🔴 5. Delete Product Type
export const deleteProductType = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedType = await ProductType.findByIdAndDelete(id);

    if (!deletedType) {
      return res.status(404).json({ status: false, msg: "Product Type not found" });
    }

    res.status(200).json({ status: true, msg: "Product Type deleted successfully!" });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Delete failed", error: error.message });
  }
};