import Format from "../models/Format.js";

// ==========================================
// 🟢 1. CREATE (SAVE FORMAT)
// ==========================================
export const saveFormat = async (req, res) => {
  try {
    const { title, active, category_id, order } = req.body;

    // Validation & Trim
    if (!title || title.trim() === "") {
      return res.status(400).json({ status: false, msg: "Title is required." });
    }

    const cleanTitle = title.trim();

    // Check for Duplicate Title (Case Insensitive)
    const existingFormat = await Format.findOne({
      title: { $regex: new RegExp(`^${cleanTitle}$`, "i") }
    });

    if (existingFormat) {
      return res.status(400).json({ status: false, msg: "Format title already exists." });
    }

    const newFormat = new Format({
      title: cleanTitle,
      active: active || 'inactive',
      category: category_id, // Mapping Frontend 'category_id' to Backend 'category'
      order: Number(order) || 0
    });

    await newFormat.save();

    res.status(201).json({
      status: true,
      msg: "Format added successfully!",
      data: newFormat
    });

  } catch (error) {
    console.error("Error saving format:", error);
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🔵 2. READ ALL (WITH PAGINATION & POPULATION)
// ==========================================
export const getAllFormats = async (req, res) => {
  try {
    const { page, limit } = req.query;

    // 1. Pagination Settings
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNum - 1) * pageSize;

    // 2. Fetch with Population
    const formats = await Format.find()
      .populate('category', 'categorytitle')
      .sort({ order: 1 })
      .skip(skip)
      .limit(pageSize);

    // 3. Total Count for Pagination
    const total = await Format.countDocuments();

    // 4. Map data for Frontend
    const formattedData = formats.map(item => ({
      ...item._doc,
      category_name: item.category && item.category.categorytitle
        ? item.category.categorytitle
        : 'N/A'
    }));

    res.status(200).json({
      status: true,
      data: formattedData,
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
export const getFormatById = async (req, res) => {
  try {
    const format = await Format.findById(req.params.id);
    if (!format) {
      return res.status(404).json({ status: false, msg: "Format not found" });
    }
    res.status(200).json({ status: true, data: format });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🟠 4. UPDATE (SAFE LOGIC)
// ==========================================
export const updateFormat = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, active, category_id, order } = req.body;

    // 1. Duplicate Check for New Title
    if (title) {
      const cleanTitle = title.trim();
      const existingFormat = await Format.findOne({
        title: { $regex: new RegExp(`^${cleanTitle}$`, "i") },
        _id: { $ne: id }
      });

      if (existingFormat) {
        return res.status(400).json({ status: false, msg: "Another format already has this title." });
      }
    }

    // 2. Map fields correctly
    const updateData = {
      ...req.body,
      category: category_id // Frontend se category_id aaye toh category field update ho
    };

    const updatedFormat = await Format.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedFormat) {
      return res.status(404).json({ status: false, msg: "Format not found" });
    }

    res.status(200).json({
      status: true,
      msg: "Format updated successfully!",
      data: updatedFormat
    });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Update failed", error: error.message });
  }
};

// ==========================================
// 🔴 5. DELETE
// ==========================================
export const deleteFormat = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFormat = await Format.findByIdAndDelete(id);

    if (!deletedFormat) {
      return res.status(404).json({ status: false, msg: "Format not found" });
    }

    res.status(200).json({ status: true, msg: "Format deleted successfully!" });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Delete failed", error: error.message });
  }
};