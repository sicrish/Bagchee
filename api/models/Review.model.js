import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category', // 
        default: null
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Links to Product Model
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        default: ""
    },
    review: {
        type: String, // Rich Text content
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
    },
    isActive: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// 🟢 SAFE MODEL CREATION
const ReviewModel = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

export default ReviewModel;