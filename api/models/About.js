import mongoose from 'mongoose';

const aboutSchema = new mongoose.Schema({
    title: { type: String, default: 'About Us' },
    page_content: { type: String, default: '' },
    meta_title: { type: String, default: '' },
    meta_description: { type: String, default: '' },
    meta_keywords: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('About', aboutSchema);