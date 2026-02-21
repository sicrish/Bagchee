import mongoose from 'mongoose';

const termsSchema = new mongoose.Schema({
    title: { type: String, default: 'Terms of Use' },
    page_content: { type: String, default: '' },
    meta_title: { type: String, default: '' },
    meta_description: { type: String, default: '' },
    meta_keywords: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Terms', termsSchema);