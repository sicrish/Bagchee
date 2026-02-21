import HomeSection from '../models/HomeSection.js';
import HomeSectionProduct from '../models/HomeSectionProduct.js';

// ✅ HELPER FUNCTION: To fetch data dynamically by Section Name
// Isse hume bar-bar code repeat nahi karna padega
const fetchSectionDataByName = async (sectionName, res) => {
    try {
        // console.log(`➡️ Searching for: "${sectionName}"`);

        // 1. Find Section by Name (Case Insensitive: "Section 1" or "section 1")
        const sectionInfo = await HomeSection.findOne({ 
            section: { $regex: new RegExp(`^${sectionName}$`, "i") } 
        });

        if (!sectionInfo) {
            console.log(`❌ ${sectionName} not found in DB`);
            return res.status(404).json({ status: false, msg: `${sectionName} not found` });
        }

        // console.log(`✅ Found ID: ${sectionInfo._id}`);

        // 2. Fetch Products using the found ID
        const data = await HomeSectionProduct.find({ home_section_id: sectionInfo._id })
            .populate('productId')
            .sort({ order: 1 });

        // 3. Send Response
        res.json({
            status: true,
            sectionTitle: sectionInfo.title,
            sectionTagline: sectionInfo.tagline,
            data: data
        });

    } catch (error) {
        console.error(`❌ Error fetching ${sectionName}:`, error);
        res.status(500).json({ status: false, msg: `Failed to fetch ${sectionName}` });
    }
};

// =========================================================
// 🟢 SECTION HANDLERS (No Hardcoded IDs anymore!)
// =========================================================

// 🟢 Section 1
export const getSectionOneProducts = async (req, res) => {
    // Database me "section 1" dhundega, ID chahe jo bhi ho
    await fetchSectionDataByName("section 1", res);
};

// 🟢 Section 2
export const getSectionTwoProducts = async (req, res) => {
    await fetchSectionDataByName("section 2", res);
};

// 🟢 Section 3 (New & Notable)
export const getSectionThreeProducts = async (req, res) => {
    await fetchSectionDataByName("section 3", res);
};

// 🟢 Section 4
export const getSectionFourProducts = async (req, res) => {
    await fetchSectionDataByName("section 4", res);
};

// =========================================================
// 🟢 CRUD OPERATIONS (Same as before)
// =========================================================

// 🟢 SAVE NEW LINK
export const saveProductToSection = async (req, res) => {
    try {
        const { home_section_id, productId, title, active, order } = req.body;
        
        console.log("Payload received:", req.body);

        if (!home_section_id || home_section_id === "") {
            return res.status(400).json({ status: false, msg: "Section ID is required" });
        }

        // Check Duplicates
        const exists = await HomeSectionProduct.findOne({ home_section_id, productId });
        if (exists) return res.status(400).json({ status: false, msg: "This product is already in this section!" });

        const newEntry = new HomeSectionProduct({ home_section_id, productId, title, active, order });
        await newEntry.save();
        
        res.json({ status: true, msg: "Product linked successfully" });
    } catch (error) {
        console.error("CRITICAL BACKEND ERROR:", error.message);
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 GET SINGLE LINK (For Edit)
export const getSectionProductById = async (req, res) => {
    try {
        const data = await HomeSectionProduct.findById(req.params.id);
        if (!data) return res.status(404).json({ status: false, msg: "Record not found" });
        res.json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Database error" });
    }
};

// 🟢 UPDATE LINK
export const updateSectionProduct = async (req, res) => {
    try {
        await HomeSectionProduct.findByIdAndUpdate(req.params.id, req.body);
        res.json({ status: true, msg: "Link updated successfully" });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Update failed" });
    }
};

// 🟢 DELETE LINK
export const deleteSectionProduct = async (req, res) => {
    try {
        await HomeSectionProduct.findByIdAndDelete(req.params.id);
        res.json({ status: true, msg: "Product removed from section" });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Delete failed" });
    }
};