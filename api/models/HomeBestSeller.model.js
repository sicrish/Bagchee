import mongoose from "mongoose";

const HomeBestSellerSchema = new mongoose.Schema({
    // Admin dwara select kiya gaya product
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', 
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

export default mongoose.model("HomeBestSeller", HomeBestSellerSchema);