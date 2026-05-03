import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from '@tanstack/react-query';
import { encryptData } from '../../utils/encryption.js';
import { createSafeHtml } from '../../utils/sanitize';

import {
  CheckCircle,
  ShoppingBag,
  Plus,
  X,
  Tag,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Home,
  Briefcase,
  Check,
  CreditCard,
  Award, ShoppingCart
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { CurrencyContext } from "../../context/CurrencyContext";
import axios from "../../utils/axiosConfig";
import toast from "react-hot-toast";

import logoImg from "../../assets/images/common/logo.png";
import visaLogo from "../../assets/images/website/payments/Visa.svg";
import mastercardLogo from "../../assets/images/website/payments/MasterCard.svg";
import discoverLogo from "../../assets/images/website/payments/Discover.png";
import amexLogo from "../../assets/images/website/payments/american.png";
import paypalLogo from "../../assets/images/website/payments/PayPal.svg";

const SHIPPING_TIERS = {
  6: [ // Express (3-5 Business Days)
    { min: 1, max: 2, usd: 50 },
    { min: 3, max: 6, usd: 80 },
    { min: 7, max: 11, usd: 110 },
    { min: 12, max: 15, usd: 150 },
    { min: 16, max: 20, usd: 200 },
    { min: 21, max: 25, usd: 280 },
    { min: 26, max: 36, usd: 350 },
    { min: 37, max: 50, usd: 435 },
    { min: 51, max: 100, usd: 550 },
    { min: 101, max: Infinity, usd: 730 },
  ],
  5: [ // Expedited (8-12 Business Days)
    { min: 1, max: 2, usd: 20 },
    { min: 3, max: 6, usd: 35 },
    { min: 7, max: 11, usd: 50 },
    { min: 12, max: 15, usd: 80 },
    { min: 16, max: 20, usd: 120 },
    { min: 21, max: 25, usd: 150 },
    { min: 26, max: 36, usd: 175 },
    { min: 37, max: 50, usd: 222 },
    { min: 51, max: 100, usd: 280 },
    { min: 101, max: Infinity, usd: 400 },
  ],
};

const getTieredShippingUsd = (shippingId, totalBooks) => {
  const tiers = SHIPPING_TIERS[shippingId];
  if (!tiers || totalBooks === 0) return 0;
  const tier = tiers.find(t => totalBooks >= t.min && totalBooks <= t.max);
  return tier ? tier.usd : tiers[tiers.length - 1].usd;
};

const Checkout = () => {
  const navigate = useNavigate();
  const {
    cart,
    cartTotal,
    clearCart,
    appliedCoupon,
    setAppliedCoupon,
    appliedShipping,
    setAppliedShipping,
    membershipAdded,
  } = useCart();
  const { currency, formatPrice, formatPriceFixed, symbols, exchangeRates } = useContext(CurrencyContext);

  // ─── Auth / User ───
  const [user, setUser] = useState(null);

  // ─── Saved addresses (logged-in) ───
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState(null);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddressId, setEditAddressId] = useState(null);


  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");


  const [newAddress, setNewAddress] = useState({
    type: "Home",
    name: "",
    houseNo: "",
    street: "",
    landmark: "",
    address2: "",
    company: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    phone: "",
  });

  // ─── Guest address form ───
  const [guestAddress, setGuestAddress] = useState({
    email: "",
    country: "India",
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    company: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
  });

  // ─── Billing address mode for guest ───
  const [guestBillingSame, setGuestBillingSame] = useState(true);
  const [guestBilling, setGuestBilling] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    company: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: "",
  });

  // ─── Billing address modal ───
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [editBillingId, setEditBillingId] = useState(null);
  const [newBillingAddress, setNewBillingAddress] = useState({
    type: "Home",
    name: "",
    houseNo: "",
    street: "",
    landmark: "",
    address2: "",
    company: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    phone: "",
  });

  // ─── Payment methods (dynamic) ───
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loadingPayments, setLoadingPayments] = useState(true);



  // ─── Shipping options ───
  const [shippingOptions, setShippingOptions] = useState([]);
  const [loadingShipping, setLoadingShipping] = useState(true);

  // ─── Promo code (synced with CartContext) ───
  const [promoInput, setPromoInput] = useState(
    appliedCoupon ? appliedCoupon.code : "",
  );
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // ─── Gift card ───
  const [giftCardInput, setGiftCardInput] = useState('');
  const [applyingGiftCard, setApplyingGiftCard] = useState(false);
  const [appliedGiftCard, setAppliedGiftCard] = useState(null); // { code, balance }
  const [giftCardWalletBalance, setGiftCardWalletBalance] = useState(0);
  const [useWalletBalance, setUseWalletBalance] = useState(false);

  // ─── Account optional ───
  const [createAccount, setCreateAccount] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountRepeatPassword, setAccountRepeatPassword] = useState("");

  // ─── Order ───
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const [membershipPrice, setMembershipPrice] = useState(0);


  const [settings, setSettings] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "";

  // ─── Load Razorpay SDK ───
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // ─── COD detection ───
  const isCOD = (payment) => {
    if (!payment) return false;
    const t = payment.title?.toLowerCase() || '';
    return t.includes('cash') || t.includes('cod') || t.includes('pay on delivery');
  };

  // ─── Country list ───
  const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia",
    "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus",
    "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil",
    "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde",
    "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
    "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
    "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia",
    "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada",
    "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India",
    "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan",
    "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya",
    "Liechtenstein", "Lithuania", "Luxembourg", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives",
    "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
    "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands",
    "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "Norway", "Oman", "Pakistan", "Palau",
    "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
    "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent", "Samoa", "San Marino",
    "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
    "Solomon Islands", "Somalia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sudan", "Suriname",
    "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo",
    "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
    "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu",
    "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
  ];

  // ─── Load user — redirect to login if not authenticated ───
  useEffect(() => {
    const authData = localStorage.getItem("auth");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setUser(parsed.userDetails);
        // Pre-fill guest email if logged in
        if (parsed.userDetails?.email) {
          setAccountEmail(parsed.userDetails.email);
          setGuestAddress((prev) => ({
            ...prev,
            email: parsed.userDetails.email,
          }));
        }
      } catch (e) {
        /* ignore */
      }
    }
  }, [navigate]);

  // ─── Load saved addresses + gift card wallet balance ───
  useEffect(() => {
    if (user?.id) {
      fetchAddresses(user.id);
      axios.get(`${process.env.REACT_APP_API_URL}/gift-cards/my-balance`)
        .then(r => { if (r.data.status) setGiftCardWalletBalance(r.data.balance || 0); })
        .catch(() => { });
    }
  }, [user]);

  // ─── Fetch payment methods, shipping options, active coupons ───
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingPayments(true);
        setLoadingShipping(true);

        const [payRes, shipRes, couponRes, settingsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/payments/list`),
          axios.get(`${API_BASE_URL}/shipping-options/list`),
          axios.get(`${API_BASE_URL}/coupons/active`),
          axios.get(`${API_BASE_URL}/settings/public`),
        ]);


        if (settingsRes.data.status && settingsRes.data.data) {
          const s = settingsRes.data.data;
          setSettings(s);
          const mPrice = Number(s.membershipCartPrice) || 35;
          setMembershipPrice(mPrice);
        }

        // Payment methods
        if (payRes.data.status) {
          const active = payRes.data.data.filter((p) => p.active || p.isActive);
          setPaymentMethods(active);
          if (active.length > 0) setSelectedPayment(active[0]);
        }

        // Shipping options
        if (shipRes.data.status) {
          const active = shipRes.data.data.filter((o) => o.active || o.isActive);
          setShippingOptions(active);
          // If cart has appliedShipping, validate it still exists; else default to first
          if (!appliedShipping && active.length > 0) {
            setAppliedShipping(active[0]);
          }
        }

        // Coupons — filter client-side (active endpoint omits required fields)
        if (couponRes.data.status) {
          setActiveCoupons(couponRes.data.data || []);
        }
      } catch (err) {
        console.error("Checkout data fetch error:", err);
      } finally {
        setLoadingPayments(false);
        setLoadingShipping(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL]);

  // ─── Helpers ───
  const totalBooks = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);

  // Max ship-preparation days across all physical cart items
  const maxShipDays = cart
    .filter(i => i.itemType !== 'gift_card')
    .reduce((max, item) => {
      const d = parseInt(item.shipDays ?? item.ship_days ?? 0) || 0;
      return d > max ? d : max;
    }, 0);

  const getShippingPrice = (option) => {
    if (!option) return 0;
    const optId = option.id || option._id;
    const usd = getTieredShippingUsd(optId, totalBooks);
    if (currency === 'EUR') return usd * (exchangeRates?.EUR || 0.92);
    if (currency === 'GBP') return usd * (exchangeRates?.GBP || 0.78);
    return usd;
  };

  // ─── 🟢 STEP 1: RAW PRODUCT SUBTOTAL (Discounted) ───
  const subtotalAfterItemDiscountUSD = cart.reduce((acc, item) => {
    const rp = item.realPrice || item.real_price;
    const p = (rp && rp > 0) ? rp : (item.price || 0);
    return acc + (Number(p) * item.quantity);
  }, 0);



  const originalBaseUSD = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const subtotal = useMemo(() => {
    if (currency === 'USD') return subtotalAfterItemDiscountUSD;
    if (currency === 'GBP') return subtotalAfterItemDiscountUSD * (exchangeRates?.GBP || 0.78);
    if (currency === 'EUR') return subtotalAfterItemDiscountUSD * (exchangeRates?.EUR || 0.92);
    return subtotalAfterItemDiscountUSD * (exchangeRates?.[currency] || 1);
  }, [currency, exchangeRates, subtotalAfterItemDiscountUSD]);

  // ─── 🟢 STEP 2: DYNAMIC MEMBERSHIP COST (Fixed - No Ratio) ───
  const currentMembershipCost = useMemo(() => {
    if (!membershipAdded || !settings) return 0;
    if (currency === 'EUR') return Number(settings.membership_cost_eur) || 31;
    if (currency === 'GBP') return (Number(settings.membership_cost) || 35) * (exchangeRates?.GBP || 0.78);
    return Number(settings.membership_cost) || 35;
  }, [membershipAdded, settings, currency, exchangeRates]);

  // ─── 🟢 STEP 3: SHIPPING COST (Tiered by book count) ───
  const shippingCost = useMemo(() => {
    if (!appliedShipping) return 0;
    const optId = appliedShipping.id || appliedShipping._id;
    const usd = getTieredShippingUsd(optId, totalBooks);
    if (currency === 'EUR') return usd * (exchangeRates?.EUR || 0.92);
    if (currency === 'GBP') return usd * (exchangeRates?.GBP || 0.78);
    return usd;
  }, [appliedShipping, totalBooks, currency, exchangeRates]);

  // 6. Member Discount (11% Logic)
  const memberDiscountPercent = Number(settings?.member_discount) || 11;
  const memberDiscount = membershipAdded ? Math.round((subtotal + currentMembershipCost) * (memberDiscountPercent / 100) * 100) / 100 : 0;

  let couponDiscount = 0;
  if (appliedCoupon) {
    couponDiscount = Number(appliedCoupon.discount) || 0;
  }

  // Gift card code discount (capped at order total)
  const giftCardDiscount = appliedGiftCard
    ? Math.min(appliedGiftCard.balance, subtotal + currentMembershipCost - memberDiscount - couponDiscount + shippingCost)
    : 0;

  // Wallet balance deduction
  const walletDeduction = useWalletBalance && giftCardWalletBalance > 0
    ? Math.min(giftCardWalletBalance, Math.max(0, subtotal + currentMembershipCost - memberDiscount - couponDiscount - giftCardDiscount + shippingCost))
    : 0;

  // 🏆 GRAND TOTAL
  const total = Math.max(0, (subtotal + currentMembershipCost - memberDiscount - couponDiscount - giftCardDiscount - walletDeduction) + shippingCost);

  // ─── Payment method type helpers ───
  const isCreditCardMethod = (method) =>
    (method?.title || '').toLowerCase().includes('credit card');

  const isWireTransferMethod = (method) => {
    const t = (method?.title || '').toLowerCase();
    return t.includes('wire') || t.includes('bank transfer') || t.includes('western union');
  };

  const isPurchaseOrderMethod = (method) => {
    const t = (method?.title || '').toLowerCase();
    return t.includes('purchase order');
  };

  const isPayPalMethod = (method) =>
    (method?.title || '').toLowerCase().includes('paypal');

  const isCardOrPayPalMethod = (method) => {
    const t = (method?.title || '').toLowerCase();
    return t.includes('credit card') || t.includes('paypal') || t.includes('debit card') || t.includes('debit');
  };

  // Is this a deferred flow (no immediate gateway) for the current user?
  const isDeferredFlow = () => {
    if (!isCardOrPayPalMethod(selectedPayment)) return false;
    const mode = settings?.paymentGatewayMode || settings?.payment_gateway_mode || 'deferred';
    const auth = (() => { try { return JSON.parse(localStorage.getItem('auth') || '{}'); } catch { return {}; } })();
    const forcesDirect = auth?.userDetails?.forceDirectPayment === true;
    return mode === 'deferred' && !forcesDirect;
  };

  // When cart has ONLY gift cards: restrict payment to PayPal/credit card, hide redeem box
  const hasOnlyGiftCards = cart.length > 0 && cart.every(i => i.itemType === 'gift_card');
  const visiblePaymentMethods = hasOnlyGiftCards
    ? paymentMethods.filter(m => isCardOrPayPalMethod(m))
    : paymentMethods;

  // UI Display Helper (Symbols ke saath)
  const formatCheckoutDisplay = (val) => {
    const symbol = symbols?.[currency] || '';
    return `${symbol}${val.toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    })}`;
  };

  // ─── Address functions ───
  const fetchAddresses = async (userId) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/user/get-addresses?userId=${userId}`,
      );
      if (res.data?.addresses) {
        setAddresses(res.data.addresses);
        if (res.data.addresses.length > 0) {
          setSelectedAddress(res.data.addresses[0]);
          setSelectedBillingAddress(res.data.addresses[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to save address");
      return;
    }
    const { name, phone, houseNo, city, state, pincode } = newAddress;
    if (!name || !phone || !houseNo || !city || !state || !pincode) {
      toast.error("Please fill all required fields");
      return;
    }
    setSavingAddress(true);
    try {
      if (isEditingAddress && editAddressId) {
        await axios.post(`${API_BASE_URL}/user/delete-address`, {
          userId: user.id,
          addressId: editAddressId,
        });
      }
      // Split full name into firstName and lastName
      const nameParts = newAddress.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const res = await axios.post(`${API_BASE_URL}/user/add-address`, {
        userId: user.id,
        ...newAddress,
        firstName,
        lastName,
      });
      if (res.data?.status) {
        toast.success(
          isEditingAddress
            ? "Address updated successfully!"
            : "Address saved successfully",
        );
        setShowAddressModal(false);
        setIsEditingAddress(false);
        setEditAddressId(null);
        setNewAddress({
          type: "Home",
          name: "",
          houseNo: "",
          street: "",
          landmark: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
          phone: "",
        });
        fetchAddresses(user.id);
      } else {
        toast.error(res.data?.msg || "Failed to save address");
      }
    } catch (err) {
      toast.error("Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleEditAddress = (addr) => {
    setNewAddress({
      ...addr,
      name: addr.firstName && addr.lastName
        ? `${addr.firstName} ${addr.lastName}`
        : addr.firstName || addr.lastName || `${addr.city || ""} Address` || "Address"
    });
    setIsEditingAddress(true);
    setEditAddressId(addr.id);
    setShowAddressModal(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;
    try {
      const res = await axios.post(`${API_BASE_URL}/user/delete-address`, {
        userId: user.id,
        addressId,
      });
      if (res.data?.status) {
        toast.success("Address deleted successfully");
        fetchAddresses(user.id);
      } else {
        toast.error("Failed to delete address");
      }
    } catch (err) {
      toast.error("Failed to delete address");
    }
  };

  const handleSaveBillingAddress = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to save address");
      return;
    }
    const { name, phone, houseNo, city, state, pincode } = newBillingAddress;
    if (!name || !phone || !houseNo || !city || !state || !pincode) {
      toast.error("Please fill all required fields");
      return;
    }
    setSavingAddress(true);
    try {
      if (isEditingBilling && editBillingId) {
        await axios.post(`${API_BASE_URL}/user/delete-address`, {
          userId: user.id,
          addressId: editBillingId,
        });
      }
      // Split full name into firstName and lastName
      const nameParts = newBillingAddress.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const res = await axios.post(`${API_BASE_URL}/user/add-address`, {
        userId: user.id,
        ...newBillingAddress,
        firstName,
        lastName,
      });
      if (res.data?.status) {
        toast.success(
          isEditingBilling
            ? "Address updated successfully!"
            : "Address saved successfully",
        );
        setShowBillingModal(false);
        setIsEditingBilling(false);
        setEditBillingId(null);
        setNewBillingAddress({
          type: "Home",
          name: "",
          houseNo: "",
          street: "",
          landmark: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
          phone: "",
        });
        fetchAddresses(user.id);
      } else {
        toast.error(res.data?.msg || "Failed to save address");
      }
    } catch (err) {
      toast.error("Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleEditBillingAddress = (addr) => {
    setNewBillingAddress({
      ...addr,
      name: addr.firstName && addr.lastName
        ? `${addr.firstName} ${addr.lastName}`
        : addr.firstName || addr.lastName || `${addr.city || ""} Address` || "Address"
    });
    setIsEditingBilling(true);
    setEditBillingId(addr.id);
    setShowBillingModal(true);
  };

  const handleDeleteBillingAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;
    try {
      const res = await axios.post(`${API_BASE_URL}/user/delete-address`, {
        userId: user.id,
        addressId,
      });
      if (res.data?.status) {
        toast.success("Address deleted successfully");
        fetchAddresses(user.id);
      } else {
        toast.error("Failed to delete address");
      }
    } catch (err) {
      toast.error("Failed to delete address");
    }
  };

  // ─── Gift card handlers ───
  const handleApplyGiftCard = async () => {
    if (!giftCardInput.trim()) return toast.error("Please enter a gift card code");
    setApplyingGiftCard(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/gift-cards/validate`, { code: giftCardInput.trim().toUpperCase() });
      if (!res.data?.status) { toast.error(res.data?.msg || "Invalid gift card"); return; }
      setAppliedGiftCard({ code: res.data.code, balance: res.data.balance });
      toast.success(`Gift card applied! Balance: $${res.data.balance.toFixed(2)}`);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Invalid gift card code");
    } finally {
      setApplyingGiftCard(false);
    }
  };

  // ─── Coupon handlers ───
  const handleApplyCoupon = async () => {
    if (!promoInput.trim()) {
      toast.error("Please enter a promo code");
      return;
    }
    setApplyingCoupon(true);
    try {
      const code = promoInput.trim().toUpperCase();
      const cartItems = cart.map((i) => ({
        price: Number(i.price) || 0,
        quantity: Number(i.quantity) || 1,
      }));
      const res = await axios.post(`${API_BASE_URL}/coupons/apply`, {
        code,
        cartTotal: subtotal,
        cartItems,
      });
      if (!res.data?.status) {
        toast.error(res.data?.msg || "Invalid promo code");
        return;
      }
      const data = res.data.data;
      // Members-only gate (server already checks, but surface friendly message)
      if (data.membersOnly && (!user || user.membership !== "active")) {
        toast.error("This coupon is for members only");
        return;
      }
      setAppliedCoupon({
        code: data.code,
        discount: data.discount,   // pre-calculated dollar amount
        discountType: "fixed",     // always use pre-calculated value
        couponId: data.couponId,
        couponType: data.couponType,
      });
      toast.success("Promo code applied!");
    } catch (err) {
      const msg = err.response?.data?.msg || "Failed to validate promo code";
      toast.error(msg);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setPromoInput("");
    toast.success("Promo code removed");
  };

  // ─── Place order ───
  const handlePlaceOrder = async () => {
    // Validation
    if (user) {
      if (!selectedAddress && !hasOnlyGiftCards) {
        toast.error("Please select a delivery address");
        return;
      }
      if (!sameAsShipping && !selectedBillingAddress && !hasOnlyGiftCards) {
        toast.error("Please select a billing address");
        return;
      }
    } else {
      const {
        email,
        firstName,
        lastName,
        address1,
        city,
        state,
        postalCode,
        phone,
      } = guestAddress;
      if (
        !email ||
        !firstName ||
        !address1 ||
        !city ||
        !state ||
        !postalCode ||
        !phone
      ) {
        toast.error("Please fill all required delivery fields");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error("Please enter a valid email address");
        return;
      }
      if (!/^\+?[\d\s\-()]{7,20}$/.test(phone)) {
        toast.error("Please enter a valid phone number");
        return;
      }
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!selectedPayment) {
      toast.error("Please select a payment method");
      return;
    }

    // Create account check — only validate if user filled in account fields
    if (!user && accountPassword) {
      if (accountPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (accountPassword !== accountRepeatPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    setLoading(true);
    try {
      // Build shipping_details
      let shippingDetails;
      if (user && selectedAddress) {
        const addr = selectedAddress;
        const addrFirst = addr.firstName || addr.name?.split(" ")[0] || "";
        const addrLast = addr.lastName || addr.name?.split(" ").slice(1).join(" ") || "";
        shippingDetails = {
          email: user.email || "",
          firstName: addrFirst,
          lastName: addrLast,
          address1:
            addr.houseNo && addr.street
              ? `${addr.houseNo}, ${addr.street}`
              : addr.houseNo || addr.street || "",
          address2: addr.address2 || "",
          company: addr.company || "",
          country: addr.country || "",
          state: addr.state || "",
          city: addr.city || "",
          postcode: addr.pincode || "",
          phone: addr.phone || "",
        };
      } else {
        shippingDetails = {
          email: guestAddress.email,
          firstName: guestAddress.firstName,
          lastName: guestAddress.lastName,
          address1: guestAddress.address1,
          address2: guestAddress.address2 || "",
          company: guestAddress.company || "",
          country: guestAddress.country,
          state: guestAddress.state,
          city: guestAddress.city,
          postcode: guestAddress.postalCode,
          phone: guestAddress.phone,
        };
      }

      // Build billing_details
      let billingDetails;
      if (user) {
        const bAddr = sameAsShipping ? selectedAddress : selectedBillingAddress;
        const bFirst = bAddr.firstName || bAddr.name?.split(" ")[0] || "";
        const bLast = bAddr.lastName || bAddr.name?.split(" ").slice(1).join(" ") || "";
        billingDetails = {
          firstName: bFirst,
          lastName: bLast,
          address1:
            bAddr.houseNo && bAddr.street
              ? `${bAddr.houseNo}, ${bAddr.street}`
              : bAddr.houseNo || bAddr.street || "",
          address2: bAddr.address2 || "",
          company: bAddr.company || "",
          country: bAddr.country || "",
          state: bAddr.state || "",
          city: bAddr.city || "",
          postcode: bAddr.pincode || "",
          phone: bAddr.phone || "",
        };
      } else if (guestBillingSame) {
        billingDetails = {
          firstName: guestAddress.firstName,
          lastName: guestAddress.lastName,
          address1: guestAddress.address1,
          address2: guestAddress.address2 || "",
          company: guestAddress.company || "",
          country: guestAddress.country,
          state: guestAddress.state,
          city: guestAddress.city,
          postcode: guestAddress.postalCode,
          phone: guestAddress.phone,
        };
      } else {
        billingDetails = {
          firstName: guestBilling.firstName,
          lastName: guestBilling.lastName,
          address1: guestBilling.address1,
          address2: guestBilling.address2 || "",
          company: guestBilling.company || "",
          country: guestBilling.country,
          state: guestBilling.state,
          city: guestBilling.city,
          postcode: guestBilling.postalCode,
          phone: guestBilling.phone,
        };
      }

      const isLoggedInMember = user && user.membership === "active";
      const paymentTitle = selectedPayment?.title || "Online Payment";

      const physicalItems = cart.filter(i => i.itemType !== 'gift_card');
      const giftCardCartItems = cart.filter(i => i.itemType === 'gift_card');

      const orderData = {
        customer_id: user?.id || null,
        products: physicalItems.map((item) => ({
          product_id: parseInt(item.id || item._id) || null,
          name: item.name || item.title || "Book",
          price: item.price || 0,
          quantity: item.quantity || 1,
          status: "Pending",
          courier: "",
          tracking_id: "",
          return_note: "",
          cancel_note: "",
        })),
        giftCardItems: giftCardCartItems.map(item => ({
          amount: item.price,
          recipientEmail: item.recipientEmail,
          recipientName: item.recipientName,
          senderName: item.senderName,
          message: item.message || '',
        })),
        giftCardWalletApplied: walletDeduction,
        total: total,
        shipping_cost: shippingCost,
        currency: currency,
        payment_type: paymentTitle,
        shipping_type: appliedShipping?.title || "Standard Shipping",
        payment_status: "Pending",
        transaction_id: "",
        membership: isLoggedInMember ? "Yes" : "No",
        membership_discount: isLoggedInMember ? 10 : 0,
        coupon_id: appliedCoupon?.couponId || null,
        shipping_details: shippingDetails,
        billing_details: billingDetails,
        comment: orderNotes,
        ...(isPurchaseOrderMethod(selectedPayment) && { purchaseOrderNumber }),
      };

      const res = await axios.post(`${API_BASE_URL}/orders/save`, orderData);

      if (res.data?.status !== true) {
        toast.error(res.data?.msg || "Failed to place order");
        setLoading(false);
        return;
      }

      const savedOrder = res.data.data;

      // Build bank details to pass to receipt for wire transfer
      const bankDetails = settings?.bankDetails || null;

      // ─── COD: no payment gateway needed ───
      if (isCOD(selectedPayment)) {
        toast.success("Order placed successfully!");
        clearCart();
        setLoading(false);
        navigate("/order-receipt", { state: { orderDetails: savedOrder, bankDetails }, replace: true });
        return;
      }

      // ─── Wire Transfer: show bank details on receipt ───
      if (isWireTransferMethod(selectedPayment)) {
        toast.success("Order placed! Please transfer funds using the bank details shown.");
        clearCart();
        setLoading(false);
        navigate("/order-receipt", { state: { orderDetails: savedOrder, bankDetails }, replace: true });
        return;
      }

      // ─── Purchase Order: straight to receipt ───
      if (isPurchaseOrderMethod(selectedPayment)) {
        toast.success("Order placed successfully!");
        clearCart();
        setLoading(false);
        navigate("/order-receipt", { state: { orderDetails: savedOrder, bankDetails }, replace: true });
        return;
      }

      // ─── CC/PayPal Deferred: admin reviews first, no gateway now ───
      if (isDeferredFlow()) {
        toast.success("Order received! Our team will review it shortly.");
        clearCart();
        setLoading(false);
        navigate("/order-receipt", { state: { orderDetails: savedOrder, bankDetails }, replace: true });
        return;
      }

      // ─── CC/PayPal Direct: Razorpay ───
      const rzpRes = await axios.post(`${API_BASE_URL}/razorpay/create-order`, {
        orderId: savedOrder.id,
      });

      if (!rzpRes.data?.status) {
        toast.error(rzpRes.data?.msg || "Failed to initiate payment");
        setLoading(false);
        return;
      }

      const { razorpayOrderId, amount, currency: rzpCurrency } = rzpRes.data.data;

      setLoading(false); // Modal takes over UX from here

      const rzpOptions = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount,
        currency: rzpCurrency,
        name: "Bagchee",
        description: `Order #${savedOrder.orderNumber}`,
        order_id: razorpayOrderId,
        prefill: {
          name: `${shippingDetails.firstName} ${shippingDetails.lastName}`.trim(),
          email: shippingDetails.email,
          contact: shippingDetails.phone,
        },
        theme: { color: '#1a3c5e' },
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(`${API_BASE_URL}/razorpay/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: savedOrder.id,
            });
            if (verifyRes.data?.status) {
              toast.success("Payment successful!");
              clearCart();
              navigate("/order-receipt", { state: { orderDetails: savedOrder }, replace: true });
            } else {
              toast.error("Payment verification failed. Please contact support.");
            }
          } catch {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            toast.error("Payment cancelled. Your order is saved — retry from My Orders.");
          },
        },
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.open();
    } catch (error) {
      toast.error(
        error.response?.data?.msg || "Something went wrong. Please try again.",
      );
      setLoading(false);
    }
  };



  // 🟢 Login Mutation (Same as your Login page logic)
  const loginMutation = useMutation({
    mutationFn: async (loginData) => {
      const url = `${process.env.REACT_APP_API_URL}/user/login`;
      const encryptedPayload = encryptData(loginData);
      const res = await axios.post(url, { data: encryptedPayload });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status) {
        toast.success("Welcome back!");
        localStorage.setItem("token", data.token);
        localStorage.setItem("auth", JSON.stringify(data));
        setUser(data.userDetails); // Turant addresses load ho jayengi
        setShowLoginDropdown(false);
      } else {
        toast.error(data.msg);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || "Login failed");
    }
  });

  const handleInlineLogin = (e) => {
    e.preventDefault();
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  };



  // ─────────────────────── EMPTY CART ───────────────────────
  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded shadow-sm text-center max-w-md w-full border border-gray-200">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-text-main mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-500 mb-6">
            Add some books to your cart to proceed with checkout.
          </p>
          <Link
            to="/"
            className="inline-block bg-primary text-white px-6 py-3 font-bold hover:bg-primary-dark transition-colors font-montserrat uppercase text-sm"
          >
            Browse Books
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────── ORDER PLACED ───────────────────────
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded shadow-sm border border-gray-200 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-display font-bold text-text-main mb-2">
            Order Confirmed!
          </h2>
          <p className="text-gray-500 mb-8">
            Thank you for your purchase. Your order has been placed
            successfully.
          </p>
          <div className="bg-gray-50 rounded p-6 mb-8 text-left border border-gray-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Order Number:</span>
              <span className="font-bold text-text-main">
                {placedOrderDetails?.orderNumber || "ORD-XXXX"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date:</span>
              <span className="font-medium text-text-main">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Amount:</span>
              <span className="font-bold text-text-main">
                {formatPrice(total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method:</span>
              <span className="font-medium text-text-main">
                {selectedPayment?.title || "Online Payment"}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              to="/account/orders"
              className="w-full bg-primary text-white py-3 font-bold hover:bg-primary-dark transition-colors font-montserrat uppercase text-sm"
            >
              View My Orders
            </Link>
            <Link
              to="/"
              className="w-full bg-white border border-gray-200 text-text-main py-3 font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────── MAIN CHECKOUT ───────────────────────
  return (
    <div className="min-h-screen bg-cream-50">
      {/* ─── Add/Edit Address Modal ─── */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-start sm:items-center justify-center p-4 pt-8 sm:pt-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-primary px-6 py-4 flex justify-between items-center text-white sticky top-0">
              <h3 className="font-bold text-lg tracking-wide">
                {isEditingAddress ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}
              </h3>
              <button
                onClick={() => {
                  setShowAddressModal(false);
                  setIsEditingAddress(false);
                  setEditAddressId(null);
                }}
                className="hover:bg-white/20 p-1 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveAddress} className="p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Address Type
                  </label>
                  <select
                    value={newAddress.type}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, type: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary bg-gray-50"
                  >
                    <option>Home</option>
                    <option>Office</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={newAddress.name}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  placeholder="Street address, P.O. box"
                  required
                  value={newAddress.houseNo}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, houseNo: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Company (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Company name"
                  value={newAddress.company || ""}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, company: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Apartment, suite, etc."
                  value={newAddress.address2 || ""}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, address2: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    placeholder="City"
                    required
                    value={newAddress.city}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, city: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    State / Province *
                  </label>
                  <input
                    type="text"
                    placeholder="State / Province / Region"
                    required
                    value={newAddress.state}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, state: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    ZIP / Postal Code *
                  </label>
                  <input
                    type="text"
                    placeholder="ZIP / Postal Code"
                    required
                    value={newAddress.pincode}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, pincode: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Country *
                  </label>
                  <select
                    value={newAddress.country}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, country: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary bg-white"
                  >
                    {countries.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    required
                    value={newAddress.phone}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, phone: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                  />
                </div>
              </div>
              <div className="pt-6 flex justify-end gap-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressModal(false);
                    setIsEditingAddress(false);
                    setEditAddressId(null);
                  }}
                  className="px-6 py-2.5 text-gray-600 font-bold text-sm uppercase hover:bg-gray-100 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="px-8 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm uppercase rounded shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
                >
                  {savingAddress
                    ? "Saving..."
                    : isEditingAddress
                      ? "Update Address"
                      : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add/Edit Billing Address Modal ─── */}
      {showBillingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-start sm:items-center justify-center p-4 pt-8 sm:pt-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-primary px-6 py-4 flex justify-between items-center text-white sticky top-0">
              <h3 className="font-bold text-lg tracking-wide">
                {isEditingBilling ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}
              </h3>
              <button
                onClick={() => {
                  setShowBillingModal(false);
                  setIsEditingBilling(false);
                  setEditBillingId(null);
                }}
                className="hover:bg-white/20 p-1 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={handleSaveBillingAddress}
              className="p-6 md:p-8 space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Address Type
                  </label>
                  <select
                    value={newBillingAddress.type}
                    onChange={(e) =>
                      setNewBillingAddress({
                        ...newBillingAddress,
                        type: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary bg-gray-50"
                  >
                    <option>Home</option>
                    <option>Office</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={newBillingAddress.name}
                    onChange={(e) =>
                      setNewBillingAddress({
                        ...newBillingAddress,
                        name: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  placeholder="Street address, P.O. box"
                  required
                  value={newBillingAddress.houseNo}
                  onChange={(e) =>
                    setNewBillingAddress({
                      ...newBillingAddress,
                      houseNo: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Company (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Company name"
                  value={newBillingAddress.company || ""}
                  onChange={(e) =>
                    setNewBillingAddress({
                      ...newBillingAddress,
                      company: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Apartment, suite, etc."
                  value={newBillingAddress.address2 || ""}
                  onChange={(e) =>
                    setNewBillingAddress({
                      ...newBillingAddress,
                      address2: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    placeholder="City"
                    required
                    value={newBillingAddress.city}
                    onChange={(e) =>
                      setNewBillingAddress({
                        ...newBillingAddress,
                        city: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    State / Province *
                  </label>
                  <input
                    type="text"
                    placeholder="State / Province / Region"
                    required
                    value={newBillingAddress.state}
                    onChange={(e) =>
                      setNewBillingAddress({
                        ...newBillingAddress,
                        state: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    ZIP / Postal Code *
                  </label>
                  <input
                    type="text"
                    placeholder="ZIP / Postal Code"
                    required
                    value={newBillingAddress.pincode}
                    onChange={(e) =>
                      setNewBillingAddress({
                        ...newBillingAddress,
                        pincode: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Country *
                  </label>
                  <select
                    value={newBillingAddress.country}
                    onChange={(e) =>
                      setNewBillingAddress({
                        ...newBillingAddress,
                        country: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary bg-white"
                  >
                    {countries.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    required
                    value={newBillingAddress.phone}
                    onChange={(e) =>
                      setNewBillingAddress({
                        ...newBillingAddress,
                        phone: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                  />
                </div>
              </div>
              <div className="pt-6 flex justify-end gap-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowBillingModal(false);
                    setIsEditingBilling(false);
                    setEditBillingId(null);
                  }}
                  className="px-6 py-2.5 text-gray-600 font-bold text-sm uppercase hover:bg-gray-100 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="px-8 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm uppercase rounded shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
                >
                  {savingAddress
                    ? "Saving..."
                    : isEditingBilling
                      ? "Update Address"
                      : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── HEADER ─── */}
      {/* ─── HEADER ─── */}
      <header className="bg-gradient-to-r from-primary to-primary-dark shadow-sm sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">

          {/* 1. Empty div for balancing flex center (Optional if you want logo dead center) */}
          <div className="w-10 lg:block hidden"></div>

          {/* 2. Logo Row (Center) */}
          <Link to="/" className="flex items-center group">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl border-2 border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-white flex items-center justify-center shadow-xl">
                <img
                  src={logoImg}
                  alt="Bagchee"
                  className="w-8 h-8 lg:w-10 lg:h-10 object-contain"
                  style={{ filter: "brightness(0) saturate(100%) invert(45%) sepia(89%) saturate(2448%) hue-rotate(165deg) brightness(95%) contrast(101%)" }}
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xl lg:text-2xl font-semibold text-white tracking-wider uppercase font-montserrat">Bagchee</span>
                <span className="text-[8px] lg:text-[9px] font-medium tracking-[0.2em] text-white/80 uppercase font-montserrat">Books That Stick</span>
              </div>
            </div>
          </Link>

          {/* 3. CART ICON WITH FUNCTIONALITY (Right Side) */}
          {/* 3. CART ICON WITH FUNCTIONALITY (Right Side) */}
          <Link to="/cart" className="flex flex-col items-center gap-0.5 text-white hover:opacity-80 transition-all group relative pr-2">
            <div className="relative p-1">
              <ShoppingCart size={24} strokeWidth={2} />

              {/* Badge: Sirf tab dikhega jab cart mein items hon */}
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-primary shadow-lg animate-bounce">
                  {cart.length}
                </span>
              )}
            </div>

            {/* Icon ke niche wala text */}
            <span className="text-[10px] font-bold uppercase tracking-wider font-montserrat">
              Cart
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 py-8 overflow-x-hidden">
        {/* Page title */}


        {/* Guest sign-in banner */}
        {!user && (
          <div className="max-w-4xl mx-auto mb-6 bg-primary/5 border border-primary/20 rounded p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-text-main">Have an account?</span>{" "}
              Sign in for faster checkout — your addresses and order history will be saved.
            </p>
            <button
              type="button"
              onClick={() => setShowLoginDropdown(true)}
              className="shrink-0 bg-primary text-white text-xs font-bold px-5 py-2 uppercase tracking-wider hover:bg-primary-dark transition-colors"
            >
              Sign In
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 items-start" >

          {/* ═══════════════════════════════════════ LEFT COLUMN ═══════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-5">
            <h1 className="text-2xl font-display font-bold text-text-main text-left mb-8 uppercase tracking-wide  items-center ">
              SECURE CHECKOUT
            </h1>

            {/* ─── 1. DELIVERY ADDRESS ─── */}
            <div className="bg-cream-100 border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-200 bg-cream-100">
                <h2 className="text-base font-display font-bold text-text-main uppercase tracking-wide flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  SHIPPING ADDRESS
                </h2>
              </div>

              {/* Logged-in: show saved addresses */}
              {user ? (
                <div className="p-5">
                  {addresses.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500 text-sm mb-3">
                        No saved addresses. Please add one.
                      </p>
                      <button
                        onClick={() => {
                          setNewAddress({
                            type: "Home",
                            name: "",
                            houseNo: "",
                            street: "",
                            landmark: "",
                            city: "",
                            state: "",
                            pincode: "",
                            country: "India",
                            phone: "",
                          });
                          setIsEditingAddress(false);
                          setEditAddressId(null);
                          setShowAddressModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 text-primary text-sm font-bold hover:underline"
                      >
                        <Plus size={16} /> Add New Address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddress(addr);
                            if (sameAsShipping) setSelectedBillingAddress(addr);
                          }}
                          className={`bg-cream-100 border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden cursor-pointer ${selectedAddress?.id === addr.id ? "border-primary ring-2 ring-primary/20" : "border-gray-200"}`}
                        >
                          <div className="bg-cream-200/40 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wide flex items-center gap-2">
                              {/* {addr.type === 'Home' ? (
                                <Home size={14} className="text-primary" />
                              ) : (
                                <Briefcase size={14} className="text-primary" />
                              )} */}
                              {addr.type}
                            </h3>
                          </div>
                          <div className="p-4 flex-grow space-y-3 text-sm">
                            <p className="font-bold text-gray-900">
                              {[addr.firstName, addr.lastName].filter(Boolean).join(' ') || addr.name}
                            </p>
                            <div className="space-y-1.5">
                              <div className="flex gap-2 items-start">
                                <MapPin
                                  size={15}
                                  className="shrink-0 text-primary mt-0.5"
                                />
                                <div>
                                  <span className="block text-gray-700">
                                    {addr.houseNo}
                                  </span>
                                  {addr.street && (
                                    <span className="block text-gray-700">
                                      {addr.street}
                                    </span>
                                  )}
                                  <p className="text-gray-700 mt-0.5">
                                    {addr.city}, {addr.state}{" "}
                                    <span className="font-bold">
                                      {addr.pincode}
                                    </span>
                                  </p>
                                  <p className="uppercase text-xs tracking-wider text-gray-400 pt-0.5">
                                    {addr.country}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <p className="flex items-center gap-2 pt-2 border-t border-gray-100">
                              <Phone size={13} className="text-primary" />
                              <span className="font-bold text-gray-900">
                                {addr.phone}
                              </span>
                            </p>
                          </div>
                          <div className="p-3 border-t border-gray-100 flex gap-2 bg-cream-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAddress(addr);
                              }}
                              className="flex-1 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300"
                            >
                              <Edit size={13} /> Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAddress(addr.id);
                              }}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300"
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      {/* Add new address tile */}
                      <button
                        onClick={() => {
                          setNewAddress({
                            type: "Home",
                            name: "",
                            houseNo: "",
                            street: "",
                            landmark: "",
                            city: "",
                            state: "",
                            pincode: "",
                            country: "India",
                            phone: "",
                          });
                          setIsEditingAddress(false);
                          setEditAddressId(null);
                          setShowAddressModal(true);
                        }}
                        className="border-2 border-dashed border-gray-200 hover:border-primary rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary transition-colors min-h-[120px]"
                      >
                        <Plus size={22} />
                        <span className="text-xs font-bold">
                          Add New Address
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Guest: inline address form */
                <div className="p-5 space-y-3">
                  {/* Contact section */}
                  <div>
                    {!showLoginDropdown && (
                      <>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                          Contact
                        </label>
                        <input
                          type="email"
                          placeholder="Email"
                          required
                          value={guestAddress.email}
                          onChange={(e) =>
                            setGuestAddress({
                              ...guestAddress,
                              email: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                        />
                      </>
                    )}

                    {/* ─── NAYA INLINE LOGIN OPTION ─── */}
                    <div className="mt-3 bg-primary/5 border border-primary/10 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-2">
                        Already have an account?
                        <button
                          type="button"
                          onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                          className="text-primary font-bold hover:underline ml-1 uppercase"
                        >
                          {showLoginDropdown ? "Close Login" : "Sign In"}
                        </button>
                      </p>

                      {/* ─── DROPDOWN FORM ─── */}
                      {showLoginDropdown && (
                        <div className="space-y-3 mt-3 p-3 bg-white border rounded shadow-sm animate-fadeIn">
                          <input
                            type="email"
                            placeholder="Login Email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full border p-2 text-xs rounded outline-none focus:border-primary"
                          />
                          <input
                            type="password"
                            placeholder="Password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full border p-2 text-xs rounded outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={handleInlineLogin}
                            disabled={loginMutation.isPending}
                            className="w-full bg-primary text-white py-2 rounded text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                          >
                            {loginMutation.isPending ? "Logging in..." : "Login"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {!showLoginDropdown && <><div>
                    <select
                      value={guestAddress.country}
                      onChange={(e) =>
                        setGuestAddress({
                          ...guestAddress,
                          country: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary bg-white"
                    >
                      {countries.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="First name"
                        required
                        value={guestAddress.firstName}
                        onChange={(e) =>
                          setGuestAddress({
                            ...guestAddress,
                            firstName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        placeholder="Last name"
                        value={guestAddress.lastName}
                        onChange={(e) =>
                          setGuestAddress({
                            ...guestAddress,
                            lastName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Address line 1"
                      required
                      value={guestAddress.address1}
                      onChange={(e) =>
                        setGuestAddress({
                          ...guestAddress,
                          address1: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Address line 2 (optional)"
                      value={guestAddress.address2}
                      onChange={(e) =>
                        setGuestAddress({
                          ...guestAddress,
                          address2: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Company (optional)"
                      value={guestAddress.company}
                      onChange={(e) =>
                        setGuestAddress({
                          ...guestAddress,
                          company: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        required
                        value={guestAddress.city}
                        onChange={(e) =>
                          setGuestAddress({
                            ...guestAddress,
                            city: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        placeholder="Region / State"
                        required
                        value={guestAddress.state}
                        onChange={(e) =>
                          setGuestAddress({
                            ...guestAddress,
                            state: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Postal code"
                        required
                        value={guestAddress.postalCode}
                        onChange={(e) =>
                          setGuestAddress({
                            ...guestAddress,
                            postalCode: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        required
                        value={guestAddress.phone}
                        onChange={(e) =>
                          setGuestAddress({
                            ...guestAddress,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </>}
                </div>
              )}
            </div>

            {/* ─── 2. SHIPPING OPTION ─── */}
            <div className="bg-cream-100 border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-200 bg-cream-100">
                <h2 className="text-base font-display font-bold text-text-main uppercase tracking-wide flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  SHIPPING OPTION
                </h2>
              </div>
              <div className="p-5 space-y-2">
                {loadingShipping ? (
                  <p className="text-sm text-gray-400 text-center py-2">
                    Loading shipping options...
                  </p>
                ) : shippingOptions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No shipping options available
                  </p>
                ) : (
                  shippingOptions.map((option) => {
                    const price = getShippingPrice(option);
                    // Estimated delivery date based on maxDayLimit
                    const deliveryDate =
                      option.maxDayLimit > 0
                        ? (() => {
                          const d = new Date();
                          d.setDate(d.getDate() + option.maxDayLimit + maxShipDays);
                          return d.toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          });
                        })()
                        : maxShipDays > 0
                          ? (() => {
                            const d = new Date();
                            d.setDate(d.getDate() + maxShipDays);
                            return d.toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            });
                          })()
                          : null;
                    return (
                      <label
                        key={option.id}
                        className={`flex items-center justify-between px-4 py-3 border cursor-pointer transition-all ${appliedShipping?.id === option.id ? "border-primary bg-blue-50" : "border-gray-200 hover:border-primary"}`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="checkoutShipping"
                            checked={appliedShipping?.id === option.id}
                            onChange={() => setAppliedShipping(option)}
                            className="w-3.5 h-3.5 text-primary border-gray-400 focus:ring-primary"
                          />
                          <div>
                            <span className="text-sm text-text-main font-medium">
                              {option.title}
                            </span>
                            {deliveryDate && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                Estimated delivery by {deliveryDate}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-text-main">
                          {price === 0 ? (
                            <span className="text-primary">Free</span>
                          ) : (
                            formatPrice(price)
                          )}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* ─── 3. PAYMENT METHOD ─── */}
            <div className="bg-cream-100 border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-200 bg-cream-100">
                <h2 className="text-base font-display font-bold text-text-main uppercase tracking-wide flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  SELECT A PAYMENT METHOD
                </h2>
              </div>
              <div className="p-5 space-y-2">

                {/* ── Gift Card Section (top of payment) — hidden when cart is only gift cards ── */}
                {!hasOnlyGiftCards && <div className="border border-primary/20 rounded-lg bg-primary/5 p-4 mb-4 space-y-3">
                  <p className="text-sm font-bold text-text-main font-montserrat uppercase tracking-wide">Redeem E-Gift Card</p>

                  {/* Gift card code input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={giftCardInput}
                      onChange={e => setGiftCardInput(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                    {appliedGiftCard ? (
                      <button
                        onClick={() => { setAppliedGiftCard(null); setGiftCardInput(''); }}
                        className="px-4 py-2.5 text-sm font-bold bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                      >Remove</button>
                    ) : (
                      <button
                        onClick={handleApplyGiftCard}
                        disabled={applyingGiftCard}
                        className="px-4 py-2.5 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50"
                      >{applyingGiftCard ? '...' : 'Apply'}</button>
                    )}
                  </div>
                  {appliedGiftCard && (
                    <p className="text-xs text-green-700 font-medium">
                      ✓ Gift card applied — ${appliedGiftCard.balance.toFixed(2)} available
                    </p>
                  )}

                  {/* Wallet balance */}
                  {giftCardWalletBalance > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={useWalletBalance}
                        onChange={e => setUseWalletBalance(e.target.checked)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm text-text-main">
                        Use my gift card wallet balance (<span className="font-bold text-primary">${giftCardWalletBalance.toFixed(2)}</span>)
                      </span>
                    </label>
                  )}
                </div>}

                {loadingPayments ? (
                  <p className="text-sm text-gray-400 text-center py-2">
                    Loading payment methods...
                  </p>
                ) : visiblePaymentMethods.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No payment methods available
                  </p>
                ) : (
                  visiblePaymentMethods.map((method) => {
                    const isSelected = selectedPayment?.id === method.id;
                    const isCC = isCreditCardMethod(method);
                    const isPP = isPayPalMethod(method);
                    return (
                      <div
                        key={method.id}
                        className={`border transition-all overflow-hidden rounded ${isSelected ? "border-primary" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        {/* Method row */}
                        <label className="flex items-center gap-3 px-4 py-3 cursor-pointer w-full">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={isSelected}
                            onChange={() => setSelectedPayment(method)}
                            className="w-4 h-4 text-primary border-gray-300 focus:ring-primary shrink-0"
                          />
                          <span className="font-medium text-text-main text-sm flex-1">
                            {method.title}
                          </span>
                          {/* Logos on the right */}
                          {isCC && (
                            <div className="flex items-center gap-1 shrink-0">
                              <img src={visaLogo} alt="Visa" className="h-5 w-auto object-contain" />
                              <img src={mastercardLogo} alt="Mastercard" className="h-5 w-auto object-contain" />
                              <img src={discoverLogo} alt="Discover" className="h-5 w-auto object-contain" />
                              <img src={amexLogo} alt="Amex" className="h-5 w-auto object-contain" />
                            </div>
                          )}
                          {isPP && (
                            <img src={paypalLogo} alt="PayPal" className="h-5 w-auto object-contain shrink-0" />
                          )}
                        </label>

                        {/* Additional text for selected payment method */}
                        {isSelected &&
                          method.isAdditionalTextActive &&
                          method.additionalText && (
                            <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                              <div
                                className="text-sm text-gray-600 pt-3 rich-content"
                                dangerouslySetInnerHTML={createSafeHtml(method.additionalText)}
                              />
                            </div>
                          )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ─── Purchase Order Number (shown only when PO payment selected) ─── */}
            {isPurchaseOrderMethod(selectedPayment) && (
              <div className="bg-cream-100 border border-primary/30 shadow-sm rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-primary/20 bg-primary/5">
                  <h2 className="text-sm font-display font-bold text-primary uppercase tracking-wide">
                    Purchase Order Details
                  </h2>
                </div>
                <div className="p-5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    Purchase Order Number
                  </label>
                  <input
                    type="text"
                    value={purchaseOrderNumber}
                    onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                    placeholder="Enter your PO number"
                    className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white font-body"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Your order will be processed immediately upon submission.</p>
                </div>
              </div>
            )}

            {/* ─── 3b. BILLING ADDRESS ─── */}
            <div className="bg-cream-100 border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-200 bg-cream-100">
                <h2 className="text-base font-display font-bold text-text-main uppercase tracking-wide flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                    4
                  </span>
                  BILLING ADDRESS
                </h2>
              </div>

              {/* Logged-in billing */}
              {user ? (
                <div className="p-5">
                  {/* Same as shipping toggle */}
                  <div className="flex flex-col md:flex-row gap-6 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="billingType"
                        checked={sameAsShipping}
                        onChange={() => {
                          setSameAsShipping(true);
                          if (selectedAddress)
                            setSelectedBillingAddress(selectedAddress);
                        }}
                        className="w-3.5 h-3.5 text-primary border-gray-300 focus:ring-primary"
                      />
                      <span className="text-sm text-gray-600">
                        Same as shipping
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="billingType"
                        checked={!sameAsShipping}
                        onChange={() => {
                          setSameAsShipping(false);
                          setSelectedBillingAddress(null);
                        }}
                        className="w-3.5 h-3.5 text-primary border-gray-300 focus:ring-primary"
                      />
                      <span className="text-sm text-gray-600">
                        Use a different address
                      </span>
                    </label>
                  </div>
                  {!sameAsShipping &&
                    (addresses.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm mb-3">
                          No saved addresses. Please add one.
                        </p>
                        <button
                          onClick={() => {
                            setNewBillingAddress({
                              type: "Home",
                              name: "",
                              houseNo: "",
                              street: "",
                              landmark: "",
                              city: "",
                              state: "",
                              pincode: "",
                              country: "India",
                              phone: "",
                            });
                            setIsEditingBilling(false);
                            setEditBillingId(null);
                            setShowBillingModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 text-primary text-sm font-bold hover:underline"
                        >
                          <Plus size={16} /> Add New Address
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedBillingAddress(addr)}
                            className={`bg-cream-100 border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden cursor-pointer ${selectedBillingAddress?.id === addr.id ? "border-primary ring-2 ring-primary/20" : "border-gray-200"}`}
                          >
                            <div className="bg-cream-200/40 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                              <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wide flex items-center gap-2">
                                {/* {addr.type === 'Home' ? (
                                  <Home size={14} className="text-primary" />
                                ) : (
                                  <Briefcase size={14} className="text-primary" />
                                )} */}
                                {addr.type}
                              </h3>
                            </div>
                            <div className="p-4 flex-grow space-y-3 text-sm">
                              <p className="font-bold text-gray-900">
                                {[addr.firstName, addr.lastName].filter(Boolean).join(' ') || addr.name}
                              </p>
                              <div className="space-y-1.5">
                                <div className="flex gap-2 items-start">
                                  <MapPin
                                    size={15}
                                    className="shrink-0 text-primary mt-0.5"
                                  />
                                  <div>
                                    <span className="block text-gray-700">
                                      {addr.houseNo}, {addr.street}
                                    </span>
                                    {addr.landmark && (
                                      <span className="block text-xs text-gray-500 italic mt-0.5">
                                        ({addr.landmark})
                                      </span>
                                    )}
                                    <p className="text-gray-700 mt-0.5">
                                      {addr.city}, {addr.state} -{" "}
                                      <span className="font-bold">
                                        {addr.pincode}
                                      </span>
                                    </p>
                                    <p className="uppercase text-xs tracking-wider text-gray-400 pt-0.5">
                                      {addr.country}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <p className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                <Phone size={13} className="text-primary" />
                                <span className="font-bold text-gray-900">
                                  {addr.phone}
                                </span>
                              </p>
                            </div>
                            <div className="p-3 border-t border-gray-100 flex gap-2 bg-cream-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditBillingAddress(addr);
                                }}
                                className="flex-1 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300"
                              >
                                <Edit size={13} /> Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBillingAddress(addr.id);
                                }}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300"
                              >
                                <Trash2 size={13} /> Remove
                              </button>
                            </div>
                          </div>
                        ))}
                        {/* Add new address tile */}
                        <button
                          onClick={() => {
                            setNewBillingAddress({
                              type: "Home",
                              name: "",
                              houseNo: "",
                              street: "",
                              landmark: "",
                              city: "",
                              state: "",
                              pincode: "",
                              country: "India",
                              phone: "",
                            });
                            setIsEditingBilling(false);
                            setEditBillingId(null);
                            setShowBillingModal(true);
                          }}
                          className="border-2 border-dashed border-gray-200 hover:border-primary rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary transition-colors min-h-[120px]"
                        >
                          <Plus size={22} />
                          <span className="text-xs font-bold">Add Address</span>
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                /* Guest billing */
                <div className="p-5">
                  <div className="flex gap-6 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="guestBilling"
                        checked={guestBillingSame}
                        onChange={() => setGuestBillingSame(true)}
                        className="w-3.5 h-3.5 text-primary border-gray-300 focus:ring-primary"
                      />
                      <span className="text-sm text-gray-600">
                        Same as shipping
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="guestBilling"
                        checked={!guestBillingSame}
                        onChange={() => setGuestBillingSame(false)}
                        className="w-3.5 h-3.5 text-primary border-gray-300 focus:ring-primary"
                      />
                      <span className="text-sm text-gray-600">
                        Use a different address
                      </span>
                    </label>
                  </div>
                  {!guestBillingSame && (
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Email address"
                        value={guestBilling.email}
                        onChange={(e) =>
                          setGuestBilling({
                            ...guestBilling,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="First name *"
                          value={guestBilling.firstName}
                          onChange={(e) =>
                            setGuestBilling({
                              ...guestBilling,
                              firstName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Last name *"
                          value={guestBilling.lastName}
                          onChange={(e) =>
                            setGuestBilling({
                              ...guestBilling,
                              lastName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Company (optional)"
                        value={guestBilling.company}
                        onChange={(e) =>
                          setGuestBilling({
                            ...guestBilling,
                            company: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        placeholder="Address line 1 *"
                        value={guestBilling.address1}
                        onChange={(e) =>
                          setGuestBilling({
                            ...guestBilling,
                            address1: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        placeholder="Address line 2 (optional)"
                        value={guestBilling.address2}
                        onChange={(e) =>
                          setGuestBilling({
                            ...guestBilling,
                            address2: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="City *"
                          value={guestBilling.city}
                          onChange={(e) =>
                            setGuestBilling({
                              ...guestBilling,
                              city: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="State / Region *"
                          value={guestBilling.state}
                          onChange={(e) =>
                            setGuestBilling({
                              ...guestBilling,
                              state: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Postal code *"
                          value={guestBilling.postalCode}
                          onChange={(e) =>
                            setGuestBilling({
                              ...guestBilling,
                              postalCode: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                        />
                        <select
                          value={guestBilling.country}
                          onChange={(e) =>
                            setGuestBilling({
                              ...guestBilling,
                              country: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary bg-white"
                        >
                          {countries.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="tel"
                        placeholder="Phone number *"
                        value={guestBilling.phone}
                        onChange={(e) =>
                          setGuestBilling({
                            ...guestBilling,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── 4. ACCOUNT (OPTIONAL) ─── */}
            <div className="bg-cream-100 border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-200 bg-cream-100">
                <h2 className="text-base font-display font-bold text-text-main uppercase tracking-wide flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                    5
                  </span>
                  ACCOUNT{" "}
                  <span className="text-gray-400 font-normal normal-case text-sm">
                    (optional)
                  </span>
                </h2>
              </div>
              <div className="p-5">
                {user ? (
                  <p className="text-sm text-center text-gray-500">
                    You are logged in as{" "}
                    <span className="font-bold text-text-main">
                      {user.email || user.name}
                    </span>
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-center text-gray-500 mb-4">
                      Create a Bagchee Account to Save, track and make changes
                      to this Order
                    </p>
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Email"
                        value={accountEmail}
                        onChange={(e) => setAccountEmail(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="password"
                          placeholder="Password"
                          value={accountPassword}
                          onChange={(e) => setAccountPassword(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                        />
                        <input
                          type="password"
                          placeholder="Repeat password"
                          value={accountRepeatPassword}
                          onChange={(e) =>
                            setAccountRepeatPassword(e.target.value)
                          }
                          className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>


            {/* ─── 6. ORDER NOTES (Hamesha Open) ─── */}
            {/* ─── 6. ORDER NOTES (Hamesha Open - Same PO Theme) ─── */}
            <div className="bg-cream-100 border border-primary/30 shadow-sm rounded-lg overflow-hidden mt-5">
              <div className="px-5 py-4 border-b border-primary/20 bg-primary/5">
                <h2 className="text-sm font-display font-bold text-primary uppercase tracking-wide flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    6
                  </span>
                  NOTES    (optional)
                </h2>
              </div>
              <div className="p-5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 font-montserrat">
                  Add a note to your order (Optional)
                </label>
                <textarea
                  rows="3"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Special instructions for delivery, landmark etc."
                  className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white font-body transition-all resize-none"
                ></textarea>
                {/* <p className="text-[10px] text-gray-400 mt-2 italic">
      * This note will be saved with your order details.
    </p> */}
              </div>
            </div>

            {/* ─── CONTINUE TO PAY ─── */}
            <div className="bg-cream-100 border border-gray-200 shadow-sm p-5 text-center space-y-3">
              <button
                onClick={handlePlaceOrder}
                disabled={loading || loadingPayments || loadingShipping}
                className="w-full bg-primary text-white py-3.5 font-bold text-sm uppercase tracking-wider hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed font-montserrat flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (loadingPayments || loadingShipping) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  (() => {
                    if (isPurchaseOrderMethod(selectedPayment) || isWireTransferMethod(selectedPayment)) return "PLACE ORDER";
                    if (isPayPalMethod(selectedPayment) && !isDeferredFlow()) return "CONTINUE TO PAYPAL";
                    return "CONTINUE TO PAY";
                  })()
                )}
              </button>
              <p className="text-xs text-gray-400">
                By placing your order, you agree to our{" "}
                <Link
                  to="/terms-conditions"
                  className="text-primary hover:underline"
                >
                  Terms & Conditions
                </Link>
                ,{" "}
                <Link
                  to="/privacy-policy"
                  className="text-primary hover:underline"
                >
                  privacy and return policy
                </Link>
              </p>
            </div>
          </div>

          {/* ═══════════════════════════════════════ RIGHT COLUMN ═══════════════════════════════════════ */}
          <div className="lg:col-span-1 space-y-5">
            {/* ─── ORDER DETAILS ---- */}
            <div className="h-[32px] mb-8 invisible lg:block hidden"></div>

            {/* ─── ORDER DETAILS card ─── */}
            <div className="bg-cream-100 border border-gray-200 shadow-sm">
              <div className="p-5 space-y-4">
                {/* Cart total */}
                {/* Cart total */}
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-600">
                    Cart total ({cart.length} items)
                  </span>
                  <span className="text-xl font-bold text-text-main">
                    {/* 🟢 FIXED: Using formatPriceFixed */}
                    {formatCheckoutDisplay(subtotal)}
                  </span>
                </div>


                {/* 🟢 2. MEMBERSHIP DETAILS IN SUMMARY (Updated for Exact Values) */}
                {/* 🟢 2. MEMBERSHIP DETAILS IN SUMMARY (100% Dynamic) */}
                {membershipAdded && (
                  <div className="space-y-2 pt-2 border-t border-gray-100 border-dashed animate-fadeIn">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1.5 font-semibold text-text-main">
                        <Award size={14} className="text-primary" />
                        <span>Membership Fee (1 Year)</span>
                      </div>
                      <span className="font-bold text-primary">
                        +{formatCheckoutDisplay(currentMembershipCost)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-green-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Check size={14} />
                        <span>Member Savings ({memberDiscountPercent}% OFF applied)</span>
                      </div>
                      <span>
                        -{formatCheckoutDisplay(memberDiscount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Shipping Display Fix */}
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-gray-600">Shipping</span>
                  <span className={`font-bold ${shippingCost === 0 ? "text-primary animate-pulse" : ""}`}>
                    {shippingCost === 0 ? "FREE" : formatCheckoutDisplay(shippingCost)}
                  </span>
                </div>

                {/* Promo code */}
                <div className="border-t border-gray-200 pt-3">
                  {!appliedCoupon ? (
                    <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Tag size={13} className="text-primary" />
                        <span className="text-[11px] font-bold text-primary uppercase tracking-wider font-montserrat">
                          Have a Promo Code?
                        </span>
                      </div>
                      <div className="flex gap-0 rounded overflow-hidden border border-primary/30">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                          placeholder="Enter code"
                          className="flex-1 px-3 py-2 text-xs bg-white focus:outline-none placeholder:text-gray-400 font-montserrat tracking-widest"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={applyingCoupon}
                          className="bg-primary text-white px-4 py-2 text-[11px] font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 font-montserrat uppercase tracking-wide shrink-0"
                        >
                          {applyingCoupon ? "..." : "Apply"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-lg border-2 border-green-400 bg-green-50 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                            <Check size={14} className="text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] text-green-700 font-semibold uppercase tracking-wider font-montserrat">Coupon Applied</p>
                            <p className="text-xs font-black text-green-900 font-montserrat tracking-widest">
                              {appliedCoupon.code}
                              <span className="ml-1.5 text-green-700 font-bold">
                                — {appliedCoupon.discountType === "fixed" ? formatPrice(appliedCoupon.discount) : `${appliedCoupon.discount}% off`}
                              </span>
                            </p>
                          </div>
                        </div>
                        <button onClick={handleRemoveCoupon} className="text-green-600 hover:text-red-500 transition-colors ml-2 shrink-0">
                          <X size={15} />
                        </button>
                      </div>
                      <div className="h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-400" />
                    </div>
                  )}
                </div>

                {/* Shipping options */}
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs font-bold text-primary text-center mb-2">
                    Shipping options
                  </p>
                  {loadingShipping ? (
                    <p className="text-xs text-gray-400 text-center">
                      Loading...
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {shippingOptions.map((option) => {
                        const price = getShippingPrice(option);
                        const deliveryDate =
                          option.maxDayLimit > 0
                            ? (() => {
                              const d = new Date();
                              d.setDate(d.getDate() + option.maxDayLimit);
                              return d.toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                              });
                            })()
                            : null;
                        return (
                          <label
                            key={option.id}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="rightShipping"
                              checked={appliedShipping?.id === option.id}
                              onChange={() => setAppliedShipping(option)}
                              className="w-3 h-3 text-primary border-gray-400 focus:ring-primary"
                            />
                            <div className="flex-1">
                              <span className="text-xs text-text-main">
                                {option.title}
                              </span>
                              {deliveryDate && (
                                <p className="text-[10px] text-gray-400">
                                  By {deliveryDate}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-gray-600 font-bold">
                              {price === 0 ? "Free" : formatCheckoutDisplay(price)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-3">
                  {appliedCoupon && (
                    <div className="flex justify-between text-xs text-green-600 mb-1">
                      <span>Discount</span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  {giftCardDiscount > 0 && (
                    <div className="flex justify-between text-xs text-green-600 mb-1">
                      <span>Gift Card</span>
                      <span>-${giftCardDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {walletDeduction > 0 && (
                    <div className="flex justify-between text-xs text-green-600 mb-1">
                      <span>Wallet Balance</span>
                      <span>-${walletDeduction.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Total (tax incl.)
                    </span>
                    <span className="text-2xl font-bold text-text-main">
                      {formatCheckoutDisplay(total)}
                    </span>
                  </div>
                </div>

                {/* Secure payment */}
                <div className="text-center pt-1">
                  <p className="text-xs text-gray-400 mb-2 flex items-center justify-center gap-1">
                    <span>🔒</span> 100% Secure Payment
                  </p>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="h-5 w-8 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                      <img
                        src={visaLogo}
                        alt="Visa"
                        className="h-2.5 object-contain"
                      />
                    </div>
                    <div className="h-5 w-8 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                      <img
                        src={mastercardLogo}
                        alt="Mastercard"
                        className="h-2.5 object-contain"
                      />
                    </div>
                    <div className="h-5 w-8 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                      <img
                        src={discoverLogo}
                        alt="Discover"
                        className="h-2.5 object-contain"
                      />
                    </div>
                    <div className="h-5 w-8 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                      <img
                        src={amexLogo}
                        alt="Amex"
                        className="h-2.5 object-contain"
                      />
                    </div>
                    <div className="h-5 w-8 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                      <img
                        src={paypalLogo}
                        alt="PayPal"
                        className="h-2.5 object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── ORDER SUMMARY ─── */}
            <div className="bg-cream-100 border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-200 bg-cream-100">
                <h3 className="text-base font-display font-bold text-text-main uppercase tracking-wide text-center">
                  ORDER SUMMARY
                </h3>
              </div>
              <div className="p-5">
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-main leading-snug">
                          <span className="text-gray-500">
                            {item.quantity}x
                          </span>{" "}
                          {item.name || item.title}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-text-main shrink-0">
                        {formatPrice(item.price * item.quantity, ((item.inrPrice || item.inr_price) || 0) * item.quantity, ((item.realPrice || item.real_price) || item.price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Edit Cart */}
                <div className="border-t border-gray-200 mt-4 pt-3 text-center">
                  <Link
                    to="/cart"
                    className="text-primary text-sm font-bold hover:underline uppercase tracking-wider font-montserrat"
                  >
                    EDIT CART
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default Checkout;
