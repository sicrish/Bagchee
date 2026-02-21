import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
    title: { type: String, default: 'Testimonials' },
    page_content: { type: String, default: '' }, // Isme saare reviews/quotes aayenge
    meta_title: { type: String, default: '' },
    meta_description: { type: String, default: '' },
    meta_keywords: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Testimonial', testimonialSchema);