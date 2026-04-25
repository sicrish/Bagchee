import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Tag, X, Star, Truck, Crown, Award } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { CurrencyContext } from '../../context/CurrencyContext';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
// Import payment icons like footer
import visaImg from '../../assets/images/website/payments/Visa.svg';
import amexImg from '../../assets/images/website/payments/american.png';
import discoverImg from '../../assets/images/website/payments/Discover.png';
import mastercardImg from '../../assets/images/website/payments/MasterCard.svg';
import paypalImg from '../../assets/images/website/payments/PayPal.svg';

// ─── Tiered shipping prices (USD) by shipping DB id ───
const SHIPPING_TIERS = {
  6: [ // Express (3-5 Business Days)
    { min: 1,   max: 2,        usd: 50  },
    { min: 3,   max: 6,        usd: 80  },
    { min: 7,   max: 11,       usd: 110 },
    { min: 12,  max: 15,       usd: 150 },
    { min: 16,  max: 20,       usd: 200 },
    { min: 21,  max: 25,       usd: 280 },
    { min: 26,  max: 36,       usd: 350 },
    { min: 37,  max: 50,       usd: 435 },
    { min: 51,  max: 100,      usd: 550 },
    { min: 101, max: Infinity, usd: 730 },
  ],
  5: [ // Expedited (8-12 Business Days)
    { min: 1,   max: 2,        usd: 20  },
    { min: 3,   max: 6,        usd: 35  },
    { min: 7,   max: 11,       usd: 50  },
    { min: 12,  max: 15,       usd: 80  },
    { min: 16,  max: 20,       usd: 120 },
    { min: 21,  max: 25,       usd: 150 },
    { min: 26,  max: 36,       usd: 175 },
    { min: 37,  max: 50,       usd: 222 },
    { min: 51,  max: 100,      usd: 280 },
    { min: 101, max: Infinity, usd: 400 },
  ],
};

const getTieredShippingUsd = (shippingId, totalBooks) => {
  const tiers = SHIPPING_TIERS[shippingId];
  if (!tiers || totalBooks === 0) return 0;
  const tier = tiers.find(t => totalBooks >= t.min && totalBooks <= t.max);
  return tier ? tier.usd : tiers[tiers.length - 1].usd;
};

