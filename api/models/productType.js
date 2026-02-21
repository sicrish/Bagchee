import mongoose from "mongoose";

const ProductTypeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  image_folder: { 
    type: String, 
    required: true, 
    trim: true 
  },
  bagchee_prefix: { 
    type: String, 
    required: true, 
    trim: true 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model("ProductType", ProductTypeSchema);