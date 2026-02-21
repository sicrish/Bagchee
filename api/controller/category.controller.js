import CategorySchemaModel from '../models/category.model.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// ==========================================
// 🟢 1. SAVE CATEGORY (Local Storage)
// ==========================================
export const save = async (req, res) => {
    try {
        let imageUrl = "";
        const file = req.files?.categoryicon || req.files?.image;
        
        if (file) {
            try {
                // 'categories' folder me save hoga: backend/uploads/categories/
                imageUrl = await saveFileLocal(file, 'categories');
            } catch (uploadError) {
                return res.status(400).json({ status: false, msg: uploadError.message });
            }
        }

        const categoryData = {
            categorytitle: req.body.categoryTitle || req.body.categorytitle, 
            slug: req.body.slug,
            parentslug: req.body.parentsSlug || req.body.parentslug,
            mainmodule: req.body.mainModule || req.body.mainmodule,
            oldid: req.body.oldId || req.body.oldid,
            parentid: req.body.parentId === 'root' || !req.body.parentId ? null : req.body.parentId,
            active: req.body.active || 'active',
            lft: Number(req.body.lft) || 0,
            rght: Number(req.body.rght) || 0,
            level: Number(req.body.level) || 0,
            metatitle: req.body.metaTitle || req.body.metatitle,
            metakeywords: req.body.metaKeywords || req.body.metakeywords,
            metadescription: req.body.metaDescription || req.body.metadescription,
            producttype: req.body.productType || req.body.producttype,
            categoryiconname: imageUrl, // e.g., "/uploads/categories/icon-123.png"
            newslettercategory: req.body.newsletter === 'yes' || req.body.newslettercategory === 'Yes' ? 'Yes' : 'No',
            newsletterorder: Number(req.body.newsletterCategoryOrder) || Number(req.body.newsletterorder) || 0 
        };

        const category = await CategorySchemaModel.create(categoryData);
        res.status(201).json({ status: true, msg: "Category added successfully! 🚀", data: category });
        
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ status: false, msg: "Error: Slug ya Title pehle se exist karta hai." });
        }
        res.status(500).json({ status: false, msg: err.message });
    }
};

// ==========================================
// 🔵 2. FETCH CATEGORY (Single & List)
// ==========================================
export const fetchCategory = async (req, res) => {
    try {
        const { _id, page, limit } = req.query;

        // A. Single Category Fetch (For Edit Page Auto-fill)
        if (_id) {
            const data = await CategorySchemaModel.findById(_id).lean();
            return res.json({ status: true, data: data });
        }

        // B. Paginated List (For Admin Table/Sliders)
        if (page && limit) {
            const pageNum = Number(page) || 1;
            const pageSize = Number(limit) || 6;
            const skip = (pageNum - 1) * pageSize;

            const query = { active: 'active' }; 
            const data = await CategorySchemaModel.find(query)
                .sort({ categorytitle: 1 })
                .skip(skip)
                .limit(pageSize)
                .lean();

            const total = await CategorySchemaModel.countDocuments(query);

            return res.json({ 
                status: true, 
                data: data,
                total,
                page: pageNum,
                limit: pageSize
            });
        }

        // C. Fetch All (For Dropdowns)
        const data = await CategorySchemaModel.find().sort({ categorytitle: 1 }).lean(); 
        res.json({ status: true, data: data });

    } catch (error) {
        console.error("Fetch Category Error:", error);
        res.status(500).json({ status: false, msg: "Server Error" });
    }
};

// ==========================================
// 🟠 3. UPDATE CATEGORY (Safe Update & Mapping)
// ==========================================
export const updateCategory = async (req, res) => {
    try {
        let { _id } = req.body;
        if (!_id) return res.status(400).json({ status: false, msg: "ID is required" });

        // Handle if _id comes as an array
        if (Array.isArray(_id)) _id = _id[0];

        const existingCategory = await CategorySchemaModel.findById(_id);
        if (!existingCategory) return res.status(404).json({ status: false, msg: "Category not found" });

        let imageUrl = existingCategory.categoryiconname;
        const file = req.files?.categoryicon || req.files?.image;

        if (file) {
            try {
                const newImagePath = await saveFileLocal(file, 'categories');
                if (newImagePath) {
                    // Purani image delete karein agar exist karti hai
                    if (existingCategory.categoryiconname) {
                        await deleteFileLocal(existingCategory.categoryiconname);
                    }
                    imageUrl = newImagePath;
                }
            } catch (uploadError) {
                return res.status(400).json({ status: false, msg: uploadError.message });
            }
        }

        // 🟢 Precise Mapping: Backend Model Keys vs Frontend Field Names
        const mappedData = {
            categorytitle: req.body.categorytitle || req.body.categoryTitle,
            slug: req.body.slug,
            parentslug: req.body.parentslug || req.body.parentsSlug || req.body.parentSlug,
            mainmodule: req.body.mainmodule || req.body.mainModule,
            oldid: req.body.oldid || req.body.oldId,
            parentid: req.body.parentid === 'root' || !req.body.parentid ? null : req.body.parentid,
            active: req.body.active,
            lft: Number(req.body.lft) || 0,
            rght: Number(req.body.rght) || 0,
            level: Number(req.body.level) || 0,
            metatitle: req.body.metatitle || req.body.metaTitle,
            metakeywords: req.body.metakeywords || req.body.metaKeywords,
            metadescription: req.body.metadescription || req.body.metaDescription,
            producttype: req.body.producttype || req.body.productType,
            categoryiconname: imageUrl,
            newslettercategory: req.body.newslettercategory || (req.body.newsletter === 'yes' ? 'Yes' : 'No'),
            newsletterorder: Number(req.body.newsletterorder) || Number(req.body.newsletterCategoryOrder) || 0
        };

        const updated = await CategorySchemaModel.findByIdAndUpdate(_id, mappedData, { new: true });
        
        res.json({ status: true, msg: "Category Updated successfully! ✅", data: updated });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ status: false, msg: error.message });
    }
};

// ==========================================
// 🔴 4. DELETE CATEGORY (With File Cleanup)
// ==========================================
export const deletecategory = async (req, res) => {
    try {
        const { id } = req.params; 

        const category = await CategorySchemaModel.findById(id);
        if (!category) {
            return res.status(404).json({ status: false, msg: "Category not found" });
        }

        // Image delete karein local storage se
        if (category.categoryiconname) {
            await deleteFileLocal(category.categoryiconname);
        }

        await CategorySchemaModel.findByIdAndDelete(id);

        res.status(200).json({
            status: true,
            msg: "Deleted successfully! 🗑️",
        });

    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ status: false, msg: "Deletion failed" });
    }
};