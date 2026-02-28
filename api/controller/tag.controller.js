import Tag from "../models/Tag.js";

// 🟢 Create (Save Tag)
export const saveTag = async (req, res) => {
  try {
    const { title } = req.body;

    // 1. Validation & Trim
    if (!title || title.trim() === "") {
      return res.status(400).json({ status: false, msg: "Tag Title is required." });
    }

    const cleanTitle = title.trim(); // "  Horror  " -> "Horror"

    // 2. Check for Duplicate (Case Insensitive Check)
    // Regex ka use kiya taaki 'Action' aur 'action' same maane jayein
    const existingTag = await Tag.findOne({ title: { $regex: new RegExp(`^${cleanTitle}$`, "i") } });
    
    if (existingTag) {
      return res.status(400).json({ status: false, msg: "Tag already exists." });
    }

    const newTag = new Tag({ title: cleanTitle });
    await newTag.save();

    res.status(201).json({ 
      status: true, 
      msg: "Tag added successfully!", 
      data: newTag 
    });

  } catch (error) {
    console.error("Error saving tag:", error);
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🔵 READ ALL (FETCH LIST WITH PAGINATION)
// ==========================================
export const getAllTags = async (req, res) => {
  try {
    const { page, limit } = req.query;

    // 1. Pagination Settings
    const pageNum = parseInt(page) || 1;       // Default page 1
    const pageSize = parseInt(limit) || 25;    // Default 25 tags per page
    const skip = (pageNum - 1) * pageSize;     // Kitne tags chhodne hain uska calculation

    // 2. Fetch Data from Database
    const tags = await Tag.find()
      .sort({ createdAt: -1 })
      .skip(skip)   // Pagination logic here
      .limit(pageSize);

    // 3. Total count for frontend buttons
    const total = await Tag.countDocuments();

    res.status(200).json({ 
      status: true, 
      data: tags,
      total,                         // Total tags in database
      page: pageNum,                 // Current page number
      limit: pageSize,               // Per page limit
      totalPages: Math.ceil(total / pageSize) // Total pages available
    });

  } catch (error) {
    console.error("Fetch Tags Error:", error);
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// 🟡 Read One (Get by ID)
export const getTagById = async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ status: false, msg: "Tag not found" });
    }
    res.status(200).json({ status: true, data: tag });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// 🟠 Update (Edit Tag)
export const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === "") {
        return res.status(400).json({ status: false, msg: "Tag Title cannot be empty." });
    }
    
    const cleanTitle = title.trim();

    // Check if new title already exists (excluding current tag)
    // Yahan bhi Case Insensitive check lagaya hai
    const existingTag = await Tag.findOne({ 
        title: { $regex: new RegExp(`^${cleanTitle}$`, "i") }, 
        _id: { $ne: id } 
    });

    if (existingTag) {
      return res.status(400).json({ status: false, msg: "Tag with this name already exists." });
    }
    
    const updatedTag = await Tag.findByIdAndUpdate(
      id,
      { title: cleanTitle },
      { new: true }
    );

    if (!updatedTag) {
      return res.status(404).json({ status: false, msg: "Tag not found" });
    }

    res.status(200).json({ 
      status: true, 
      msg: "Tag updated successfully!", 
      data: updatedTag 
    });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Update failed", error: error.message });
  }
};

// 🔴 Delete (Remove Tag)
export const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTag = await Tag.findByIdAndDelete(id);

    if (!deletedTag) {
      return res.status(404).json({ status: false, msg: "Tag not found" });
    }

    res.status(200).json({ status: true, msg: "Tag deleted successfully!" });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Delete failed", error: error.message });
  }
};