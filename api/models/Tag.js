import mongoose from "mongoose";

const TagSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    unique: true, // Prevents duplicate tags
    trim: true 
  }
}, { timestamps: true });

export default mongoose.model("Tag", TagSchema);