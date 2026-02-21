import mongoose from "mongoose";

const SeriesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Series title is required"],
    trim: true,
    unique: true // Duplicate naam na ho
  }
}, { timestamps: true });

export default mongoose.model("Series", SeriesSchema);