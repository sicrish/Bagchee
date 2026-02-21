import url from 'url';
import path from 'path';
import fs from 'fs'; 
import SubCategorySchemaModel from '../models/SubCategory.model.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// 1. SAVE SUBCATEGORY
export const save = async (req, res) => {
    try {
        // 🟢 Check: Postman key 'subcategoryicon' (Full Name)
        if (!req.files || !req.files.subcategoryicon) {
            return res.status(400).json({ msg: "SubCategory icon image is required" });
        }

        const subcategoryicon = req.files.subcategoryicon;
        const subcategoryiconname = Date.now() + "-" + subcategoryicon.name;

        // 🟢 Data Mapping (Explicit Assignment for Safety)
        const subCategoryDetails = { 
            subcategoryname: req.body.subcategoryname,
            categoryId: req.body.categoryId, // catId -> categoryId (Important!)
            subcategoryiconname: subcategoryiconname 
        };

        const subCategory = await SubCategorySchemaModel.create(subCategoryDetails);

        const uploadPath = path.join(__dirname, "../uploads/subcaticons", subcategoryiconname);
        
        subcategoryicon.mv(uploadPath, (err) => {
            if (err) {
                SubCategorySchemaModel.deleteOne({ _id: subCategory._id });
                return res.status(500).json({ status: false, msg: "File upload failed" });
            }
            res.status(201).json({ status: true, msg: "SubCategory added successfully" });
        });

    } catch (error) {
        console.log("Save Error:", error);
        res.status(500).json({ status: false, msg: "Server Error" });
    }
};

// 2. FETCH SUBCATEGORY
export const fetch = async (req, res) => {
    try {
        const condition_obj = req.query;
        // 🟢 Populate: 'categoryId' use kiya (Model match)
        const subList = await SubCategorySchemaModel.find(condition_obj).populate('categoryId');
        
        if (subList.length > 0) {
            res.status(200).json(subList);
        } else {
            res.status(404).json({ status: false, msg: "No data found" });
        }
    } catch (error) {
        console.log("Fetch Error:", error);
        res.status(500).json({ status: false, msg: "Server Error" });
    }
};

// 3. DELETE SUBCATEGORY
export const deleteSubCategory = async (req, res) => {
    try {
        const condition_obj = req.body; 
        const subCat = await SubCategorySchemaModel.findOne(condition_obj);

        if (subCat) {
            await SubCategorySchemaModel.deleteOne(condition_obj);

            // 🟢 Variable: subcategoryiconname match kiya
            const imagePath = path.join(__dirname, "../uploads/subcaticons", subCat.subcategoryiconname);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }

            res.status(200).json({ status: true, msg: "SubCategory deleted successfully" });
        } else {
            res.status(404).json({ status: false, msg: "Resource not found" });
        }
    } catch (error) {
        console.log("Delete Error:", error);
        res.status(500).json({ status: false, msg: "Server Error" });
    }
};

// 4. UPDATE SUBCATEGORY (Advanced Logic Added)
export const update = async (req, res) => {
    try {
        // 🟢 Parsing logic (Category jaisa)
        const condition_obj = JSON.parse(req.body.condition_obj);
        const content_obj = JSON.parse(req.body.content_obj);

        // Case 1: New Image Upload
        if (req.files && req.files.subcategoryicon) {
            
            // A. Purani Image Delete
            const oldSubCat = await SubCategorySchemaModel.findOne(condition_obj);
            if (oldSubCat) {
                const oldImagePath = path.join(__dirname, "../uploads/subcaticons", oldSubCat.subcategoryiconname);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            // B. Nayi Image Save
            const subcategoryicon = req.files.subcategoryicon;
            const subcategoryiconname = Date.now() + "-" + subcategoryicon.name;
            const uploadPath = path.join(__dirname, "../uploads/subcaticons", subcategoryiconname);
            
            subcategoryicon.mv(uploadPath, (err) => {
                if(err) console.log("New image upload failed");
            });
            
            // C. DB Update Name
            content_obj.subcategoryiconname = subcategoryiconname;
        }

        const subCategory = await SubCategorySchemaModel.findOneAndUpdate(
            condition_obj, 
            { $set: content_obj },
            { new: true }
        );

        if (subCategory) {
            res.status(200).json({ status: true, msg: "Update successful" });
        } else {
            res.status(404).json({ status: false, msg: "Resource not found" });
        }
    } catch (error) {
        console.log("Update Error:", error);
        res.status(500).json({ status: false, msg: "Server Error" });
    }
};