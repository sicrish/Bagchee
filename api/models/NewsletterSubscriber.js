import mongoose from 'mongoose';

const newsletterSubscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Duplicate emails rokne ke liye
        trim: true,
        lowercase: true
    },
    firstname: {
        type: String,
        trim: true,
        default: ''
    },
    lastname: {
        type: String,
        trim: true,
        default: ''
    },
    categories: [{
        type: String // Categories ka array store karega e.g. ["Tech", "Art"]
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true }); // CreatedAt aur UpdatedAt auto-add karega

export default mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);