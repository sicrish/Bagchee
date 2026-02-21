import mongoose from "mongoose";

const subCategorySchema = mongoose.Schema({
    // _id: Number hata diya (MongoDB default use karenge)

    // Major Change: Category ka naam nahi, ID store karenge
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category', // Ye bata raha hai ki ye ID 'Category' model se aayi hai
        required: [true, "Category selection is required"]
    },
    subcategoryname: {
        type: String,
        required: [true, "Subcategory name is required"],
        trim: true,
        lowercase: true,
    },
    subcategoryiconname: {
        type: String,
        required: [true, "SubCategory icon is required"],
        trim: true
    }
});



// Model Name: Standard PascalCase
const SubCategorySchemaModel = mongoose.models.SubCategory || mongoose.model("SubCategory", subCategorySchema);

export default SubCategorySchemaModel;