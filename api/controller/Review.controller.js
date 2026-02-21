import ReviewModel from '../models/Review.model.js';

// 🟢 IMPORT RELATED MODELS (Crucial for .populate to work)
import CategoryModel from '../models/category.model.js'; 
import ProductModel from '../models/Product.model.js'; 

// ==========================================
// 🟢 1. CREATE (SAVE)
// ==========================================
export const saveReview = async (req, res) => {
    try {
        // Frontend sends: category_id, item_id (snake_case)
        const { category_id, item_id, email, name, title, review, rating, status, isActive } = req.body;

        // Validation
        if (!item_id) return res.status(400).json({ status: false, msg: "Item ID is required" });
        if (!name) return res.status(400).json({ status: false, msg: "Name is required" });
        if (!review) return res.status(400).json({ status: false, msg: "Review content is required" });

        // Status Handling
        let finalIsActive = false;
        if (isActive === true || isActive === 'true' || status === 'active') {
            finalIsActive = true;
        }

        const newReview = new ReviewModel({
            // 🟢 MAPPING (As per your request)
            categoryId: category_id || null, 
            itemId: item_id,                
            email: email || "",
            name: name,
            title: title || "",
            review: review,
            rating: Number(rating) || 5,
            isActive: finalIsActive
        });

        await newReview.save();

        res.status(201).json({ 
            status: true, 
            msg: "Review saved successfully!", 
            data: newReview 
        });

    } catch (error) {
        console.error("Save Review Error:", error);
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 2. READ (LIST ALL)
// ==========================================
export const getAllReviews = async (req, res) => {
    try {
        const reviews = await ReviewModel.find()
            // Make sure 'categorytitle' exists in your CategoryModel, otherwise use 'title' or 'name'
            .populate('categoryId', 'categorytitle') 
            .populate('itemId', 'title')             
            .sort({ createdAt: -1 });

        res.status(200).json({ 
            status: true, 
            msg: "Reviews fetched successfully",
            data: reviews 
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 3. READ ONE (GET BY ID)
// ==========================================
export const getReviewById = async (req, res) => {
    try {
        const id = req.params.id;
        const review = await ReviewModel.findById(id);

        if (!review) {
            return res.status(404).json({ status: false, msg: "Review not found" });
        }

        // 🟢 MAPPING BACK TO FRONTEND FORMAT
        const formattedData = {
            _id: review._id,
            category_id: review.categoryId, 
            item_id: review.itemId,
            email: review.email,
            name: review.name,
            title: review.title,
            review: review.review,
            rating: review.rating,
            status: review.isActive ? 'active' : 'inactive'
        };

        res.status(200).json({ status: true, data: formattedData });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 4. UPDATE (Fixed for Partial Updates)
// ==========================================
export const updateReview = async (req, res) => {
    try {
        const id = req.params.id;
        const { category_id, item_id, email, name, title, review, rating, status, isActive } = req.body;

        // 1. Dynamic Update Object (Safe Mode)
        // Sirf wahi fields update hongi jo frontend ne bheji hain
        const updateData = {};

        // 🟢 MAPPING CHECKS
        if (category_id !== undefined) updateData.categoryId = category_id;
        if (item_id !== undefined) updateData.itemId = item_id;
        if (email !== undefined) updateData.email = email;
        if (name !== undefined) updateData.name = name;
        if (title !== undefined) updateData.title = title;
        if (review !== undefined) updateData.review = review;
        if (rating !== undefined) updateData.rating = Number(rating);

        // Status Logic
        if (isActive !== undefined) {
             updateData.isActive = (isActive === true || isActive === 'true');
        } else if (status !== undefined) {
             updateData.isActive = (status === 'active');
        }

        const updatedReview = await ReviewModel.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedReview) {
            return res.status(404).json({ status: false, msg: "Review not found" });
        }

        res.status(200).json({ 
            status: true, 
            msg: "Review updated successfully!", 
            data: updatedReview 
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 5. DELETE
// ==========================================
export const deleteReview = async (req, res) => {
    try {
        const id = req.params.id;
        const deletedReview = await ReviewModel.findByIdAndDelete(id);

        if (!deletedReview) {
            return res.status(404).json({ status: false, msg: "Review not found" });
        }

        res.status(200).json({ 
            status: true, 
            msg: "Review deleted successfully!" 
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};