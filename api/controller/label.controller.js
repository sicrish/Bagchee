import Label from "../models/Label.js";

// ==========================================
// 🟢 1. CREATE (SAVE LABEL)
// ==========================================
export const saveLabel = async (req, res) => {
  try {
    const { title, status, order } = req.body;

    // 1. Validation & Trim
    if (!title || title.trim() === "") {
      return res.status(400).json({ status: false, msg: "Title is required" });
    }

    const cleanTitle = title.trim();

    // 2. Check for Duplicate (Case Insensitive)
    // "New" aur "new" को एक ही माना जाएगा
    const existingLabel = await Label.findOne({ 
        title: { $regex: new RegExp(`^${cleanTitle}$`, "i") } 
    });

    if (existingLabel) {
      return res.status(400).json({ status: false, msg: "Label with this title already exists" });
    }

    const newLabel = new Label({
      title: cleanTitle,
      status: status || 'active',
      order: Number(order) || 0 // Numeric safety
    });

    await newLabel.save();

    res.status(201).json({ 
      status: true, 
      msg: "Label added successfully!", 
      data: newLabel 
    });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🔵 2. READ ALL LABELS
// ==========================================
export const getAllLabels = async (req, res) => {
  try {
    // Sort by 'order' (ascending)
    const labels = await Label.find().sort({ order: 1 });
    res.status(200).json({ status: true, data: labels });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🟡 3. READ ONE LABEL
// ==========================================
export const getLabelById = async (req, res) => {
  try {
    const label = await Label.findById(req.params.id);
    if (!label) {
      return res.status(404).json({ status: false, msg: "Label not found" });
    }
    res.status(200).json({ status: true, data: label });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🟠 4. UPDATE LABEL (Safe Logic)
// ==========================================
export const updateLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, status, order } = req.body;

    // 1. Validation
    if (!title || title.trim() === "") {
        return res.status(400).json({ status: false, msg: "Title is required" });
    }

    const cleanTitle = title.trim();

    // 2. DUPLICATE CHECK (Smart)
    // Check: क्या यह नया नाम किसी और लेबल का है? (Current ID को छोड़कर)
    const existingLabel = await Label.findOne({ 
        title: { $regex: new RegExp(`^${cleanTitle}$`, "i") },
        _id: { $ne: id } // Exclude current ID
    });

    if (existingLabel) {
        return res.status(400).json({ status: false, msg: "Label title already exists." });
    }

    const updatedLabel = await Label.findByIdAndUpdate(
      id,
      { title: cleanTitle, status, order: Number(order) || 0 },
      { new: true, runValidators: true }
    );

    if (!updatedLabel) {
      return res.status(404).json({ status: false, msg: "Label not found" });
    }

    res.status(200).json({ 
      status: true, 
      msg: "Label updated successfully!", 
      data: updatedLabel 
    });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Update failed", error: error.message });
  }
};

// ==========================================
// 🔴 5. DELETE LABEL
// ==========================================
export const deleteLabel = async (req, res) => {
  try {
    const deletedLabel = await Label.findByIdAndDelete(req.params.id);

    if (!deletedLabel) {
      return res.status(404).json({ status: false, msg: "Label not found" });
    }

    res.status(200).json({ status: true, msg: "Label deleted successfully!" });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Delete failed", error: error.message });
  }
};