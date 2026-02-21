import mongoose from "mongoose";

const bannerSchema = mongoose.Schema({
    // 1. Headings & Text
    title: { 
        type: String,
        required: [true, "Banner title is required"],
        trim: true
    },
    description: { 
        type: String,
        required: [true, "Description is required"],
        trim: true
    },
    buttonText: { 
        type: String,
        default: "Explore Now", // Default text agar admin na dale
        trim: true
    },
    
    // 2. Styling (Frontend ke colors ke liye)
    accentColor: { 
        type: String,
        default: "bg-hero-primary" // Tailwind class store karenge
    },

    // 3. Images (Ab 2 Images hongi)
    bgImageName: { // Peeche wali badi image
        type: String,
        required: [true, "Background image is required"]
    },
    overlayImageName: { // Aage wali floating book image
        type: String,
        required: [true, "Overlay/Book image is required"]
    },

    // 4. Status
    status: {
        type: String,
        default: "active"
    }
}, {
    timestamps: true
});

const BannerSchemaModel = mongoose.model("banner", bannerSchema);
export default BannerSchemaModel;