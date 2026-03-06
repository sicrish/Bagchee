import mongoose from "mongoose";

const categorySchema = mongoose.Schema({
    // Basic Info
    categorytitle: { type: String, required: [true, "Title is required"], trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    parentslug: { type: String, default: "" },
    mainmodule: { type: String, default: "" },
    oldid: { type: String, default: "0" }, // Image me 'Old id' field hai
    
    // Relationship & Hierarchy
    parentid: { 
        type: mongoose.Schema.Types.Mixed, // String ya ObjectId dono handle karne ke liye
        default: null 
    },
    
    // Tree Structure Fields (As seen in image: lft, rght, level)
    lft: { type: Number, default: 0 },
    rght: { type: Number, default: 0 },
    level: { type: Number, default: 0 },

    // Status
    active: { type: String, enum: ['active', 'inactive'], default: 'active' },
    
    // SEO Fields
    metatitle: { type: String, trim: true },
    metakeywords: { type: String, trim: true },
    metadescription: { type: String, trim: true },
    
    // Media & Product Settings
    categoryiconname: { type: String, default: "" }, // Image file name store karne ke liye
    producttype: { type: String, default: "Book" }, // Books, CDs etc.
    
    // Newsletter Settings
    newslettercategory: { type: String, enum: ['Yes', 'No'], default: 'No' },
    newsletterorder: { type: Number, default: 0 }
}, { timestamps: true });

const CategoryModel = mongoose.models.category || mongoose.model("category", categorySchema);

export default CategoryModel;