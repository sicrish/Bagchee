import HelpPage from "../models/HelpPage.js";

// ==========================================
// 🟢 1. CREATE (SAVE HELP PAGE)
// ==========================================
export const saveHelpPage = async (req, res) => {
  try {
    const { title, content, meta_title, meta_description, meta_keywords, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ status: false, msg: "Title and Content are required." });
    }

    // 🟢 Generate Clean Slug
    const cleanTitle = title.trim();
    const slug = cleanTitle.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    // Check for duplicate slug
    const existingPage = await HelpPage.findOne({ slug });
    if (existingPage) {
      return res.status(400).json({ status: false, msg: "A page with this title already exists." });
    }

    const newPage = new HelpPage({
      title: cleanTitle,
      content,
      meta_title: meta_title || cleanTitle,
      meta_description,
      meta_keywords,
      slug,
      status: status || 'active'
    });

    await newPage.save();

    res.status(201).json({ 
      status: true, 
      msg: "Help page added successfully!", 
      data: newPage 
    });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🔵 2. READ ALL HELP PAGES
// ==========================================
export const getAllHelpPages = async (req, res) => {
  try {
    const pages = await HelpPage.find().sort({ createdAt: -1 });
    res.status(200).json({ status: true, data: pages });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🟡 3. READ ONE HELP PAGE
// ==========================================
export const getHelpPageById = async (req, res) => {
  try {
    const page = await HelpPage.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ status: false, msg: "Page not found" });
    }
    res.status(200).json({ status: true, data: page });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🟠 4. UPDATE HELP PAGE (Safe Logic)
// ==========================================
export const updateHelpPage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, meta_title, meta_description, meta_keywords, status } = req.body;

    const existingPage = await HelpPage.findById(id);
    if (!existingPage) {
      return res.status(404).json({ status: false, msg: "Page not found" });
    }

    let updateData = { 
      content, meta_title, meta_description, meta_keywords, status 
    };

    // 🟢 SEO Friendly Title/Slug Update
    if (title && title.trim() !== existingPage.title) {
        const cleanTitle = title.trim();
        const newSlug = cleanTitle.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        // Check if new slug is taken by ANOTHER page
        const duplicate = await HelpPage.findOne({ slug: newSlug, _id: { $ne: id } });
        if (duplicate) {
            return res.status(400).json({ status: false, msg: "Another page already has this title." });
        }

        updateData.title = cleanTitle;
        updateData.slug = newSlug;
    }

    const updatedPage = await HelpPage.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
      status: true, 
      msg: "Help page updated successfully!", 
      data: updatedPage 
    });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Update failed", error: error.message });
  }
};

// ==========================================
// 🔴 5. DELETE HELP PAGE
// ==========================================
export const deleteHelpPage = async (req, res) => {
  try {
    const deletedPage = await HelpPage.findByIdAndDelete(req.params.id);

    if (!deletedPage) {
      return res.status(404).json({ status: false, msg: "Page not found" });
    }

    res.status(200).json({ status: true, msg: "Help page deleted successfully!" });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Delete failed", error: error.message });
  }
};