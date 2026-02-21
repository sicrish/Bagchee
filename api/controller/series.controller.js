import Series from "../models/Series.js";

// 🟢 Create (Save Series)
export const saveSeries = async (req, res) => {
  try {
    const { title } = req.body;

    // 1. Validation & Trim
    if (!title || title.trim() === "") {
      return res.status(400).json({ status: false, msg: "Title is required" });
    }

    const cleanTitle = title.trim();

    // 2. Duplicate Check (Case Insensitive)
    // "Dark" aur "dark" same maane jayenge
    const existingSeries = await Series.findOne({ 
        title: { $regex: new RegExp(`^${cleanTitle}$`, "i") } 
    });

    if (existingSeries) {
      return res.status(400).json({ status: false, msg: "Series with this title already exists" });
    }

    const newSeries = new Series({
      title: cleanTitle
    });

    await newSeries.save();

    res.status(201).json({ status: true, msg: "Series added successfully!", data: newSeries });

  } catch (error) {
    console.error("Save Error:", error);
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// 🔵 Read All
export const getAllSeries = async (req, res) => {
  try {
    const seriesList = await Series.find().sort({ updatedAt: -1 });
    res.status(200).json({ status: true, data: seriesList });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// 🟡 Read One
export const getSeriesById = async (req, res) => {
  try {
    const series = await Series.findById(req.params.id);
    if (!series) {
      return res.status(404).json({ status: false, msg: "Series not found" });
    }
    res.status(200).json({ status: true, data: series });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// 🟠 Update (With Duplicate Check)
export const updateSeries = async (req, res) => {
  try {
    const { title } = req.body;
    const { id } = req.params;

    // 1. Check if empty
    if (!title || title.trim() === "") {
        return res.status(400).json({ status: false, msg: "Title cannot be empty" });
    }

    const cleanTitle = title.trim();

    // 2. Duplicate Check (Smart)
    // Check karo: "Kya ye title kisi AUR series ka hai?" (Current ID ko chhodkar)
    const existingSeries = await Series.findOne({ 
        title: { $regex: new RegExp(`^${cleanTitle}$`, "i") },
        _id: { $ne: id } // Exclude current series
    });

    if (existingSeries) {
        return res.status(400).json({ status: false, msg: "Series title already exists." });
    }

    const updatedSeries = await Series.findByIdAndUpdate(
      id,
      { title: cleanTitle }, 
      { new: true, runValidators: true }
    );

    if (!updatedSeries) {
      return res.status(404).json({ status: false, msg: "Series not found" });
    }

    res.status(200).json({ status: true, msg: "Series updated successfully!", data: updatedSeries });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Update failed", error: error.message });
  }
};

// 🔴 Delete
export const deleteSeries = async (req, res) => {
  try {
    const deletedSeries = await Series.findByIdAndDelete(req.params.id);
    if (!deletedSeries) {
      return res.status(404).json({ status: false, msg: "Series not found" });
    }
    res.status(200).json({ status: true, msg: "Series deleted successfully!" });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Delete failed", error: error.message });
  }
};