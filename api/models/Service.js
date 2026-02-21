import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    box_description: { type: String }, // Editor 1
    page_content: { type: String },    // Editor 2
    page_title: { type: String },
    meta_title: { type: String },
    meta_description: { type: String },
    meta_keywords: { type: String }
}, { timestamps: true });

export default mongoose.model('Service', serviceSchema);