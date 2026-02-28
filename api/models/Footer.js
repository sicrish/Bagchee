import mongoose from 'mongoose';

const footerSchema = new mongoose.Schema({
    name: { type: String, required: true },     // Internal use: Column 1, Column 2
    title: { type: String, default: '' },      // Heading: HELP, SERVICES
    subtitle: { type: String, default: '' },   // Tagline ya secondary text
    content: { type: String, default: '' },    // Rich Text Editor ka HTML content
    index: { type: Number, unique: true }      // Column positioning ke liye (1, 2, 3, 4)
}, { timestamps: true });

export default mongoose.model('Footer', footerSchema);