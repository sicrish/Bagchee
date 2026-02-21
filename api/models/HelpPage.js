import mongoose from "mongoose";

const HelpPageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Page title is required"],
    trim: true
  },
  content: {
    type: String, // Stores HTML from the Rich Text Editor
    required: [true, "Page content is required"]
  },
  meta_title: {
    type: String,
    trim: true,
    default: ''
  },
  meta_description: {
    type: String,
    trim: true,
    default: ''
  },
  meta_keywords: {
    type: String,
    trim: true,
    default: ''
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

export default mongoose.model("HelpPage", HelpPageSchema);