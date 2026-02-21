import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ArrowRight, Tag, X, Globe } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { CurrencyContext } from '../../context/CurrencyContext';
import toast from 'react-hot-toast';
import LogoBlue from '../../components/common/LogoBlue';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const { currency, setCurrency, formatPrice } = useContext(CurrencyContext);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [currencies] = useState(['INR', 'EUR', 'GBP', 'USD']);

  const API_BASE_URL = process.env.REACT_APP_API_URL || '';

  // Shipping and tax calculations
  const subtotal = cartTotal;
  const discount = appliedCoupon ? (subtotal * appliedCoupon.discount) / 100 : 0;
  const shippingCost = subtotal > 500 ? 0 : 50;
  const tax = ((subtotal - discount) * 0.18);
  const total = subtotal - discount + shippingCost + tax;

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
    toast.success('Item removed from cart');
  };

  const handleQuantityChange = (productId, type) => {
    updateQuantity(productId, type);
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    if (couponCode.toUpperCase() === 'SAVE10') {
      setAppliedCoupon({ code: couponCode, discount: 10 });
      toast.success('Coupon applied successfully!');
    } else {
      toast.error('Invalid coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const handleCheckout = () => {
    const authData = localStorage.getItem('auth');
    if (!authData) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  const getImageUrl = (image) => {
    if (!image) return 'https://placehold.co/100x140?text=No+Image';
    return image.startsWith('http') ? image : `${API_BASE_URL}${image}`;
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <header className="bg-cream-100 border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Link to="/" className="inline-block">
              <LogoBlue className="h-10 w-auto" />
            </Link>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-cream-100 rounded-lg p-12 border border-gray-200">
            <div className="w-24 h-24 bg-cream-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <ShoppingBag className="text-text-muted" size={48} />
            </div>
            <h2 className="text-2xl font-display font-bold text-text-main mb-2">Your cart is empty</h2>
            <p className="text-text-muted mb-8">Looks like you haven't added any items to your cart yet</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              <ArrowLeft size={20} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }
console.log(cart)
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-cream-100 border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="inline-block">
              <LogoBlue className="h-10 w-auto" />
            </Link>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => {
                    const currentIndex = currencies.indexOf(currency);
                    const nextIndex = (currentIndex + 1) % currencies.length;
                    setCurrency(currencies[nextIndex]);
                  }}
                  className="flex items-center gap-2 text-sm font-bold text-text-main hover:text-primary transition-colors"
                >
                  <Globe size={18} />
                  <span>{currency}</span>
                </button>
              </div>
              <span className="text-sm text-text-muted">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-main font-medium"
          >
            <ArrowLeft size={20} />
            Continue Shopping
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-cream-100 rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200 bg-cream-100">
                <h1 className="text-2xl font-display font-bold text-text-main">Shopping Cart</h1>
              </div>

              <div className="divide-y divide-gray-100">
                {cart.map((item) => (
                  <div key={item._id} className="p-6">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <Link to={`/books/${item.bagcheeId || item._id}/${item.slug || 'book'}`} className="flex-shrink-0">
                        <img
                          src={getImageUrl(item.default_image || item.related_images?.[0])}
                          alt={item.name || item.title}
                          className="w-24 h-32 object-cover rounded-lg border border-gray-200"
                        />
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <Link to={`/books/${item.bagcheeId || item._id}/${item.slug || 'book'}`} className="font-semibold text-text-main mb-1 hover:text-primary transition-colors block">
                              {item.name || item.title}
                            </Link>
                            {item.author && (
                              <p className="text-sm text-text-muted">by {typeof item.author === 'object' ? `${item.author.first_name || ''} ${item.author.last_name || ''}`.trim() : item.author}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item._id)}
                            className="text-text-muted hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                            title="Remove item"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>

                        <div className="flex items-end justify-between mt-4">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleQuantityChange(item._id, 'dec')}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-cream-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-12 text-center font-medium text-text-main">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item._id, 'inc')}
                              disabled={item.quantity >= (item.stock || 10)}
                              className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-cream-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-xl font-bold text-text-main">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-sm text-text-muted">
                                {formatPrice(item.price)} each
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-cream-100 rounded-lg border border-gray-200 shadow-sm sticky top-24">
              <div className="p-6 border-b border-gray-200 bg-cream-100">
                <h2 className="text-lg font-display font-bold text-text-main">Order Summary</h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Coupon Section */}
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">
                    Have a coupon?
                  </label>
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                      >
                        Apply
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Tag className="text-green-600" size={18} />
                        <span className="text-sm font-medium text-green-800">
                          {appliedCoupon.code} ({appliedCoupon.discount}% off)
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Subtotal</span>
                    <span className="font-medium text-text-main">{formatPrice(subtotal)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Discount</span>
                      <span className="font-medium text-green-600">-{formatPrice(discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Shipping</span>
                    <span className="font-medium text-text-main">
                      {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Tax (GST 18%)</span>
                    <span className="font-medium text-text-main">{formatPrice(tax)}</span>
                  </div>

                  {shippingCost > 0 && (
                    <p className="text-xs text-text-muted">
                      Add {formatPrice(500 - subtotal)} more for FREE shipping
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between mb-6">
                    <span className="text-lg font-bold text-text-main">Total</span>
                    <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    Proceed to Checkout
                    <ArrowRight size={20} />
                  </button>
                </div>

                <p className="text-xs text-text-muted text-center">
                  Secure checkout
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
