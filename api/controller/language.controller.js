import Language from "../models/Language.js";

// ==========================================
// 🟢 1. CREATE (SAVE)
// ==========================================
export const saveLanguage = async (req, res) => {
  try {
    const { title, order } = req.body;

    // 1. Validation & Trim
    if (!title || title.trim() === "") {
      return res.status(400).json({ status: false, msg: "Title is required." });
    }

    const cleanTitle = title.trim();

    // 2. Check for Duplicate (Case Insensitive)
    // "English" aur "english" same maane jayenge
    const existingLang = await Language.findOne({ 
        title: { $regex: new RegExp(`^${cleanTitle}$`, "i") } 
    });

    if (existingLang) {
      return res.status(400).json({ status: false, msg: "Language already exists." });
    }

    const newLanguage = new Language({
      title: cleanTitle,
      order: Number(order) || 0 // Numeric safety
    });

    await newLanguage.save();

    res.status(201).json({ 
      status: true, 
      msg: "Language added successfully!", 
      data: newLanguage 
    });

  } catch (error) {
    console.error("Error saving language:", error);
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🔵 2. READ ALL (Sorted)
// ==========================================
export const getAllLanguages = async (req, res) => {
  try {
    // Sort by 'order' ascending (0, 1, 2...)
    const languages = await Language.find().sort({ order: 1 });
    res.status(200).json({ status: true, data: languages });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🟡 3. READ ONE
// ==========================================
export const getLanguageById = async (req, res) => {
  try {
    const language = await Language.findById(req.params.id);
    if (!language) {
      return res.status(404).json({ status: false, msg: "Language not found" });
    }
    res.status(200).json({ status: true, data: language });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🟠 4. UPDATE (Safe Logic)
// ==========================================
export const updateLanguage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, order } = req.body;
    
    // 1. Validation
    if (!title || title.trim() === "") {
        return res.status(400).json({ status: false, msg: "Title is required." });
    }

    const cleanTitle = title.trim();

    // 🟢 2. DUPLICATE CHECK (Smart)
    // Check: Kya ye naam kisi AUR language ka hai? (Current ID ko chhodkar)
    const existingLang = await Language.findOne({ 
        title: { $regex: new RegExp(`^${cleanTitle}$`, "i") },
        _id: { $ne: id } // Exclude current ID
    });

    if (existingLang) {
        return res.status(400).json({ status: false, msg: "Language with this name already exists." });
    }

    // 3. Update
    const updatedLanguage = await Language.findByIdAndUpdate(
      id,
      { 
          title: cleanTitle,
          order: Number(order) || 0 
      },
      { new: true }
    );

    if (!updatedLanguage) {
      return res.status(404).json({ status: false, msg: "Language not found" });
    }

    res.status(200).json({ 
      status: true, 
      msg: "Language updated successfully!", 
      data: updatedLanguage 
    });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Update failed", error: error.message });
  }
};

// ==========================================
// 🔴 5. DELETE
// ==========================================
export const deleteLanguage = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLanguage = await Language.findByIdAndDelete(id);

    if (!deletedLanguage) {
      return res.status(404).json({ status: false, msg: "Language not found" });
    }

    res.status(200).json({ status: true, msg: "Language deleted successfully!" });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Delete failed", error: error.message });
  }
};