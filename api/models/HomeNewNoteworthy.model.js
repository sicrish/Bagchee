import mongoose from "mongoose";

const HomeNewNoteworthySchema = new mongoose.Schema({
    // 🟢 REFERENCE to Main Product Collection
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Must match your Product Model name
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

export default mongoose.model("HomeNewNoteworthy", HomeNewNoteworthySchema);