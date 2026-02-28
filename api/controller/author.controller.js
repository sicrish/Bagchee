import Author from "../models/Author.js";
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// ==========================================
// 🟢 1. CREATE (SAVE AUTHOR)
// ==========================================
export const saveAuthor = async (req, res) => {
  try {
    const { first_name, last_name, origin, profile } = req.body;

    if (!first_name || first_name.trim() === "") {
      return res.status(400).json({ status: false, msg: "First Name is required." });
    }

    let picturePath = "";
    if (req.files && (req.files.picture || req.files.image)) {
      try {
        const file = req.files.picture || req.files.image;
        picturePath = await saveFileLocal(file, 'authors');
      } catch (uploadError) {
        return res.status(400).json({ status: false, msg: uploadError.message });
      }
    }

    const newAuthor = new Author({
      first_name: first_name.trim(),
      last_name: last_name ? last_name.trim() : "",
      picture: picturePath,
      origin,
      profile
    });

    await newAuthor.save();
    res.status(201).json({ status: true, msg: "Author added successfully!", data: newAuthor });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};


// ==========================================
// 🔵 2. READ ALL (WITH PAGINATION & SEARCH)
// ==========================================
export const getAllAuthors = async (req, res) => {
  try {
    const { q, page, limit } = req.query;

    // 1. Pagination Settings
    const pageNum = parseInt(page) || 1;      // Default page 1
    const pageSize = parseInt(limit) || 20;   // Default 20 records per page
    const skip = (pageNum - 1) * pageSize;    // Kitne records chhodne hain

    // 2. Search Query logic
    let query = {};
    if (q) {
      query = {
        $or: [
          { first_name: { $regex: q, $options: 'i' } },
          { last_name: { $regex: q, $options: 'i' } }
        ]
      };
    }

    // 3. Database Fetching with Skip and Limit
    const authors = await Author.find(query)
      .sort({ first_name: 1 })
      .skip(skip)   // Pagination logic here
      .limit(pageSize);

    // 4. Total count for frontend calculation
    const total = await Author.countDocuments(query);

    res.status(200).json({ 
      status: true, 
      data: authors,
      total,                         // Kul kitne authors hain
      page: pageNum,                 // Current page kaun sa hai
      limit: pageSize,               // Ek page par kitni limit hai
      totalPages: Math.ceil(total / pageSize) // Total kitne pages bane
    });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};
// ==========================================
// 🟡 3. READ ONE
// ==========================================
export const getAuthorById = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ status: false, msg: "Author not found" });
    res.status(200).json({ status: true, data: author });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🟠 4. UPDATE
// ==========================================
export const updateAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const existingAuthor = await Author.findById(id);

    if (!existingAuthor) return res.status(404).json({ status: false, msg: "Author not found" });

    let updateData = { ...req.body };

    if (req.files && (req.files.picture || req.files.image)) {
      const file = req.files.picture || req.files.image;
      const newPath = await saveFileLocal(file, 'authors');
      if (newPath) {
        if (existingAuthor.picture) await deleteFileLocal(existingAuthor.picture);
        updateData.picture = newPath;
      }
    }

    const updatedAuthor = await Author.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    res.status(200).json({ status: true, msg: "Author updated successfully!", data: updatedAuthor });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Update failed", error: error.message });
  }
};

// ==========================================
// 🔴 5. DELETE
// ==========================================
export const deleteAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const author = await Author.findById(id);

    if (!author) return res.status(404).json({ status: false, msg: "Author not found" });

    if (author.picture) await deleteFileLocal(author.picture);
    await Author.findByIdAndDelete(id);

    res.status(200).json({ status: true, msg: "Author deleted successfully!" });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Delete failed", error: error.message });
  }
};