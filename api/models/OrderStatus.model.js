import mongoose from "mongoose";

const OrderStatusSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true // Status name unique hona chahiye
    },
    description: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// 🟢 SAFE MODEL CREATION (Crash Rokne ke liye)
const OrderStatusModel = mongoose.models.OrderStatus || mongoose.model("OrderStatus", OrderStatusSchema);

export default OrderStatusModel;