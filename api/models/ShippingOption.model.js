import mongoose from "mongoose";

const ShippingOptionSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    maxDayLimit: { type: Number, default: 0 },
    priceUsd: { type: Number, default: 0 },
    priceEur: { type: Number, default: 0 },
    priceInr: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 } // "Order" field from UI
}, { timestamps: true });

export default mongoose.models.ShippingOption || mongoose.model("ShippingOption", ShippingOptionSchema);