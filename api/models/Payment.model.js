import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    additionalText: {
        type: String, // Rich Text Content (HTML)
        default: ""
    },
    isAdditionalTextActive: {
        type: Boolean,
        default: false
    },
    image: {
        type: String, // Stores Image URL or Path
        default: ""
    }
}, { timestamps: true });

// 🟢 SAFE MODEL CREATION
const PaymentModel = mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);

export default PaymentModel;