import mongoose from "mongoose";

const PublisherSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category',// You can change to ObjectId if linking to a Category model
    required:true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String, // Stores image path/URL
    default: ''
  },
  company: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  place: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  fax: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date, // Date picker field
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  show: {
    type: String, // Dropdown value (e.g., 'Yes', 'No' or specific visibility options)
    default: ''
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true // Slugs should generally be unique for SEO
  },
  ship_in_days: {
    type: String, // Dropdown value (e.g., '1-2 days', '3-5 days')
    default: ''
  }
}, { timestamps: true });

export default mongoose.model("Publisher", PublisherSchema);