const Cart = () => {
  const navigate = useNavigate();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    appliedCoupon,
    setAppliedCoupon,
    appliedShipping,
    setAppliedShipping,
    membershipAdded,
    setMembershipAdded,
  } = useCart();
  const { currency, formatPrice, symbols, exchangeRates } = useContext(CurrencyContext);

  const [couponCode, setCouponCode] = useState(appliedCoupon ? appliedCoupon.code : '');

  // 🟢 API Data States
  const [shippingOptions, setShippingOptions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [loadingShipping, setLoadingShipping] = useState(true);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // 🟢 Logged-in user
  const [user, setUser] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || '';

  // --- Load user from localStorage ---
  useEffect(() => {
    const authData = localStorage.getItem('auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setUser(parsed.userDetails);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // --- Fetch shipping options, settings, active coupons on mount ---
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoadingShipping(true);
        const [shippingRes, settingsRes, couponsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/shipping-options/list`),
          axios.get(`${API_BASE_URL}/settings/public`),
          axios.get(`${API_BASE_URL}/coupons/active`),
        ]);

        // Shipping options
        if (shippingRes.data.status) {
          const active = shippingRes.data.data.filter(o => o.isActive);
          setShippingOptions(active);
          // Auto-select first if none selected yet
          if (!appliedShipping && active.length > 0) {
            setAppliedShipping(active[0]);
          }
        }

        // Settings — public returns a single object (not array)
        if (settingsRes.data.status && settingsRes.data.data) {
          setSettings(settingsRes.data.data);
        }

        // Active coupons
        if (couponsRes.data.status) {
          setActiveCoupons(couponsRes.data.data);
        }
      } catch (error) {
        console.error('Cart fetch error:', error);
      } finally {
        setLoadingShipping(false);
      }
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL]);

  // --- Helpers ---
  const getShippingPrice = (option) => {
    if (!option) return 0;
    if (settings?.free_shipping_over > 0 && Number(cartTotal) >= settings.free_shipping_over) {
      return 0;
    }
    if (currency === 'EUR') return option.priceEur || 0;
    return option.priceUsd || 0;
  };

  // 🟢 Updated: Ye function ab USD aur INR dono values return karega
  // Taaki formatPrice context ise sahi ratio mein convert kar sake
  const getMembershipData = () => {
    if (!settings) return { usd: 0, inr: 0, eur: 0 };
    return {
      usd: settings.membership_cost || settings.membershipCartPrice || 0,
      inr: settings.membership_cart_price || settings.membershipCartPriceInr || 0,
      eur: settings.membership_cost_eur || settings.membershipCartPriceEur || 0,
    };
  };

  const freeShippingOver = settings ? (
    currency === 'EUR' ? (settings.freeShippingOverEur || 0)
    : (settings.freeShippingOver || settings.free_shipping_over || 0)
  ) : 0;

  // ─── 🟢 STEP 1: MNC DISCOUNT-SAFE CALCULATIONS (REPLACE LINE 114-124) ───

  // Total number of physical books (excludes gift cards — they don't ship)
  const totalBooks = cart.reduce((acc, item) => item.itemType === 'gift_card' ? acc : acc + item.quantity, 0);

  // 1. Original Base Totals (MNC logic ke liye zaroori hai)
  const originalBaseUSD = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const originalBaseINR = cart.reduce((acc, item) => acc + ((item.inrPrice ?? item.inr_price ?? 0) * item.quantity), 0);

  // 2. Har item ka Discounted Price (Jo aapne pehle banaya tha)
  const subtotalAfterItemDiscount = cart.reduce((acc, item) => {
    const itemRealPrice = item.realPrice ?? item.real_price ?? 0;
    const priceToUse = (itemRealPrice > 0) ? itemRealPrice : (item.price || 0);
    return acc + (Number(priceToUse) * item.quantity);
  }, 0);


  const subtotal = subtotalAfterItemDiscount; // Ye line add karein taaki coupon logic chale

  const getSelectedShippingRawPrice = () => {
    if (!appliedShipping) return 0;
    const usd = getTieredShippingUsd(appliedShipping.id || appliedShipping._id, totalBooks);
    if (currency === 'GBP') return usd * (exchangeRates?.GBP || 0.78);
    if (currency === 'EUR') return usd * (exchangeRates?.EUR || 0.92);
    return usd;
  };


  // 3. Display Variables
  // Yahan null ki jagah original totals bhejna zaroori hai
  const subtotalDisplayUI = formatPrice(originalBaseUSD, originalBaseINR, subtotalAfterItemDiscount);

  // Final Total (Abhi ke liye subtotal hi hai, jab tak tax/shipping adds na ho)
  const finalTotalUI = subtotalDisplayUI

  // 3. Membership Data (Sirf display ke liye)
  const mData = getMembershipData();
  const membershipPriceUI = membershipAdded ? formatPrice(mData.usd, mData.inr, mData.usd) : null;

  const couponDiscountUSD = (() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'fixed') return Number(appliedCoupon.discount) || 0;
    return Math.round((subtotal * (Number(appliedCoupon.discount) / 100)) * 100) / 100;
  })();

  // --- Handlers ---
  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
    toast.success('Item removed from cart');
  };

  const handleQuantityChange = (productId, newQty) => {
    const item = cart.find(i => (i.id || i._id) === productId);
    if (!item) return;
    const diff = newQty - item.quantity;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) updateQuantity(productId, 'inc');
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) updateQuantity(productId, 'dec');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    setApplyingCoupon(true);
    try {
      const code = couponCode.trim().toUpperCase();
      const found = activeCoupons.find(
        (c) => c.code.toUpperCase() === code
      );

      if (!found) {
        toast.error('Invalid or inactive coupon code');
        return;
      }

      // Validate: members_only
      if (found.members_only === 'active') {
        if (!user || user.membership !== 'active') {
          toast.error('This coupon is for members only');
          return;
        }
      }

      // Validate: minimum_buy
      if (found.minimum_buy && subtotal < found.minimum_buy) {
        toast.error(`Minimum order of ${formatPrice(found.minimum_buy)} required for this coupon`);
        return;
      }

      // Validate: date range
      const now = new Date();
      if (found.valid_from && new Date(found.valid_from) > now) {
        toast.error('This coupon is not yet valid');
        return;
      }
      if (found.valid_to && new Date(found.valid_to) < now) {
        toast.error('This coupon has expired');
        return;
      }

      const discountType = found.fix_amount === 'active' ? 'fixed' : 'pct';
      setAppliedCoupon({
        code: found.code,
        discount: found.amount,
        discountType,
        couponId: found._id,
      });
      toast.success('Coupon applied successfully!');
    } catch (error) {
      toast.error('Failed to validate coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const handleAddMembership = () => {
    setMembershipAdded(true);
    toast.success('Membership added to cart!');
  };

  const handleRemoveMembership = () => {
    setMembershipAdded(false);
    toast.success('Membership removed from cart');
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const getImageUrl = (image) => {
    if (!image) return 'https://placehold.co/80x110?text=No+Image';
    return image.startsWith('http') ? image : `${API_BASE_URL}${image}`;
  };

  // Render star rating
  const renderStars = (rating = 0) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={13}
            className={i <= rating ? 'text-accent fill-accent' : 'text-gray-300 fill-gray-200'}
          />
        ))}
      </div>
    );
  };

  // --- Empty cart ---
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50 pt-10 md:pt-16 lg:pt-24 w-full overflow-x-hidden">
        <div className="w-full  mx-auto px-3 pt-[90px] md:pt-[120px] lg:pt-[170px] text-center">
          <div className="bg-white rounded-lg p-12 border border-gray-200">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <ShoppingBag className="text-gray-400" size={48} />
            </div>
            <h2 className="text-2xl font-display font-bold text-text-main mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-500 mb-8">
              Looks like you haven't added any items to your cart yet
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded hover:bg-primary-dark transition-colors font-montserrat font-bold uppercase text-sm"
            >
              <ArrowLeft size={18} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 w-full overflow-x-hidden relative">


      <div className="w-full mx-auto px-3 sm:px-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
          {/* ─────────────────────────────── LEFT: CART ITEMS ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            <h1 className="text-2xl font-display font-bold text-text-main uppercase tracking-wide text-left mb-4 ">
              YOUR CART
            </h1>
            {/* Cart items card */}
            <div className="bg-cream-100 border border-gray-200 shadow-sm">


              <div className="divide-y divide-gray-100">
                {cart.map((item) => (
                  <div key={item.id || item._id} className="p-5">
                    {item.itemType === 'gift_card' ? (
                      /* ── Gift Card item ── */
                      <div className="flex gap-4">
                        <div className="shrink-0 w-20 h-28 rounded-lg bg-gradient-to-br from-primary via-primary to-secondary flex flex-col items-center justify-center shadow">
                          <span className="text-white font-display font-bold text-xs">BAGCHEE</span>
                          <span className="text-white text-[10px] mt-1 opacity-80">Gift Card</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-2 mb-2">
                            <p className="font-semibold text-text-main">{item.title}</p>
                            <p className="text-xl font-bold text-text-main shrink-0">${parseFloat(item.price).toFixed(2)}</p>
                          </div>
                          <p className="text-xs text-gray-500">To: <span className="font-medium text-text-main">{item.recipientName}</span> ({item.recipientEmail})</p>
                          <p className="text-xs text-gray-500">From: <span className="font-medium text-text-main">{item.senderName}</span></p>
                          {item.message && <p className="text-xs text-gray-400 italic mt-1">"{item.message}"</p>}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="mt-3 text-xs text-red-500 hover:text-red-700 transition-colors"
                          >Remove</button>
                        </div>
                      </div>
                    ) : (
                    <div className="flex gap-4">
                      {/* Book cover */}
                      <Link
                        to={`/books/${item.bagcheeId || item._id}/${item.slug || "book"}`}
                        className="shrink-0"
                      >
                        <img
                          src={getImageUrl(
                            item.defaultImage || item.default_image || item.related_images?.[0],
                          )}
                          alt={item.name || item.title}
                          className="w-20 h-28 object-cover border border-gray-200"
                          onError={(e) => {
                            e.target.src =
                              "https://placehold.co/80x110?text=No+Image";
                          }}
                        />
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/books/${item.bagcheeId || item._id}/${item.slug || "book"}`}
                              className="font-semibold text-text-main hover:text-primary transition-colors leading-snug block"
                            >
                              {item.name || item.title}
                            </Link>
                            {item.author && (
                              <p className="text-sm text-gray-500 mt-0.5">
                                by{" "}
                                {typeof item.author === "object"
                                  ? `${item.author.firstName || item.author.first_name || ""} ${item.author.lastName || item.author.last_name || ""}`.trim()
                                  : item.author}
                              </p>
                            )}
                          </div>
                          {/* Price top-right */}
                          <div className="text-right shrink-0">
                            <p className="text-xl font-bold text-text-main">
                              {formatPrice(
                                (item.price || 0) * item.quantity,
                                (item.inrPrice ?? item.inr_price ?? 0) * item.quantity,
                                ((item.realPrice ?? item.real_price ?? 0) > 0 ? (item.realPrice ?? item.real_price) : (item.price || 0)) * item.quantity
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="mb-3">
                          {renderStars(item.rating || 0)}
                        </div>

                        {/* Quantity dropdown + Actions */}
<div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 flex-wrap">
  <div className="flex items-center gap-2 shrink-0">
    <span className="text-[10px] font-bold text-text-muted uppercase font-montserrat">Qty:</span>
    <select
      value={item.quantity}
      onChange={(e) =>
        handleQuantityChange(
          item.id || item._id,
          parseInt(e.target.value, 10),
        )
      }
      className="border border-gray-200 rounded-md px-2 py-1 text-sm font-bold text-text-main bg-white focus:outline-none focus:border-primary cursor-pointer hover:border-gray-300 transition-colors"
    >
      {Array.from(
        { length: Math.min(item.stock || 10, 10) },
        (_, i) => i + 1,
      ).map((n) => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
  </div>
  <div className="flex flex-wrap items-center gap-2 ml-0 sm:ml-auto w-full sm:w-auto justify-start sm:justify-end">
    {/* REMOVE BUTTON: Styled with Red-50 bg and transition */}
    <button
      onClick={() => handleRemoveItem(item.id || item._id)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 text-[11px] font-bold uppercase font-montserrat group shadow-sm active:scale-95 whitespace-nowrap"
    >
      <X size={14} className="group-hover:rotate-90 transition-transform duration-300" />
      REMOVE
    </button>
    {/* SAVE FOR LATER: Styled with subtle Blue/Primary theme */}
    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-primary hover:bg-primary hover:text-white transition-all duration-300 text-[11px] font-bold uppercase font-montserrat shadow-sm active:scale-95 whitespace-nowrap">
      <Award size={14} />
      SAVE FOR LATER
    </button>
  </div>
</div>
                      </div>
                    </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── MEMBERSHIP ROW ─── */}
            {/* Show only if logged in and membership is not already active */}
            {user && user.membership !== "active" && settings && (
              <div className="bg-cream-100 border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
                  {/* Membership badge */}
                  <div className="bg-primary text-white text-[10px] font-bold uppercase px-3 py-2 font-montserrat tracking-wider shrink-0 self-start sm:self-auto">
                    MEMBERSHIP
                  </div>

                  {/* Radio + description */}
                  <label className="flex items-center gap-2 cursor-pointer sm:flex-1 min-w-0">
                    <input
                      type="radio"
                      name="membership"
                      checked={membershipAdded}
                      onChange={() => !membershipAdded && handleAddMembership()}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary shrink-0"
                    />
                    <span className="text-sm text-text-main">
                      Become a member and save {settings?.member_discount || settings?.memberDiscount || 10}% now
                    </span>
                  </label>

                  {/* Price + button row on mobile */}
                  <div className="flex items-center justify-between w-full sm:contents gap-3">
                    {/* Price */}

                    <span className="text-xl font-bold text-text-main">
                      {formatPrice(mData.usd, mData.inr, mData.usd)}
                    </span>

                    {/* Add/Remove button */}
                    {membershipAdded ? (
                      <button
                        onClick={handleRemoveMembership}
                        className="bg-gray-200 text-gray-700 text-xs font-bold uppercase px-5 py-2 hover:bg-gray-300 transition-colors font-montserrat shrink-0"
                      >
                        REMOVE
                      </button>
                    ) : (
                      <button
                        onClick={handleAddMembership}
                        className="bg-primary text-white text-xs font-bold uppercase px-5 py-2 hover:bg-primary-dark transition-colors font-montserrat shrink-0"
                      >
                        ADD TO CART
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─────────────────────────────── RIGHT: YOUR ORDER ─────────────────────────────── */}
          <div className="lg:col-span-1">
            {/* YOUR ORDER heading — outside the card, matching reference */}
            <div className="h-[32px] mb-4 invisible lg:block hidden"></div>

            <div className="bg-cream-100 border border-gray-200 shadow-sm">
              <div className="p-5 space-y-5">

                {/* ─── FREE SHIPPING PROGRESS BAR ─── */}
                {freeShippingOver > 0 && (() => {
                  const progress = Math.min(100, (subtotal / freeShippingOver) * 100);
                  const remaining = Math.max(0, freeShippingOver - subtotal);
                  const unlocked = subtotal >= freeShippingOver;
                  return (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2.5">
                      <p className="text-xs font-bold text-center text-gray-600">
                        Free delivery on orders over{' '}
                        <span className="text-primary font-black">{formatPrice(freeShippingOver)}</span>
                      </p>
                      {/* Progress bar */}
                      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            background: unlocked
                              ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                              : 'linear-gradient(90deg, #a78bfa, #7c3aed)',
                          }}
                        />
                      </div>
                      {/* Message */}
                      <p className="text-[11px] text-center text-gray-500">
                        {unlocked ? (
                          <span className="text-green-600 font-black">🎉 You've unlocked free shipping!</span>
                        ) : (
                          <>
                            Add at least{' '}
                            <span className="text-primary font-black">{formatPrice(remaining)}</span>
                            {' '}more to get free shipping!
                          </>
                        )}
                      </p>
                    </div>
                  );
                })()}

                {/* Cart total line */}
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-600">
                    Cart total {cart.length}
                  </span>
                  <span className="text-xl font-bold text-text-main">
                    {/* Aapka naya variable 'subtotalAfterItemDiscount' use kar rahe hain */}
                    {subtotalDisplayUI}
                  </span>
                </div>

                {/* ─── PROMOTION CODE ─── */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-bold text-primary text-center mb-3">
                    Use a promotion Code
                  </p>
                  {!appliedCoupon ? (
                    <div className="flex gap-0">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        placeholder="Enter promo code"
                        className="flex-1 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon}
                        className="bg-primary text-white px-5 py-2 text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-70 font-montserrat uppercase"
                      >
                        {applyingCoupon ? "..." : "Apply"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2">
                        <Tag className="text-green-600 shrink-0" size={16} />
                        <span className="text-sm font-bold text-green-800">
                          {appliedCoupon.code} (
                          {appliedCoupon.discountType === "fixed"
                            ? formatPrice(appliedCoupon.discount)
                            : `${appliedCoupon.discount}% off`}
                          )
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-green-600 hover:text-green-800 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

{/* ─── SHIPPING OPTIONS SECTION ─── */}
<div className="space-y-2">
  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-1">
    <Truck size={13} /> Shipping ({totalBooks} {totalBooks === 1 ? 'book' : 'books'})
  </p>
  {shippingOptions.map((option) => {
    const optId = option.id || option._id;
    const tieredUsd = getTieredShippingUsd(optId, totalBooks);
    const isSelected = (appliedShipping?.id || appliedShipping?._id) === optId;

    let displayPrice;
    if (currency === 'EUR') displayPrice = `€${(tieredUsd * (exchangeRates?.EUR || 0.92)).toFixed(2)}`;
    else if (currency === 'GBP') displayPrice = `£${(tieredUsd * (exchangeRates?.GBP || 0.78)).toFixed(2)}`;
    else if (currency === 'USD') displayPrice = `$${tieredUsd.toFixed(2)}`;
    else displayPrice = `${symbols?.[currency] || ''}${(tieredUsd * (exchangeRates?.[currency] || 1)).toFixed(2)}`;

    return (
      <label key={optId} className={`flex items-start justify-between p-3 cursor-pointer rounded border transition-colors ${isSelected ? 'bg-primary/5 border-primary/30' : 'border-gray-100 hover:border-gray-200'}`}>
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <input
            type="radio"
            name="shipping"
            checked={isSelected}
            onChange={() => setAppliedShipping(option)}
            className="w-4 h-4 text-primary mt-1 shrink-0"
          />
          <div className='min-w-0 flex-1'>
            <span className="text-sm font-semibold text-text-main block truncate sm:whitespace-normal">{option.title}</span>
            {tieredUsd === 0 && <span className="text-[10px] text-green-600 font-bold">FREE</span>}
          </div>
        </div>
        <span className="text-sm font-bold text-primary shrink-0 ml-2">
          {tieredUsd === 0 ? 'Free' : displayPrice}
        </span>
      </label>
    );
  })}
</div>

                {/* ─── TOTALS ─── */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  {membershipAdded && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Membership</span>
                      <span className="font-medium text-text-main">
                        {membershipPriceUI}
                      </span>
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">
                        Discount ({appliedCoupon.code})
                      </span>
                      <span className="font-medium text-green-600">
                        -{formatPrice(couponDiscountUSD, null, couponDiscountUSD)}
                      </span>
                    </div>
                  )}

                  {/* Shipping line */}
                  {appliedShipping && (() => {
                    const shippingUsd = getTieredShippingUsd(appliedShipping.id || appliedShipping._id, totalBooks);
                    return (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium text-text-main">
                          {shippingUsd === 0 ? 'Free' : formatPrice(shippingUsd, null, shippingUsd)}
                        </span>
                      </div>
                    );
                  })()}

                  <div className="flex justify-between items-baseline pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">
                      Total (tax incl.)
                    </span>
                    <span className="text-2xl font-bold text-text-main">
                      {(() => {
                        const shippingUsd = getTieredShippingUsd(appliedShipping?.id || appliedShipping?._id, totalBooks);
                        const baseUsd = subtotalAfterItemDiscount;
                        const membershipUsd = membershipAdded ? (mData.usd || 0) : 0;
                        const totalUsd = baseUsd + shippingUsd + membershipUsd;
                        const totalInr = originalBaseINR + (shippingUsd * (exchangeRates?.INR || 83)) + (membershipAdded ? (mData.inr || 0) : 0);
                        return formatPrice(totalUsd, totalInr, totalUsd);
                      })()}
                    </span>
                  </div>
                </div>

                {/* ─── PROCEED TO CHECKOUT ─── */}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-primary text-white py-3 font-bold text-sm uppercase tracking-wider hover:bg-primary-dark transition-colors font-montserrat"
                >
                  PROCEED TO CHECKOUT
                </button>
              </div>
            </div>

            {/* 100% Secure Payment — outside/below the card, matching reference */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-2 flex items-center justify-center gap-1.5 flex-wrap px-2">
                <span>🔒</span> 100% Secure Payment
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="h-7 w-11 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden shadow-sm">
                  <img
                    src={visaImg}
                    alt="Visa"
                    className="h-3.5 object-contain"
                  />
                </div>
                <div className="h-7 w-11 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden shadow-sm">
                  <img
                    src={mastercardImg}
                    alt="Mastercard"
                    className="h-3.5 object-contain"
                  />
                </div>
                <div className="h-7 w-11 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden shadow-sm">
                  <img
                    src={discoverImg}
                    alt="Discover"
                    className="h-3.5 object-contain"
                  />
                </div>
                <div className="h-7 w-11 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden shadow-sm">
                  <img
                    src={amexImg}
                    alt="Amex"
                    className="h-3.5 object-contain"
                  />
                </div>
                <div className="h-7 w-11 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden shadow-sm">
                  <img
                    src={paypalImg}
                    alt="PayPal"
                    className="h-3.5 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Cart;
