import React, { useState } from 'react';
import { Mail, Info, CreditCard, ChevronRight, Sparkles, ShoppingCart, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const GiftCardDetail = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [formData, setFormData] = useState({
    amount: '',
    recipientEmail: '',
    confirmEmail: '',
    toName: '',
    fromName: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddToCart = () => {
    const { amount, recipientEmail, confirmEmail, toName, fromName } = formData;

    if (!amount || !recipientEmail || !toName || !fromName) {
      return toast.error("Please fill all required fields!");
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 10 || amt > 1000) {
      return toast.error("Amount must be between $10 and $1000");
    }
    if (recipientEmail !== confirmEmail) {
      return toast.error("Emails do not match!");
    }

    const giftCardItem = {
      id: `giftcard_${Date.now()}`,
      itemType: 'gift_card',
      title: `E-Gift Card ($${amt.toFixed(2)})`,
      price: amt,
      quantity: 1,
      recipientEmail,
      recipientName: toName,
      senderName: fromName,
      message: formData.message,
      defaultImage: null,
    };

    addToCart(giftCardItem, 1);
    toast.success("E-Gift Card added to cart!");
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-white font-body text-text-main">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4 text-[10px] font-montserrat flex items-center gap-2 text-gray-400 uppercase tracking-[0.2em]">
        <Link to="/" className="hover:text-primary cursor-pointer transition-colors">Home</Link>
        <ChevronRight size={10} />
        <span className="text-text-main font-bold">E-Gift Cards</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* LEFT COL: Preview & Guidelines */}
          <div className="space-y-10 animate-fadeInLeft">
            <div className="relative group">
              <div className="aspect-[1.6/1] w-full rounded-2xl bg-gradient-to-br from-primary-dark via-primary to-secondary overflow-hidden shadow-2xl relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                <div className="absolute top-8 left-10">
                  <h2 className="font-display text-white text-3xl md:text-4xl font-bold tracking-tighter italic">BAGCHEE</h2>
                </div>

                <div className="absolute bottom-10 left-10">
                  <div className="flex items-center gap-2 text-white/90 mb-1">
                    <Mail size={14} />
                    <span className="text-[10px] font-montserrat uppercase tracking-widest">Instant Delivery</span>
                  </div>
                  <p className="text-white font-display text-2xl font-semibold tracking-tight">E-Gift Card</p>
                </div>

                <div className="absolute top-8 right-10 flex flex-col items-end">
                  <span className="text-white font-display text-5xl font-bold drop-shadow-lg">
                    {formData.amount ? `$${parseFloat(formData.amount || 0).toFixed(2)}` : '$0.00'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-cream-50 p-8 rounded-2xl border border-cream-200/50 space-y-6">
              <h3 className="font-display text-lg font-bold text-text-main flex items-center gap-2">
                <Sparkles className="text-primary" size={18} />
                Digital Card Guidelines
              </h3>
              <ul className="space-y-4 text-sm text-gray-600 font-body leading-relaxed">
                <li className="flex gap-3">
                  <Info className="text-primary shrink-0" size={16} />
                  <span>Set your own value between <span className="font-bold text-text-main">$10.00 and $1000.00</span>.</span>
                </li>
                <li className="flex gap-3">
                  <Mail className="text-primary shrink-0" size={16} />
                  <span>Delivered via email <span className="font-bold text-text-main">within minutes</span> of purchase.</span>
                </li>
                <li className="flex gap-3">
                  <CreditCard className="text-primary shrink-0" size={16} />
                  <span>Valid for all books and services across the Bagchee store.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="text-primary shrink-0" size={16} />
                  <span>Recipient can redeem the code from their <span className="font-bold text-text-main">My Account → Gift Cards</span> page.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT COL: Order Form */}
          <div className="animate-fadeInRight">
            <div className="mb-8">
              <h1 className="font-display text-4xl md:text-5xl text-text-main mb-3 leading-tight tracking-tight">
                Bagchee E-Gift Card
              </h1>
              <p className="text-primary font-montserrat font-bold text-xs tracking-widest uppercase flex items-center gap-2">
                <span className="w-8 h-[2px] bg-primary"></span>
                Instant Email Delivery
              </p>
            </div>

            <div className="space-y-6">
              {/* Amount */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-montserrat">Amount (USD) *</label>
                <input
                  name="amount"
                  type="number"
                  min="10"
                  max="1000"
                  placeholder="ENTER VALUE $10 – $1000"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all font-montserrat text-sm font-bold"
                  value={formData.amount}
                  onChange={handleInputChange}
                />
              </div>

              {/* Emails */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-montserrat">Recipient Email *</label>
                  <input
                    name="recipientEmail"
                    type="email"
                    placeholder="EMAIL ADDRESS"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all text-sm"
                    value={formData.recipientEmail}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-montserrat">Confirm Email *</label>
                  <input
                    name="confirmEmail"
                    type="email"
                    placeholder="RE-ENTER EMAIL"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all text-sm"
                    value={formData.confirmEmail}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-montserrat">To Name *</label>
                  <input
                    name="toName"
                    type="text"
                    placeholder="RECIPIENT NAME"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all text-sm"
                    value={formData.toName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-montserrat">From Name *</label>
                  <input
                    name="fromName"
                    type="text"
                    placeholder="YOUR NAME"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all text-sm"
                    value={formData.fromName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-montserrat">Gift Message</label>
                <textarea
                  name="message"
                  rows="4"
                  maxLength="250"
                  placeholder="WRITE A PERSONAL MESSAGE..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all text-sm resize-none"
                  value={formData.message}
                  onChange={handleInputChange}
                ></textarea>
                <div className="text-right text-[9px] font-montserrat text-gray-400 uppercase tracking-widest">
                  {formData.message.length} / 250 Characters
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full py-5 bg-text-main text-white font-montserrat font-bold text-sm uppercase tracking-[0.3em] rounded-xl hover:bg-black transition-all shadow-2xl shadow-primary/20 active:scale-[0.98] mt-4 flex items-center justify-center gap-3"
              >
                <ShoppingCart size={18} />
                Add to Cart & Checkout
              </button>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
};

export default GiftCardDetail;
