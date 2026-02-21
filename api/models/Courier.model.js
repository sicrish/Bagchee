import mongoose from "mongoose";

const CourierSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    trackingPage: {
        type: String, // URL for tracking
        required: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// 🟢 SAFE MODEL CREATION
const CourierModel = mongoose.models.Courier || mongoose.model("Courier", CourierSchema);

export default CourierModel;