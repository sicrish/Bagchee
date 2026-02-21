import mongoose from "mongoose";

const FormatSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  active: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'inactive' 
  },
  category: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category',
    default: ''
  },
  order: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

export default mongoose.model("Format", FormatSchema);