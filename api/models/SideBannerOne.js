import mongoose from 'mongoose';

const sideBannerOneSchema = new mongoose.Schema({
    image1: { type: String, required: false }, // Left Image Path
    link1: { type: String, default: '' },      // Left Link
    
    image2: { type: String, required: false }, // Right Image Path
    link2: { type: String, default: '' },      // Right Link
    
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('SideBannerOne', sideBannerOneSchema);