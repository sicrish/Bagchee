import mongoose from "mongoose";

const BooksOfMonthSchema = new mongoose.Schema({
    monthName: { type: String, required: true }, // e.g., "February 2026"
    headline: { type: String },                 // e.g., "Our Romantic Picks"
    // Books ki list (Product IDs ka array)
    products: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product' 
    }],
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('BooksOfMonth', BooksOfMonthSchema);