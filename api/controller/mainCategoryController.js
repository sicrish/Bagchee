import MainCategory from '../models/MainCategory.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 🟢 1. Directory Path Setup (Fixed)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🟢 2. Upload Directory Config (Is path ko dhyan se dekhein)
// Hum 'public' folder ke andar 'uploads/main-categories' bana rahe hain
// Note: '../' ka matlab hai controllers folder se bahar nikal kar root me jana
const UPLOAD_DIR = path.join(__dirname, '../uploads/main-categories');

// 🟢 3. Folder Creation Logic (Automatic Folder Banayega)
// Ye check karega ki folder hai ya nahi. Nahi hai to bana dega.
if (!fs.existsSync(UPLOAD_DIR)) {
    try {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        console.log("✅ Folder Created Successfully:", UPLOAD_DIR);
    } catch (err) {
        console.error("❌ Error Creating Folder:", err);
    }
}

// 🔹 Helper: Delete File
const deleteFile = (filePath) => {
    if (!filePath) return;
    // Database path (/uploads/...) ko System path me convert karein
    const fullPath = path.join(__dirname, '..', filePath);
    try {
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log("🗑️ Old Image Deleted:", fullPath);
        }
    } catch (err) {
        console.error("Error deleting file:", err);
    }
};

// ==========================================
// 1. CREATE (Save)
// ==========================================
export const saveCategory = async (req, res) => {
    try {
        // 🟢 LOG 2: Body (Text Data) check karein
    console.log("👉 2. req.body Data:", req.body);

    // 🟢 LOG 3: Files check karein (Sabse Important)
    console.log("👉 3. req.files Data:", req.files);
        const { title, link, active, order } = req.body;
        let imagePath = null;

        // Image Handling
        if (req.files && req.files.image) {
            const file = req.files.image;
            // Space hata kar clean name banayein
            const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
            
// Path check
console.log("👉 5. Upload Directory is:", UPLOAD_DIR);

            // System Path (Jahan file save hogi)
            const savePath = path.join(UPLOAD_DIR, fileName);
            
            console.log("👉 6. Trying to save file at:", savePath);

            // File Move
            await file.mv(savePath);
            console.log("✅ Image Saved at:", savePath);

            // Database Path (Jo Frontend access karega)
            // Dhyan dein: Yahan '/public' nahi likhna hai, sirf '/uploads/...'
            imagePath = `/uploads/main-categories/${fileName}`;
            console.log("image path",imagePath)
        }

        const newCategory = await MainCategory.create({
            title, link, active, order, image: imagePath
        });

        res.status(201).json({ 
            status: true, 
            msg: "Category created successfully", 
            data: newCategory 
        });

    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ status: false, msg: error.message });
    }
};

// ==========================================
// 2. READ ALL (List)
// ==========================================
export const listCategories = async (req, res) => {
    try {
        const categories = await MainCategory.find().sort({ order: 1 });
        res.status(200).json({ status: true, data: categories });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Fetch failed" });
    }
};

// ==========================================
// 3. READ SINGLE (Get One)
// ==========================================
export const getCategoryById = async (req, res) => {
    try {
        const category = await MainCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ status: false, msg: "Category not found" });
        }
        res.json({ status: true, data: category });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error" });
    }
};

// ==========================================
// 4. UPDATE
// ==========================================
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await MainCategory.findById(id);

        if (!category) {
            return res.status(404).json({ status: false, msg: "Category not found" });
        }

        const updates = req.body;
        Object.keys(updates).forEach((key) => {
            category[key] = updates[key];
        });

        // Update Image
        if (req.files && req.files.image) {
            const file = req.files.image;
            const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
            const savePath = path.join(UPLOAD_DIR, fileName);
            
            // Delete Old Image
            if (category.image) deleteFile(category.image);

            // Save New Image
            await file.mv(savePath);
            console.log("✅ New Image Saved at:", savePath);

            // Set DB Path
            category.image = `/uploads/main-categories/${fileName}`;
        }

        await category.save();
        res.json({ 
            status: true, 
            msg: "Category updated successfully", 
            data: category 
        });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ status: false, msg: "Update failed" });
    }
};

// ==========================================
// 5. DELETE
// ==========================================
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await MainCategory.findById(id);

        if (!category) {
            return res.status(404).json({ status: false, msg: "Category not found" });
        }

        // Delete Image File
        if (category.image) deleteFile(category.image);

        // Delete DB Record
        await MainCategory.findByIdAndDelete(id);

        res.json({ status: true, msg: "Category deleted successfully" });

    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ status: false, msg: "Delete failed" });
    }
};