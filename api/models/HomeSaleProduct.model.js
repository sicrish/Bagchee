import mongoose from "mongoose";

const HomeSaleProductSchema = new mongoose.Schema({
    // 🟢 CHANGE: Ab hum String nahi, balki Product ka _id store karenge (Reference)
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // ⚠️ Dhyan rahe: Ye naam apke Main Product Model ke export name se match hona chahiye
        required: [true, "Product is required"]
    },
    
    isActive: {
        type: Boolean,
        default: true
    },
    
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export default mongoose.model("HomeSaleProduct", HomeSaleProductSchema);