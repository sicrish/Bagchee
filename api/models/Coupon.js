import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    uppercase: true 
  },
  valid_from: { 
    type: Date 
  },
  valid_to: { 
    type: Date 
  },
  active: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'inactive' 
  },
  fix_amount: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'inactive' // active = Fixed Amount, inactive = Percentage (assumed logic)
  },
  amount: { 
    type: Number, 
    default: 0 
  },
  minimum_buy: { 
    type: Number, 
    default: 0 
  },
  title: { 
    type: String, 
    trim: true 
  },
  price_over_only: { 
    type: Number, // "Price over only" field
    default: 0 
  },
  // Condition Flags
  new_customer_only: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'inactive' 
  },
  members_only: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'inactive' 
  },
  next_order_only: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'inactive' 
  },
  bestseller_only: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'inactive' 
  },
  recommended_only: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'inactive' 
  },
  new_arrivals_only: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'inactive' 
  },
  get_third_free: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'inactive' 
  },
  categories: [{ 
    type: String, // Array to store selected Category IDs or Names
    trim: true
  }]
}, { timestamps: true });

export default mongoose.model("Coupon", CouponSchema);