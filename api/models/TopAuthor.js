import mongoose from 'mongoose';

const topAuthorSchema = new mongoose.Schema({
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Author', 
        required: true
    },
    // 🟢 Ek specific book ki image dikhane ke liye
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', 
        required: true
    },
    role: { type: String, default: '' },   // Padma Bhushan, etc.
    quote: { type: String, default: '' },  // Author's Quote
    active: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export default mongoose.model('TopAuthor', topAuthorSchema);