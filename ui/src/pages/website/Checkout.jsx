import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, CheckCircle, Truck, ShoppingBag, Plus, Globe, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { CurrencyContext } from '../../context/CurrencyContext';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const { currency, setCurrency, formatPrice } = useContext(CurrencyContext);
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState(null);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
  const [user, setUser] = useState(null);
  const [currencies] = useState(['INR', 'EUR', 'GBP', 'USD']);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'Home',
    name: '',
    houseNo: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    phone: '',
    isDefault: false
  });

  useEffect(() => {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const parsedData = JSON.parse(authData);
      setUser(parsedData.userDetails);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchAddresses(user.id);
    }
  }, [user]);

  const fetchAddresses = async (userId) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL;
      const response = await axios.get(`${API_BASE_URL}/user/get-addresses?userId=${userId}`);
      if (response.data && response.data.addresses) {
        setAddresses(response.data.addresses);
        if (response.data.addresses.length > 0) {
          setSelectedAddress(response.data.addresses[0]);
          // Set billing address same as shipping by default
          setSelectedBillingAddress(response.data.addresses[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to save address');
      return;
    }

    const { name, phone, houseNo, street, city, state, pincode, country } = newAddress;
    if (!name || !phone || !houseNo || !street || !city || !state || !pincode) {
      toast.error('Please fill all required fields');
      return;
    }

    setSavingAddress(true);
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL;
      const addressData = {
        userId: user.id,
        type: newAddress.type,
        name,
        houseNo,
        street,
        landmark: newAddress.landmark,
        city,
        state,
        pincode,
        country,
        phone,
        isDefault: newAddress.isDefault
      };

      const response = await axios.post(`${API_BASE_URL}/user/add-address`, addressData);

      if (response.data && response.data.status) {
        toast.success('Address saved successfully');
        setShowAddressModal(false);
        setNewAddress({
          type: 'Home',
          name: '',
          houseNo: '',
          street: '',
          landmark: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India',
          phone: '',
          isDefault: false
        });
        fetchAddresses(user.id);
      } else {
        toast.error(response.data.msg || 'Failed to save address');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const subtotal = cartTotal;
  const shippingCost = subtotal > 500 ? 0 : 50;
  const total = subtotal + shippingCost;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    if (!sameAsShipping && !selectedBillingAddress) {
      toast.error('Please select a billing address');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      if (!user) {
        toast.error('User not found. Please login.');
        navigate('/login');
        return;
      }

      // Determine order status based on payment method
      const orderStatus = paymentMethod === 'cod' ? 'Processing' : 'Payment pending';
      
      // Get the billing address (same as shipping or different)
      const billingAddr = sameAsShipping ? selectedAddress : selectedBillingAddress;

      const orderData = {
        customer_id: user.id,
        products: cart.map(item => ({
          product_id: item._id || null,
          name: item.name || item.title || 'Book',
          price: item.price || 0,
          quantity: item.quantity || 1,
          status: 'Pending', // Initial status for each product
          courier: '',
          tracking_id: '',
          return_note: '',
          cancel_note: ''
        })),
        total: total,
        shipping_cost: shippingCost,
        currency: currency,
        payment_type: paymentMethod === 'cod' ? 'Cash on Delivery' : 
                     paymentMethod === 'card' ? 'Credit/Debit Card' : 
                     paymentMethod === 'paypal' ? 'PayPal' : 'Online Payment',
        shipping_type: shippingCost === 0 ? 'Free Shipping' : 'Standard Shipping',
        status: orderStatus,
        payment_status: paymentMethod === 'cod' ? 'Pending' : 'Awaiting Payment',
        transaction_id: '',
        membership: (user.membership === 'Yes' || user.membership === true) ? 'Yes' : 'No',
        membership_discount: user.membershipDiscount || 0,
        coupon_id: null, // TODO: Add coupon support from cart context
        shipping_details: {
          email: user.email || '',
          first_name: selectedAddress.name?.split(' ')[0] || selectedAddress.name || '',
          last_name: selectedAddress.name?.split(' ').slice(1).join(' ') || '',
          address_1: selectedAddress.houseNo && selectedAddress.street 
            ? `${selectedAddress.houseNo}, ${selectedAddress.street}` 
            : (selectedAddress.houseNo || selectedAddress.street || ''),
          address_2: selectedAddress.landmark || '',
          company: '',
          country: selectedAddress.country || 'India',
          state_region: selectedAddress.state || '',
          city: selectedAddress.city || '',
          postcode: selectedAddress.pincode || '',
          phone: selectedAddress.phone || ''
        },
        billing_details: {
          first_name: billingAddr.name?.split(' ')[0] || billingAddr.name || '',
          last_name: billingAddr.name?.split(' ').slice(1).join(' ') || '',
          address_1: billingAddr.houseNo && billingAddr.street 
            ? `${billingAddr.houseNo}, ${billingAddr.street}` 
            : (billingAddr.houseNo || billingAddr.street || ''),
          address_2: billingAddr.landmark || '',
          company: '',
          country: billingAddr.country || 'India',
          state_region: billingAddr.state || '',
          city: billingAddr.city || '',
          postcode: billingAddr.pincode || '',
          phone: billingAddr.phone || ''
        },
        comment: ''
      };

      const API_BASE_URL = process.env.REACT_APP_API_URL;
      const response = await axios.post(`${API_BASE_URL}/orders/save`, orderData);

      if (response.data && response.data.status === true) {
        // Success - update state first, then clear cart
        setPlacedOrderDetails(response.data.data);
        setOrderPlaced(true);
        toast.success('Order placed successfully!');
        clearCart();
      } else {
        console.error('Order failed with response:', response.data);
        toast.error(response.data?.msg || 'Failed to place order');
      }
    } catch (error) {
      
      // Only show error toast if order wasn't created
      if (error.response?.status === 500 || error.response?.status === 400) {
        toast.error(error.response?.data?.msg || 'Failed to create order. Please try again.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm text-center max-w-md w-full border border-gray-200">
          <ShoppingBag className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-text-main mb-2">Your cart is empty</h2>
          <p className="text-text-muted mb-6">Add some books to your cart to proceed with checkout.</p>
          <Link to="/" className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors">
            Browse Books
          </Link>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold text-text-main mb-2">Order Confirmed!</h2>
          <p className="text-text-muted mb-8">Thank you for your purchase. Your order has been placed successfully.</p>
          
          <div className="bg-white rounded-xl p-6 mb-8 text-left border border-gray-200">
            <div className="flex justify-between mb-2">
              <span className="text-text-muted">Order Number:</span>
              <span className="font-bold text-text-main">{placedOrderDetails?.order_number || 'ORD-XXXX'}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-text-muted">Date:</span>
              <span className="font-medium text-text-main">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-text-muted">Total Amount:</span>
              <span className="font-bold text-text-main">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Payment Method:</span>
              <span className="font-medium text-text-main uppercase">
                {paymentMethod === 'cod' ? 'Cash on Delivery' : 
                 paymentMethod === 'card' ? 'Credit/Debit Card' : 
                 paymentMethod === 'paypal' ? 'PayPal' : 'Online Payment'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link to="/account/orders" className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors">
              View My Orders
            </Link>
            <Link to="/" className="w-full bg-white border border-gray-200 text-text-main py-3 rounded-lg font-medium hover:bg-white transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-xl font-display font-bold text-text-main">
                Add New Address
              </h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} className="text-text-muted" />
              </button>
            </div>
            <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Address Type *
                </label>
                <select
                  value={newAddress.type}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  required
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newAddress.name}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Full Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={newAddress.phone}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Mobile Number"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">
                    House/Flat No. *
                  </label>
                  <input
                    type="text"
                    value={newAddress.houseNo}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, houseNo: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="House/Flat No."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">
                    Street/Area *
                  </label>
                  <input
                    type="text"
                    value={newAddress.street}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, street: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Street/Area"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={newAddress.landmark}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, landmark: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="Near, Opposite to..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, city: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={newAddress.state}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, state: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="State"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={newAddress.pincode}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, pincode: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Pincode"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={newAddress.country}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, country: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Country"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="defaultAddress"
                  checked={newAddress.isDefault}
                  onChange={(e) =>
                    setNewAddress({
                      ...newAddress,
                      isDefault: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label
                  htmlFor="defaultAddress"
                  className="text-sm text-text-muted"
                >
                  Set as default address
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-text-main rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-70"
                >
                  {savingAddress ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/cart"
                className="text-text-muted hover:text-text-main transition-colors"
              >
                <ArrowLeft size={24} />
              </Link>
              <Link
                to="/"
                className="text-2xl font-display font-bold text-text-main tracking-tight"
              >
                Bagchee
              </Link>
            </div>

            <div className="flex items-center gap-6">
              {/* Currency Selector */}
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
              <div className="text-sm font-medium text-text-muted">
                Secure Checkout
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Delivery Address */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <h2 className="text-xl font-display font-bold text-text-main">
                    Delivery Address
                  </h2>
                </div>
                {user && (
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="text-sm text-text-muted hover:text-primary flex items-center gap-1 font-medium"
                  >
                    <Plus size={16} /> Add New
                  </button>
                )}
              </div>

              {!user ? (
                <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-200">
                  <MapPin className="w-10 h-10 text-text-muted mx-auto mb-3" />
                  <p className="text-text-muted mb-4">
                    Please login to checkout
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                  >
                    Login to Continue
                  </Link>
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-200">
                  <MapPin className="w-10 h-10 text-text-muted mx-auto mb-3" />
                  <p className="text-text-muted mb-4">
                    No addresses found. Please add one.
                  </p>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                  >
                    <Plus size={18} /> Add New Address
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      onClick={() => {
                        setSelectedAddress(addr);
                        // If same as shipping is checked, also set billing address
                        if (sameAsShipping) {
                          setSelectedBillingAddress(addr);
                        }
                      }}
                      className={`relative cursor-pointer p-4 rounded-lg border-2 transition-all ${
                        selectedAddress?._id === addr._id
                          ? "border-primary bg-white"
                          : "border-gray-200 hover:border-primary"
                      }`}
                    >
                      {selectedAddress?._id === addr._id && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle size={20} className="text-primary" />
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <MapPin
                          className="text-text-muted mt-1 shrink-0"
                          size={18}
                        />
                        <div>
                          <p className="font-bold text-text-main">
                            {addr.name}
                          </p>
                          <p className="text-sm text-text-muted mt-1">
                            {addr.houseNo}, {addr.street}
                          </p>
                          {addr.landmark && (
                            <p className="text-sm text-text-muted italic">
                              ({addr.landmark})
                            </p>
                          )}
                          <p className="text-sm text-text-muted">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="text-sm text-text-muted mt-1">
                            Phone: {addr.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Link
                    to="/account/address"
                    className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary hover:bg-white transition-colors text-text-muted hover:text-primary min-h-[140px]"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowAddressModal(true);
                    }}
                  >
                    <Plus size={24} className="mb-2" />
                    <span className="font-medium">Add New Address</span>
                  </Link>
                </div>
              )}
            </div>

            {/* 2. Billing Address */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <h2 className="text-xl font-display font-bold text-text-main">
                    Billing Address
                  </h2>
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-primary transition-all">
                  <input
                    type="checkbox"
                    checked={sameAsShipping}
                    onChange={(e) => {
                      setSameAsShipping(e.target.checked);
                      if (e.target.checked && selectedAddress) {
                        setSelectedBillingAddress(selectedAddress);
                      } else if (!e.target.checked) {
                        setSelectedBillingAddress(null);
                      }
                    }}
                    className="w-5 h-5 text-primary border-gray-300 focus:ring-primary rounded"
                  />
                  <span className="font-medium text-text-main">
                    Same as shipping address
                  </span>
                </label>
              </div>

              {!sameAsShipping && user && (
                <div className="grid md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      onClick={() => setSelectedBillingAddress(addr)}
                      className={`relative cursor-pointer p-4 rounded-lg border-2 transition-all ${
                        selectedBillingAddress?._id === addr._id
                          ? "border-primary bg-white"
                          : "border-gray-200 hover:border-primary"
                      }`}
                    >
                      {selectedBillingAddress?._id === addr._id && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle size={20} className="text-primary" />
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <MapPin
                          className="text-text-muted mt-1 shrink-0"
                          size={18}
                        />
                        <div>
                          <p className="font-bold text-text-main">
                            {addr.name}
                          </p>
                          <p className="text-sm text-text-muted mt-1">
                            {addr.houseNo}, {addr.street}
                          </p>
                          {addr.landmark && (
                            <p className="text-sm text-text-muted italic">
                              ({addr.landmark})
                            </p>
                          )}
                          <p className="text-sm text-text-muted">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="text-sm text-text-muted mt-1">
                            Phone: {addr.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Payment Method */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <h2 className="text-xl font-display font-bold text-text-main">
                  Payment Method
                </h2>
              </div>

              <div className="space-y-4">
                {/* Credit/Debit Card */}
                <div 
                  className={`border rounded-xl transition-all overflow-hidden ${
                    paymentMethod === "card"
                      ? "border-primary bg-white ring-1 ring-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <label className="flex items-center gap-4 p-4 cursor-pointer w-full">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "card" ? "bg-primary/10 text-primary" : "bg-gray-100 text-text-muted"}`}>
                        <CreditCard size={20} />
                      </div>
                      <span className="font-bold text-text-main">Credit or Debit Card</span>
                    </div>
                    <div className="hidden sm:flex gap-2 opacity-60 grayscale">
                       <div className="h-6 w-10 bg-gray-200 rounded"></div>
                       <div className="h-6 w-10 bg-gray-200 rounded"></div>
                       <div className="h-6 w-10 bg-gray-200 rounded"></div>
                    </div>
                  </label>
                  
                  {paymentMethod === "card" && (
                    <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/30 space-y-4 animate-fadeIn">
                      <div className="space-y-4">
                         <div>
                           <label className="block text-sm font-medium text-text-muted mb-1.5">Card Number</label>
                           <div className="relative">
                             <input
                              type="text"
                              placeholder="0000 0000 0000 0000"
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white transition-all placeholder:text-gray-300"
                              value={cardDetails.number}
                              onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                             />
                             <CreditCard size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                           </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-text-muted mb-1.5">Expiry Date</label>
                              <input
                                type="text"
                                placeholder="MM / YY"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white transition-all placeholder:text-gray-300"
                                value={cardDetails.expiry}
                                onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-text-muted mb-1.5">CVC / CVV</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="123"
                                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white transition-all placeholder:text-gray-300"
                                  value={cardDetails.cvc}
                                  onChange={(e) => setCardDetails({...cardDetails, cvc: e.target.value})}
                                />
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-help" title="3 digits on back of card">
                                   <div className="w-5 h-5 border border-gray-300 rounded-full flex items-center justify-center text-[10px] font-bold">?</div>
                                </div>
                              </div>
                            </div>
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-text-muted mb-1.5">Name on Card</label>
                           <input
                            type="text"
                            placeholder="e.g. John Doe"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white transition-all placeholder:text-gray-300"
                            value={cardDetails.name}
                            onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                           />
                         </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PayPal */}
                <div 
                  className={`border rounded-xl transition-all overflow-hidden ${
                    paymentMethod === "paypal"
                      ? "border-primary bg-white ring-1 ring-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <label className="flex items-center gap-4 p-4 cursor-pointer w-full">
                    <input
                      type="radio"
                      name="payment"
                      value="paypal"
                      checked={paymentMethod === "paypal"}
                      onChange={() => setPaymentMethod("paypal")}
                      className="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "paypal" ? "bg-primary/10 text-primary" : "bg-gray-100 text-text-muted"}`}>
                        <Globe size={20} />
                      </div>
                      <span className="font-bold text-text-main">PayPal</span>
                    </div>
                  </label>
                  
                  {paymentMethod === "paypal" && (
                    <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/30 animate-fadeIn">
                       <div className="text-center py-4">
                         <p className="text-sm text-text-muted mb-2">You will be redirected to PayPal to complete your purchase securely.</p>
                       </div>
                    </div>
                  )}
                </div>

                {/* Cash on Delivery */}
                <div 
                  className={`border rounded-xl transition-all overflow-hidden ${
                    paymentMethod === "cod"
                      ? "border-primary bg-white ring-1 ring-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <label className="flex items-center gap-4 p-4 cursor-pointer w-full">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "cod" ? "bg-primary/10 text-primary" : "bg-gray-100 text-text-muted"}`}>
                        <Truck size={20} />
                      </div>
                      <div>
                        <span className="font-bold text-text-main block">Cash on Delivery</span>
                      </div>
                    </div>
                  </label>
                  {paymentMethod === "cod" && (
                    <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/30 animate-fadeIn">
                       <p className="text-sm text-text-muted">Pay cash when your order is delivered to your doorstep.</p>
                    </div>
                  )}
                </div>
                
                {/* Remember Me */}
                <div className="pt-2 px-1">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input 
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:border-primary checked:bg-primary hover:border-primary focus:ring-0 focus:ring-offset-0 transition-all"
                          />
                          <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white transition-opacity" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <span className="text-sm text-text-muted group-hover:text-text-main transition-colors select-none">Save my payment info for faster checkout</span>
                    </label>
                </div>

              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-24 hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-display font-bold text-text-main">
                  Order Summary
                </h3>
                <p className="text-sm text-text-muted">
                  {cart.length} {cart.length === 1 ? "item" : "items"}
                </p>
              </div>

              {/* Cart Items */}
              <div className="max-h-80 overflow-y-auto p-4 border-b border-gray-200 space-y-4">
                {cart.map((item) => (
                  <div key={item._id} className="flex gap-3">
                    <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden shrink-0">
                      <img
                        src={item.default_image || item.image || "https://placehold.co/100x140?text=No+Image"}
                        alt={item.name || item.title || "Product"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/100x140?text=No+Image";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-main truncate">
                        {item.name || item.title || "Product"}
                      </p>
                      <p className="text-xs text-text-muted">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-bold text-text-main mt-1">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Shipping</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-primary font-medium">FREE</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-text-main">
                      Total
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(total)}
                    </span>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={
                      loading ||
                      !selectedAddress ||
                      (!sameAsShipping && !selectedBillingAddress)
                    }
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold text-lg hover:bg-primary-dark transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </button>
                  <p className="text-xs text-center text-text-muted mt-3 flex items-center justify-center gap-1">
                    <CheckCircle size={12} /> Secure Checkout
                  </p>
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
