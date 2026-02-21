import mongoose from "mongoose";

const LabelSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Label title is required"],
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model("Label", LabelSchema);