import mongoose from 'mongoose';

const privacySchema = new mongoose.Schema({
    title: { type: String, default: 'Privacy Policy' },
    page_content: { type: String, default: '' },
    meta_title: { type: String, default: '' },
    meta_description: { type: String, default: '' },
    meta_keywords: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Privacy', privacySchema);