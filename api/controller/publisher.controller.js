import Publisher from "../models/Publisher.js";

import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// ==========================================
// 🟢 1. CREATE (SAVE)
// ==========================================
export const savePublisher = async (req, res) => {
  try {
    const {
      category, title, company, address, place,
      email, phone, fax, date, order, show, slug, ship_in_days
    } = req.body;

    // 1. Basic Validation
    if (!title) return res.status(400).json({ status: false, msg: "Title is required." });
    if (!category) return res.status(400).json({ status: false, msg: "Category is required." });

    // 2. Check for Duplicate Slug
    if (slug) {
      const existingSlug = await Publisher.findOne({ slug });
      if (existingSlug) {
        return res.status(400).json({ status: false, msg: "Slug already exists." });
      }
    }

    // 🖼️ Handle Image (Local Storage with Sub-folder)
    let imagePath = '';

    if (req.files && req.files.image) {
      try {
        // 🟢 'publishers' pass kiya taaki uploads/publishers me save ho
        imagePath = await saveFileLocal(req.files.image, 'publishers');
      } catch (uploadError) {
        return res.status(400).json({ status: false, msg: uploadError.message });
      }
    }

    const newPublisher = new Publisher({
      category,
      title,
      image: imagePath, // e.g. "/uploads/publishers/abc-123.jpg"
      company,
      address,
      place,
      email,
      phone,
      fax,
      date: date || null,
      order,
      show,
      slug,
      ship_in_days
    });

    await newPublisher.save();

    res.status(201).json({
      status: true,
      msg: "Publisher added successfully!",
      data: newPublisher
    });

  } catch (error) {
    console.error("Error saving publisher:", error);
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🔵 2. READ ALL (WITH PAGINATION & POPULATION)
// ==========================================
export const getAllPublishers = async (req, res) => {
  try {
    const { page, limit } = req.query;

    // 1. Pagination Settings
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNum - 1) * pageSize;

    // 2. Fetch with Population
    const publishers = await Publisher.find()
      .populate('category', 'categorytitle')
      .sort({ order: 1 })
      .skip(skip)
      .limit(pageSize);

    // 3. Total Count for Pagination
    const total = await Publisher.countDocuments();

    res.status(200).json({
      status: true,
      data: publishers,
      total,
      totalPages: Math.ceil(total / pageSize),
      page: pageNum
    });
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🟡 3. READ ONE
// ==========================================
export const getPublisherById = async (req, res) => {
  try {
    const publisher = await Publisher.findById(req.params.id)
      .populate('category', 'categorytitle');

    if (!publisher) {
      return res.status(404).json({ status: false, msg: "Publisher not found" });
    }
    res.status(200).json({ status: true, data: publisher });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🟠 4. UPDATE (Safe Image Swap)
// ==========================================
export const updatePublisher = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    // 🖼️ Update Image Logic
    if (req.files && req.files.image) {
      try {
        // 1. Pehle current publisher dhundo (purani image paane ke liye)
        const currentPublisher = await Publisher.findById(id);

        // 2. Nayi image save karo ('publishers' folder me)
        const newImagePath = await saveFileLocal(req.files.image, 'publishers');

        // 3. Safe Swap: Agar nayi save ho gayi, tabhi purani delete karo
        if (newImagePath) {
          if (currentPublisher && currentPublisher.image) {
            await deleteFileLocal(currentPublisher.image);
          }
          updateData.image = newImagePath;
        }
      } catch (uploadError) {
        return res.status(400).json({ status: false, msg: uploadError.message });
      }
    }

    const updatedPublisher = await Publisher.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedPublisher) {
      return res.status(404).json({ status: false, msg: "Publisher not found" });
    }

    res.status(200).json({
      status: true,
      msg: "Publisher updated successfully!",
      data: updatedPublisher
    });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Update failed", error: error.message });
  }
};

// ==========================================
// 🔴 5. DELETE (With File Cleanup)
// ==========================================
export const deletePublisher = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Pehle record find karo
    const publisherToDelete = await Publisher.findById(id);

    if (!publisherToDelete) {
      return res.status(404).json({ status: false, msg: "Publisher not found" });
    }

    // 2. Local File Delete karo
    if (publisherToDelete.image) {
      await deleteFileLocal(publisherToDelete.image);
    }

    // 3. Database se record udao
    await Publisher.deleteOne({ _id: id });

    res.status(200).json({ status: true, msg: "Publisher deleted successfully!" });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Delete failed", error: error.message });
  }
};