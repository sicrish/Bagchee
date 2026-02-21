import Navigation from "../models/Navigation.js";

// ==========================================
// 🟢 1. CREATE (SAVE)
// ==========================================
export const createNav = async (req, res) => {
  try {
    // Frontend 'name' aur 'status' bhej raha hai
    const { name, link, order, status, dropdown, dropdown_content } = req.body;

    // 1. Validation
    if (!name || name.trim() === "") {
      return res.status(400).json({ status: false, msg: "Navigation Name (Item) is required" });
    }
    if (!link || link.trim() === "") {
      return res.status(400).json({ status: false, msg: "Link URL is required" });
    }

    const cleanName = name.trim();

    // 2. Check Duplicate (Database field 'item' check karein)
    const existingNav = await Navigation.findOne({ 
        item: { $regex: new RegExp(`^${cleanName}$`, "i") } // 🟢 Fix: 'name' -> 'item'
    });

    if (existingNav) {
      return res.status(400).json({ status: false, msg: "Navigation item already exists" });
    }

    // 3. Create Object (Mapping inputs to DB Schema)
    const newNav = new Navigation({
        item: cleanName,            // 🟢 Fix: Map 'name' variable to 'item' schema field
        link: link.trim(),
        order: Number(order) || 0,
        active: status || "active", // 🟢 Fix: Map 'status' variable to 'active' schema field
        dropdown: dropdown || "inactive",
        dropdown_content: dropdown_content || ""
    });

    const savedNav = await newNav.save();
    res.status(201).json({ status: true, msg: "Navigation item added", data: savedNav });

  } catch (error) {
    console.error("Create Nav Error:", error);
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🔵 2. READ ALL (Sorted)
// ==========================================
export const getAllNavs = async (req, res) => {
  try {
    const navs = await Navigation.find().sort({ order: 1 });
    res.status(200).json({ status: true, data: navs });
  } catch (error) {
    res.status(500).json({ status: false, msg: error.message });
  }
};

// ==========================================
// 🟡 3. READ ONE
// ==========================================
export const getNavById = async (req, res) => {
  try {
    const nav = await Navigation.findById(req.params.id);
    if (!nav) return res.status(404).json({ status: false, msg: "Not found" });
    res.status(200).json({ status: true, data: nav });
  } catch (error) {
    res.status(500).json({ status: false, msg: error.message });
  }
};

// ==========================================
// 🟠 4. UPDATE (Safe Logic)
// ==========================================
export const updateNav = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, link, order, status, dropdown, dropdown_content } = req.body;

    // 1. Validation
    if (!name || name.trim() === "") {
        return res.status(400).json({ status: false, msg: "Navigation Name is required" });
    }

    const cleanName = name.trim();

    // 2. Duplicate Check
    const existingNav = await Navigation.findOne({ 
        item: { $regex: new RegExp(`^${cleanName}$`, "i") }, // 🟢 Fix: 'item'
        _id: { $ne: id }
    });

    if (existingNav) {
        return res.status(400).json({ status: false, msg: "Navigation name already exists." });
    }

    // 3. Update
    const updatedNav = await Navigation.findByIdAndUpdate(
      id, 
      { 
          item: cleanName,            // 🟢 Fix: 'name' -> 'item'
          link: link ? link.trim() : undefined,
          order: order !== undefined ? Number(order) : 0,
          active: status,             // 🟢 Fix: 'status' -> 'active'
          dropdown: dropdown || "inactive",
          dropdown_content: dropdown_content
      }, 
      { new: true }
    );

    if (!updatedNav) {
        return res.status(404).json({ status: false, msg: "Navigation not found" });
    }

    res.status(200).json({ status: true, msg: "Updated successfully", data: updatedNav });

  } catch (error) {
    res.status(500).json({ status: false, msg: error.message });
  }
};

// ==========================================
// 🔴 5. DELETE
// ==========================================
export const deleteNav = async (req, res) => {
  try {
    const deletedNav = await Navigation.findByIdAndDelete(req.params.id);
    if (!deletedNav) {
        return res.status(404).json({ status: false, msg: "Navigation not found" });
    }
    res.status(200).json({ status: true, msg: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: false, msg: error.message });
  }
};