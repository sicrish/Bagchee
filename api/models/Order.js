import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  order_number: {
    type: String,
    required: true,
    unique: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assumes you have a Customer model
    required: true
  },
  
  // Financials
  total: { type: Number, default: 0 },
  shipping_cost: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  
  // Status & Payment
  payment_type: { type: String, default: '' },
  shipping_type: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Not yet ordered', 'Payment pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Not yet ordered'
  },
  payment_status: { type: String, default: '' },
  transaction_id: { type: String, default: '' },

  // Membership & Coupons
  membership: { type: String, enum: ['Yes', 'No'], default: 'No' },
  membership_discount: { type: Number, default: 0 },
  coupon_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },

  // Shipping Details
  shipping_details: {
    email: { type: String, default: '' },
    first_name: { type: String, default: '' },
    last_name: { type: String, default: '' },
    address_1: { type: String, default: '' },
    address_2: { type: String, default: '' },
    company: { type: String, default: '' },
    country: { type: String, default: '' },
    state_region: { type: String, default: '' },
    city: { type: String, default: '' },
    postcode: { type: String, default: '' },
    phone: { type: String, default: '' }
  },

  // Billing Details
  billing_details: {
    first_name: { type: String, default: '' },
    last_name: { type: String, default: '' },
    address_1: { type: String, default: '' },
    address_2: { type: String, default: '' },
    company: { type: String, default: '' },
    country: { type: String, default: '' },
    state_region: { type: String, default: '' },
    city: { type: String, default: '' },
    postcode: { type: String, default: '' },
    phone: { type: String, default: '' }
  },

  // Products Array
  products: [{
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
    status: { type: String, default: '' },
    courier: { type: String, default: '' },
    tracking_id: { type: String, default: '' },
    return_note: { type: String, default: '' },
    cancel_note: { type: String, default: '' }
  }],

  comment: { type: String, default: '' } // HTML content from Jodit

}, { timestamps: true });

export default mongoose.model("Order", OrderSchema);