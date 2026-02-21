import mongoose from "mongoose";

const LanguageSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  order: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

export default mongoose.model("Language", LanguageSchema);