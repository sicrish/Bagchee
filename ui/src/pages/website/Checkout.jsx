import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  Award
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { CurrencyContext } from "../../context/CurrencyContext";
import axios from "../../utils/axiosConfig";
import toast from "react-hot-toast";

import logoImg from "../../assets/images/common/logo.png";

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
  const { currency, formatPrice, formatPriceFixed } = useContext(CurrencyContext);

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
  const [newAddress, setNewAddress] = useState({
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

  // ─── Account optional ───
  const [createAccount, setCreateAccount] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountRepeatPassword, setAccountRepeatPassword] = useState("");

  // ─── Order ───
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);

  const [membershipPrice, setMembershipPrice] = useState(0);


  const [settings, setSettings] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "";

  // ─── Country list ───
  const countries = [
    "India",
    "United States",
    "United Kingdom",
    "Australia",
    "Canada",
    "Germany",
    "France",
    "Singapore",
    "UAE",
    "Japan",
    "South Korea",
    "New Zealand",
    "Netherlands",
    "Italy",
    "Spain",
    "Brazil",
    "Other",
  ];

  // ─── Load user ───
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
  }, []);

  // ─── Load saved addresses ───
  useEffect(() => {
    if (user?.id) fetchAddresses(user.id);
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
          axios.get(`${API_BASE_URL}/coupons/list`),
          axios.get(`${API_BASE_URL}/settings/list`),
        ]);


        if (settingsRes.data.status && settingsRes.data.data.length > 0) {
          const s = settingsRes.data.data[0];
          console.log("setting", s);
          setSettings(s); // Poori settings save karein

          // 🟢 DYNAMIC COST LOGIC (Aapke JSON ke mutabik)
          let mPrice = 0;

          if (currency === 'INR') {
            // INR ke liye: 'membership_cart_price' (2510.87) use karein
            mPrice = Number(s.membership_cart_price) || 2500;
          } else {
            // USD/Baaki ke liye: 'membership_cost' (35) use karein
            mPrice = Number(s.membership_cost) || 35;
          }

          setMembershipPrice(mPrice); // Ab exact 35 ya 2510.87 save hoga
        }

        // Payment methods
        if (payRes.data.status) {
          const active = payRes.data.data.filter((p) => p.isActive);
          setPaymentMethods(active);
          if (active.length > 0) setSelectedPayment(active[0]);
        }

        // Shipping options
        if (shipRes.data.status) {
          const active = shipRes.data.data.filter((o) => o.isActive);
          setShippingOptions(active);
          // If cart has appliedShipping, validate it still exists; else default to first
          if (!appliedShipping && active.length > 0) {
            setAppliedShipping(active[0]);
          }
        }

        // Coupons — filter client-side (active endpoint omits required fields)
        if (couponRes.data.status) {
          setActiveCoupons(
            couponRes.data.data.filter((c) => c.active === "active"),
          );
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
  const getShippingPrice = (option) => {
    if (!option) return 0;
    if (currency === "INR") return option.priceInr || 0;
    if (currency === "EUR") return option.priceEur || 0;
    return option.priceUsd || 0;
  };

// ─── 🟢 FINAL BUG-FREE DYNAMIC CALCULATIONS ───

  // 1. Ninja Trick: Subtotal ko formatPrice se nikaalo (Taki Cart se match kare)
  const rawSubtotalStr = formatPrice(cartTotal).replace(/[^\d.-]/g, '');
  const subtotal = Number(rawSubtotalStr) || 0; // Iska naam 'subtotal' hi rakha hai taaki error na aaye

  // 2. Settings Extraction
  const activeSettings = (settings && Array.isArray(settings)) ? settings[0] : (settings || {});
  const isINR = currency === 'INR';
  const isEUR = currency === 'EUR';

  // 3. Dynamic Membership Cost

let membershipPriceFromSetting = 0; 
  
if (isINR) {
  // Pehle API ka rate uthao, agar nahi mile to fallback 2500
  membershipPriceFromSetting = Number(activeSettings?.membership_cart_price) || 2500;
} else if (isEUR) {
  // Pehle API ka EUR rate, fallback 31
  membershipPriceFromSetting = Number(activeSettings?.membership_cost_eur) || 31;
} else {
  // Default USD: API rate, fallback 35
  membershipPriceFromSetting = Number(activeSettings?.membership_cost) || 35;
}

const currentMembershipCost = membershipAdded ? membershipPriceFromSetting : 0;

  // 4. Member Discount (11%)
  const memberDiscountPercent = Number(activeSettings?.member_discount) || 11;
  const grossTotal = subtotal + currentMembershipCost;
  const memberDiscount = membershipAdded
    ? Math.round((grossTotal * (memberDiscountPercent / 100)) * 100) / 100
    : 0;

  // 5. Shipping Logic
  const freeShippingThreshold = isINR
    ? (Number(activeSettings?.show_promo_over_inr) || 3560)
    : (Number(activeSettings?.free_shipping_over) || 50);

  let baseShippingCost = Number(getShippingPrice(appliedShipping)) || 0;
  let shippingCost = baseShippingCost;

  if (freeShippingThreshold > 0 && (grossTotal - memberDiscount) >= freeShippingThreshold) {
    shippingCost = 0;
  }

  // 6. Coupon Logic
  let couponDiscount = 0;
  if (appliedCoupon) {
    const discountVal = Number(appliedCoupon.discount) || 0;
    const amountAfterMemberDiscount = grossTotal - memberDiscount;
    if (appliedCoupon.discountType === "fixed") {
      couponDiscount = discountVal;
    } else {
      couponDiscount = Math.round(((amountAfterMemberDiscount * discountVal) / 100) * 100) / 100;
    }
  }

  // 🏆 7. FINAL TOTAL
  const total = (grossTotal - memberDiscount - couponDiscount) + shippingCost;

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
    } catch (err) {
      console.error("Address fetch error:", err);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to save address");
      return;
    }
    const { name, phone, houseNo, street, city, state, pincode } = newAddress;
    if (!name || !phone || !houseNo || !street || !city || !state || !pincode) {
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
      const res = await axios.post(`${API_BASE_URL}/user/add-address`, {
        userId: user.id,
        ...newAddress,
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
    setNewAddress({ ...addr });
    setIsEditingAddress(true);
    setEditAddressId(addr._id);
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
    const { name, phone, houseNo, street, city, state, pincode } =
      newBillingAddress;
    if (!name || !phone || !houseNo || !street || !city || !state || !pincode) {
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
      const res = await axios.post(`${API_BASE_URL}/user/add-address`, {
        userId: user.id,
        ...newBillingAddress,
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
    setNewBillingAddress({ ...addr });
    setIsEditingBilling(true);
    setEditBillingId(addr._id);
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

  // ─── Coupon handlers ───
  const handleApplyCoupon = async () => {
    if (!promoInput.trim()) {
      toast.error("Please enter a promo code");
      return;
    }
    setApplyingCoupon(true);
    try {
      const code = promoInput.trim().toUpperCase();
      const found = activeCoupons.find((c) => c.code.toUpperCase() === code);
      if (!found) {
        toast.error("Invalid or inactive promo code");
        return;
      }
      if (
        found.members_only === "active" &&
        (!user || user.membership !== "active")
      ) {
        toast.error("This coupon is for members only");
        return;
      }
      if (found.minimum_buy && subtotal < found.minimum_buy) {
        toast.error(
          `Minimum order of ${formatPrice(found.minimum_buy)} required`,
        );
        return;
      }
      const now = new Date();
      if (found.valid_from && new Date(found.valid_from) > now) {
        toast.error("Coupon not yet valid");
        return;
      }
      if (found.valid_to && new Date(found.valid_to) < now) {
        toast.error("Coupon has expired");
        return;
      }
      const discountType = found.fix_amount === "active" ? "fixed" : "pct";
      setAppliedCoupon({
        code: found.code,
        discount: found.amount,
        discountType,
        couponId: found._id,
      });
      toast.success("Promo code applied!");
    } catch (err) {
      toast.error("Failed to validate promo code");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setPromoInput("");
    toast.success("Promo code removed");
  };

  // ─── Credit card helpers ───
  const isCreditCardMethod = (method) =>
    method?.title?.toLowerCase().includes("credit card");


  // ─── Place order ───
  const handlePlaceOrder = async () => {
    // Validation
    if (user) {
      if (!selectedAddress) {
        toast.error("Please select a delivery address");
        return;
      }
      if (!sameAsShipping && !selectedBillingAddress) {
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
        shippingDetails = {
          email: user.email || "",
          first_name: addr.name?.split(" ")[0] || addr.name || "",
          last_name: addr.name?.split(" ").slice(1).join(" ") || "",
          address_1:
            addr.houseNo && addr.street
              ? `${addr.houseNo}, ${addr.street}`
              : addr.houseNo || addr.street || "",
          address_2: addr.landmark || "",
          company: "",
          country: addr.country || "India",
          state_region: addr.state || "",
          city: addr.city || "",
          postcode: addr.pincode || "",
          phone: addr.phone || "",
        };
      } else {
        shippingDetails = {
          email: guestAddress.email,
          first_name: guestAddress.firstName,
          last_name: guestAddress.lastName,
          address_1: guestAddress.address1,
          address_2: guestAddress.address2 || "",
          company: guestAddress.company || "",
          country: guestAddress.country,
          state_region: guestAddress.state,
          city: guestAddress.city,
          postcode: guestAddress.postalCode,
          phone: guestAddress.phone,
        };
      }

      // Build billing_details
      let billingDetails;
      if (user) {
        const bAddr = sameAsShipping ? selectedAddress : selectedBillingAddress;
        billingDetails = {
          first_name: bAddr.name?.split(" ")[0] || bAddr.name || "",
          last_name: bAddr.name?.split(" ").slice(1).join(" ") || "",
          address_1:
            bAddr.houseNo && bAddr.street
              ? `${bAddr.houseNo}, ${bAddr.street}`
              : bAddr.houseNo || bAddr.street || "",
          address_2: bAddr.landmark || "",
          company: "",
          country: bAddr.country || "India",
          state_region: bAddr.state || "",
          city: bAddr.city || "",
          postcode: bAddr.pincode || "",
          phone: bAddr.phone || "",
        };
      } else if (guestBillingSame) {
        billingDetails = {
          first_name: guestAddress.firstName,
          last_name: guestAddress.lastName,
          address_1: guestAddress.address1,
          address_2: guestAddress.address2 || "",
          company: guestAddress.company || "",
          country: guestAddress.country,
          state_region: guestAddress.state,
          city: guestAddress.city,
          postcode: guestAddress.postalCode,
          phone: guestAddress.phone,
        };
      } else {
        billingDetails = {
          first_name: guestBilling.firstName,
          last_name: guestBilling.lastName,
          address_1: guestBilling.address1,
          address_2: guestBilling.address2 || "",
          company: guestBilling.company || "",
          country: guestBilling.country,
          state_region: guestBilling.state,
          city: guestBilling.city,
          postcode: guestBilling.postalCode,
          phone: guestBilling.phone,
        };
      }

      const isLoggedInMember = user && user.membership === "active";
      const paymentTitle = selectedPayment?.title || "Online Payment";

      const orderData = {
        customer_id: user?._id || user?.id || "000000000000000000000000",
        products: cart.map((item) => ({
          product_id: item._id || null,
          name: item.name || item.title || "Book",
          price: item.price || 0,
          quantity: item.quantity || 1,
          status: "Pending",
          courier: "",
          tracking_id: "",
          return_note: "",
          cancel_note: "",
        })),
        total: total,
        shipping_cost: shippingCost,
        currency: currency,
        payment_type: paymentTitle,
        shipping_type: appliedShipping?.title || "Standard Shipping",
        status: "Processing",
        payment_status: "Pending",
        transaction_id: "",
        membership: isLoggedInMember ? "Yes" : "No",
        membership_discount: isLoggedInMember ? 10 : 0,
        coupon_id: appliedCoupon?.couponId || null,
        shipping_details: shippingDetails,
        billing_details: billingDetails,
        comment: "",
      };

      const res = await axios.post(`${API_BASE_URL}/orders/save`, orderData);

      if (res.data?.status === true) {
        setPlacedOrderDetails(res.data.data);
        setOrderPlaced(true);
        toast.success("Order placed successfully!");
        clearCart();
      } else {
        toast.error(res.data?.msg || "Failed to place order");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.msg || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
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
                {placedOrderDetails?.order_number || "ORD-XXXX"}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    House / Flat No. *
                  </label>
                  <input
                    type="text"
                    placeholder="House/Flat No."
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
                    Street / Area *
                  </label>
                  <input
                    type="text"
                    placeholder="Street/Area"
                    required
                    value={newAddress.street}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, street: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Near, Opposite to..."
                    value={newAddress.landmark}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, landmark: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                  />
                </div>
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    placeholder="State"
                    required
                    value={newAddress.state}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, state: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    placeholder="Pincode"
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
                    Phone *
                  </label>
                  <input
                    type="tel"
                    placeholder="Mobile Number"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    House / Flat No. *
                  </label>
                  <input
                    type="text"
                    placeholder="House/Flat No."
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
                    Street / Area *
                  </label>
                  <input
                    type="text"
                    placeholder="Street/Area"
                    required
                    value={newBillingAddress.street}
                    onChange={(e) =>
                      setNewBillingAddress({
                        ...newBillingAddress,
                        street: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Near, Opposite to..."
                    value={newBillingAddress.landmark}
                    onChange={(e) =>
                      setNewBillingAddress({
                        ...newBillingAddress,
                        landmark: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-primary"
                  />
                </div>
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    placeholder="State"
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
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    placeholder="Pincode"
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
                    Phone *
                  </label>
                  <input
                    type="tel"
                    placeholder="Mobile Number"
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
      <header className="bg-gradient-to-r from-primary to-primary-dark shadow-sm">
        {/* Logo row — centered */}
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-center">
          <Link to="/" className="flex items-center group">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl border-2 border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-xl">
                <img
                  src={logoImg}
                  alt="Bagchee"
                  className="w-10 h-10 object-contain"
                  style={{
                    filter:
                      "brightness(0) saturate(100%) invert(45%) sepia(89%) saturate(2448%) hue-rotate(165deg) brightness(95%) contrast(101%)",
                  }}
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-2xl font-semibold text-white tracking-wider uppercase font-montserrat">
                  Bagchee
                </span>
                <span className="text-[9px] font-medium tracking-[0.2em] text-white/80 uppercase font-montserrat">
                  Books That Stick
                </span>
              </div>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 py-8">
        {/* Page title */}


        {/* Guest sign-in prompt */}
        {/* {!user && (
          <p className="text-center text-sm text-gray-500 mb-6">
            <Link
              to="/login"
              className="text-primary font-bold hover:underline"
            >
              SIGN IN
            </Link>{" "}
            for a faster checkout experience, or you can continue as a guest.{" "}
            You will be able to create an account during checkout.
          </p>
        )} */}

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
                          key={addr._id}
                          onClick={() => {
                            setSelectedAddress(addr);
                            if (sameAsShipping) setSelectedBillingAddress(addr);
                          }}
                          className={`bg-cream-100 border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden cursor-pointer ${selectedAddress?._id === addr._id ? "border-primary ring-2 ring-primary/20" : "border-gray-200"}`}
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
                              {addr.name}
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
                                handleEditAddress(addr);
                              }}
                              className="flex-1 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300"
                            >
                              <Edit size={13} /> Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAddress(addr._id);
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
                    <p className="text-xs text-gray-500 mt-1.5">
                      Have an account?{" "}
                      <Link
                        to="/login"
                        className="text-primary font-bold hover:underline"
                      >
                        Log in
                      </Link>
                    </p>
                  </div>
                  <div>
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
                    placeholder="Address line"
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
                          d.setDate(d.getDate() + option.maxDayLimit);
                          return d.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          });
                        })()
                        : null;
                    return (
                      <label
                        key={option._id}
                        className={`flex items-center justify-between px-4 py-3 border cursor-pointer transition-all ${appliedShipping?._id === option._id ? "border-primary bg-blue-50" : "border-gray-200 hover:border-primary"}`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="checkoutShipping"
                            checked={appliedShipping?._id === option._id}
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
                  PAYMENT
                </h2>
              </div>
              <div className="p-5 space-y-2">
                {loadingPayments ? (
                  <p className="text-sm text-gray-400 text-center py-2">
                    Loading payment methods...
                  </p>
                ) : paymentMethods.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No payment methods available
                  </p>
                ) : (
                  paymentMethods.map((method) => {
                    const isSelected = selectedPayment?._id === method._id;
                    const isCC = isCreditCardMethod(method);
                    return (
                      <div
                        key={method._id}
                        className={`border transition-all overflow-hidden rounded ${isSelected ? "border-primary" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        {/* Method row */}
                        <label className="flex items-center gap-4 px-4 py-3 cursor-pointer w-full">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={isSelected}
                            onChange={() => setSelectedPayment(method)}
                            className="w-4 h-4 text-primary border-gray-300 focus:ring-primary shrink-0"
                          />
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {method.image ? (
                              <img
                                src={
                                  method.image.startsWith("http")
                                    ? method.image
                                    : `${API_BASE_URL}${method.image}`
                                }
                                alt={method.title}
                                className="h-6 w-auto max-w-[60px] object-contain shrink-0"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            ) : null}
                            <span className="font-bold text-text-main text-sm">
                              {method.title}
                            </span>
                          </div>
                          {/* Card type logos on the right when credit card */}

                        </label>

                        {/* Additional text for selected payment method */}
                        {isSelected &&
                          method.isAdditionalTextActive &&
                          method.additionalText && (
                            <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                              <div
                                className="text-sm text-gray-600 pt-3 rich-content"
                                dangerouslySetInnerHTML={{
                                  __html: method.additionalText,
                                }}
                              />
                            </div>
                          )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

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
                            key={addr._id}
                            onClick={() => setSelectedBillingAddress(addr)}
                            className={`bg-cream-100 border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden cursor-pointer ${selectedBillingAddress?._id === addr._id ? "border-primary ring-2 ring-primary/20" : "border-gray-200"}`}
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
                                {addr.name}
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
                                  handleDeleteBillingAddress(addr._id);
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

            {/* ─── CONTINUE TO PAY ─── */}
            <div className="bg-cream-100 border border-gray-200 shadow-sm p-5 text-center space-y-3">
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-primary text-white py-3.5 font-bold text-sm uppercase tracking-wider hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed font-montserrat flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  "CONTINUE TO PAY"
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
                    {formatPriceFixed(subtotal)}
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
                        +{formatPriceFixed(currentMembershipCost)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-green-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Check size={14} />
                        <span>Member Savings ({memberDiscountPercent}% OFF applied)</span>
                      </div>
                      <span>
                        -{formatPriceFixed(memberDiscount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Shipping Display Fix */}
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-gray-600">Shipping</span>
                  <span className={`font-bold ${shippingCost === 0 ? "text-primary animate-pulse" : ""}`}>
                    {shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}
                  </span>
                </div>

                {/* Promo code */}
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs font-bold text-primary text-center mb-2">
                    Use a promotion Code
                  </p>
                  {!appliedCoupon ? (
                    <div className="flex gap-0">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) =>
                          setPromoInput(e.target.value.toUpperCase())
                        }
                        placeholder="Enter promo code"
                        className="flex-1 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-primary"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon}
                        className="bg-primary text-white px-4 py-2 text-xs font-bold hover:bg-primary-dark transition-colors disabled:opacity-70 font-montserrat uppercase"
                      >
                        {applyingCoupon ? "..." : "Apply"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200">
                      <div className="flex items-center gap-1.5">
                        <Tag className="text-green-600 shrink-0" size={14} />
                        <span className="text-xs font-bold text-green-800">
                          {appliedCoupon.code} (
                          {appliedCoupon.discountType === "fixed"
                            ? formatPrice(appliedCoupon.discount)
                            : `${appliedCoupon.discount}% off`}
                          )
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X size={14} />
                      </button>
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
                              return d.toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              });
                            })()
                            : null;
                        return (
                          <label
                            key={option._id}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="rightShipping"
                              checked={appliedShipping?._id === option._id}
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
                              {price === 0 ? "Free" : formatPrice(price)}
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Total (tax incl.)
                    </span>
                    <span className="text-2xl font-bold text-text-main">
                      {formatPrice(total)}
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
                        src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png"
                        alt="Visa"
                        className="h-2.5 object-contain"
                      />
                    </div>
                    <div className="h-5 w-8 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg"
                        alt="MC"
                        className="h-2.5 object-contain"
                      />
                    </div>
                    <div className="h-5 w-8 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/5/57/Discover_Card_logo.svg"
                        alt="Discover"
                        className="h-2.5 object-contain"
                      />
                    </div>
                    <div className="h-5 w-8 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg"
                        alt="Amex"
                        className="h-2.5 object-contain"
                      />
                    </div>
                    <div className="h-5 w-8 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
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
                      key={item._id}
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
                        {formatPrice(item.price * item.quantity)}
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
