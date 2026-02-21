import mongoose from 'mongoose';

const homeSectionProductSchema = new mongoose.Schema({
    home_section_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'HomeSection', 
        required: true 
    },
    productId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true 
    },
    title: { 
        type: String, // Product Name for display
        required: true 
    },
    active: { 
        type: String, 
        enum: ['Yes', 'No'], 
        default: 'Yes' 
    },
    order: { 
        type: Number, 
        default: 0 
    }
}, { timestamps: true });

const HomeSectionProduct = mongoose.model('HomeSectionProduct', homeSectionProductSchema);
export default HomeSectionProduct;