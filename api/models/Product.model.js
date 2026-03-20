import mongoose from "mongoose";

const ProductSchema = mongoose.Schema({
    // --- 1. Identifiers & Linking ---
    bagchee_id: { type: String, trim: true, index: true },
    
    categoryId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',  // Ensure model name matches exactly
        required: [true, "Category is required"]
    },
    subcategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory', 
        default: null
    },

    // 🟢 Arrays for Multi-Selects
    product_categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    product_tags: [{ type: String }],
    product_formats: [{ type: String }],
    product_languages: [{ type: String }],

    // --- 2. Basic Info ---
    title: {
        type: String,
        required: [true, "Book title is required"],
        trim: true,
        index: true
    },
    product_type: { type: String, default: 'book' }, // 🟢 Added missing field
    
    isbn13: { type: String, trim: true, default: "" },
    isbn10: { type: String, trim: true, default: "" },
    
    language: { type: String, default: "English" },

    // --- 3. Pricing ---
    price: { type: Number, required: [true, "Price is required"] },
    inr_price: { type: Number, default: 0 },
    real_price: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },

    // --- 4. Author & Publisher ---
    author: { // Main Author
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Author',
        required: true
    },
    authors: [{ // 🟢 Added for Multi-Authors support
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Author'
    }],
    publisher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Publisher'
    },
    
    pub_date: { type: String },
    edition: { type: String, trim: true },
    
    // --- 5. Series ---
   // Product.model.js
series: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Series' 
}],
    series_number: { type: String },
    volume: { type: String },

    // --- 6. Physical Specs ---
    pages: { type: String, default: "" },
    weight: { type: String },
    binding: { type: String, default: "Paperback" },

    // --- 7. Content ---
    synopsis: { type: String }, // 'required' hata diya taaki agar khali ho to crash na ho
    critics_note: { type: String },
    search_text: { type: String },
    tableOfContents: { type: String }, 
    aboutAuthorText: { type: String }, 

    // --- 8. Images ---
    default_image: { type: String }, // 'required' hata diya safe side ke liye
    toc_image: { type: String },
    
    // Dynamic Images
    toc_images: [{ 
        image: { type: String }, 
        order: { type: Number, default: 0 } 
    }],
    sample_images: [{ 
        image: { type: String }, 
        order: { type: Number, default: 0 } 
    }],
    related_images: [{ 
        image: { type: String }, 
        order: { type: Number, default: 0 } 
    }],

    // --- 9. SEO ---
    meta_title: String,
    meta_description: String,
    meta_keywords: String,

    // --- 10. Status & Inventory ---
    stock: { 
        type: String, 
        enum: ['active', 'inactive'], 
        default: 'active' 
    },
    availability: { 
        type: Number, // 🟢 Yahan ab hum quantity (10, 20, 50) store karenge
        default: 0 
    },

    // Flags
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isNewRelease: { type: Boolean, default: false },
    isRecommended: { type: Boolean, default: false },
    upcoming: { type: Boolean, default: false },
    upcoming_date: { type: Date, default: null },
    
    new_release_until: { type: Date },
    isExclusive: { type: Boolean, default: false },
    
    // Extra
    notes: { type: String },
    source: { type: String },
    rating: { type: Number, default: 0 },
    rated_times: { type: Number, default: 0 },

    // --- 11. Shipping ---
    ship_days: { type: String, default: "" },
    deliver_days: { type: String, default: "" },
    related_products: { type: String },

    soldCount: { 
        type: Number, 
        default: 0, 
        index: true // Searching fast karne ke liye
    },

}, {
    timestamps: true 
});

export default mongoose.model('Product', ProductSchema);