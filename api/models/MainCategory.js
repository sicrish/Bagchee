import mongoose from 'mongoose';

const mainCategorySchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, "Title is required"], 
        trim: true 
    },
    link: { 
        type: String, 
        required: [true, "Link is required"], 
        trim: true 
    },
    active: { 
        type: String, 
        enum: ['Yes', 'No'],
        default: 'Yes' 
    },
    order: { 
        type: Number, 
        default: 0 
    },
    image: { 
        type: String, 
        default: null 
    }
}, { timestamps: true });

export default mongoose.model('MainCategory', mainCategorySchema);