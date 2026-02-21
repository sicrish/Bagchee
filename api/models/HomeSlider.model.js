import mongoose from "mongoose";

const HomeSliderSchema = new mongoose.Schema(
  {
    desktopImage: { type: String, required: true }, // 🖥️ Desktop ke liye
    mobileImage: { type: String, required: true },  // 📱 Mobile ke liye
    link: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("HomeSlider", HomeSliderSchema);