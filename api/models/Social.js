import mongoose from 'mongoose';

const socialSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, "Title is required"] 
    },
    link: { 
        type: String, 
        required: [true, "Link is required"] 
    },
    icon_image: { 
        type: String, 
        required: [true, "Icon image is required"] 
    },
    order: { 
        type: Number, 
        default: 0 
    },
    
    // Status Flags
    isActive: { type: Boolean, default: true },      // Main Status
    isShareActive: { type: Boolean, default: false }, // Share Active status
    
    // Visibility Flags
    showInFooter: { type: Boolean, default: true },
    showInProduct: { type: Boolean, default: false },
    showInCategory: { type: Boolean, default: false }

}, { timestamps: true });

export default mongoose.model('Social', socialSchema);