import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    sale_threshold: { type: Number, default: 0 },
    bestseller_threshold: { type: Number, default: 0 },
    member_discount: { type: Number, default: 0 },
    membership_cost: { type: Number, default: 0 },
    membership_cost_eur: { type: Number, default: 0 },
    membership_cart_price: { type: Number, default: 0 },
    new_arrival_time: { type: Number, default: 0 },
    free_shipping_over: { type: Number, default: 0 },
    order_accepted_promo: { type: String, default: '' }, // 🟢 Added missing field
    show_promo_over_usd: { type: Number, default: 0 },
    show_promo_over_eur: { type: Number, default: 0 },
    show_promo_over_inr: { type: Number, default: 0 },
    topbar_promotion: { type: String, default: 'Yes' },
    topbar_promotion_text: { type: String, default: '' },
    account_number: { type: String, default: '' },
    swift_code: { type: String, default: '' },
    beneficiary_name: { type: String, default: '' },
    bank_name: { type: String, default: '' },
    emails_copy: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
