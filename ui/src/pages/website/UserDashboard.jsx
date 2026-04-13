import React, { useEffect, useState, useContext,useRef } from "react";
import { Link,useNavigate } from "react-router-dom";
import {
  Package,
  Heart,
  MapPin,
  ChevronRight,
  Clock,
  Wallet,
} from "lucide-react";
// Purane imports ke sath ise jodein
import { Dialog, Transition, TransitionChild, DialogPanel } from '@headlessui/react';
import { Fragment } from 'react';
import { Eye, X, Calendar, ShoppingBag, Truck, CheckCircle, RefreshCw, XCircle, Boxes, ExternalLink, Award, User, ChevronDown, AlertCircle } from 'lucide-react';
import AccountLayout from "../../layouts/AccountLayout";
import axiosInstance from "../../utils/axiosConfig";
import { CurrencyContext } from "../../context/CurrencyContext";


// 🟢 Helper for Membership Dates
  const formatMembershipDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

// 🟢 Ise component level par rakhein (Line 145 ke baad)
const formatAmount = (amount, currencyCode) => {
  const numericAmount = Number(amount || 0);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 2
    }).format(numericAmount);
  } catch (error) {
    return `${currencyCode || 'USD'} ${numericAmount.toFixed(2)}`;
  }
};

const getProductInfo = (product) => {
  // 🟢 Database mein product.image ke naam se save ho raha hai
  let imageUrl = product.image;

  if (imageUrl && !imageUrl.startsWith('http')) {
    // Backend API URL se base path nikalein (e.g. http://localhost:5000)
    const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '');
    imageUrl = `${API_BASE}/${imageUrl.replace(/^\//, '')}`;
  }

  return {
    ...product,
    title: product.name,
    default_image: imageUrl,
    bagchee_id: product.product_id // Link ke liye product_id use karenge
  };
};


const UserDashboard = () => {
  const { formatPrice } = useContext(CurrencyContext);
const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    wishlistItems: 0,
    savedAddresses: 0,

  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);


  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  // 🟢 NAYA: Membership Dropdown Logic & Expiry Calculation
  const [isMembershipMenuOpen, setIsMembershipMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMembershipMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 30 Days Check Logic
  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysRemaining(user?.membershipEnd);
  const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;

  

  // 🟢 NAYA: Modal Handlers
  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };


  useEffect(() => {
    const authData = localStorage.getItem("auth");
    if (authData) {
      const parsedData = JSON.parse(authData);
      setUser(parsedData.userDetails);
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const authData = localStorage.getItem("auth");
      const parsedData = authData ? JSON.parse(authData) : null;
      const userId =
        parsedData?.userDetails?.id || parsedData?.userDetails?._id;

      if (!userId) {
        setLoading(false);
        return;
      }

      // Fetch orders
      const ordersResponse = await axiosInstance.get("/orders/my-orders", {
        params: {
          customer_id: userId,
          page: 1,      // Dashboard ke liye hamesha pehla page
          limit: 5
        },
      });
      const orders = Array.isArray(ordersResponse?.data?.data)
        ? ordersResponse.data.data
        : Array.isArray(ordersResponse?.data?.orders)
          ? ordersResponse.data.orders
          : [];


      // Fetch wishlist
      const wishlistResponse = await axiosInstance.get("/user/get-wishlist", {
        params: { userId },
      });
      const wishlist = wishlistResponse.data.wishlist || [];

      // Fetch addresses
      const addressResponse = await axiosInstance.get("/user/get-addresses", {
        params: { userId },
      });
      const addresses = addressResponse.data.addresses || [];

      const normalizedOrders = [...orders].sort((a, b) => {
        const firstDate = new Date(a.created_at || a.createdAt || 0).getTime();
        const secondDate = new Date(b.created_at || b.createdAt || 0).getTime();
        return secondDate - firstDate;
      });

      // Calculate stats
      // 🟢 Active Orders Logic: Delivered/Cancelled ko chhod kar
      const pendingOrders = normalizedOrders.filter((order) => {
        const s = (order.status || "").toLowerCase();
        return s !== "delivered" && s !== "cancelled" && s !== "returned";
      }).length;

      // 🟢 Total Spent: Backend currency aur total use karke
      const totalSpent = normalizedOrders.reduce((sum, order) => sum + (order.total || 0), 0);






      setStats({
        totalOrders: ordersResponse.data.total || 0,
        pendingOrders,
        wishlistItems: wishlist.length,
        savedAddresses: addresses.length,

      });

      // Get recent 5 orders
      setRecentOrders(normalizedOrders.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };


  const getStatusIcon = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'payment pending':
        return <Clock className="w-4 h-4" />;
      case 'IN PROGRESS':
        return <RefreshCw className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };


  const getBookDetailLink = (product) => {
    const id = product.bagcheeId || product.bagchee_id || product.product_id || product.id || product._id;
    if (!id) return "#";

    const title = product.name || product.title || 'book';
    // 🟢 Real-time slug generation
    const slug = title.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `/books/${id}/${slug}`;
  };



  const getStatusColor = (status) => {
    const normalizedStatus = (status || "").toLowerCase();
    const colors = {
      "pending": "text-yellow-700 bg-yellow-100",
      "approval pending": "text-amber-700 bg-amber-100",
      "payment pending": "text-orange-700 bg-orange-100",
      "processing": "text-blue-700 bg-blue-100",
      "in progress": "text-blue-700 bg-blue-100",
      "shipped": "text-indigo-700 bg-indigo-100",
      "delivered": "text-green-700 bg-green-100",
      "completed": "text-green-700 bg-green-100",
      "cancelled": "text-red-700 bg-red-100",
      "returned": "text-purple-700 bg-purple-100",
    };
    return colors[normalizedStatus] || "text-gray-700 bg-gray-100";
  };

  const getOrderTotal = (order) => {
    const subtotal = Number(order.total || order.totalAmount || 0);
    const shipping = Number(order.shipping_cost || 0);
    return subtotal + shipping;
  };

  const getOrderItems = (order) => {
    if (Array.isArray(order.products)) return order.products;
    if (Array.isArray(order.items)) return order.items;
    return [];
  };

  const formatOrderDate = (order) => {
    const sourceDate = order.created_at || order.createdAt;
    if (!sourceDate) return "Date unavailable";

    return new Date(sourceDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatStatusLabel = (status) => {
    if (!status) return "Pending";
    // Pehla letter Capital baaki small (e.g. processing -> Processing)
    return status.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const StatCard = ({ value, label, icon: Icon, link }) => (
    <Link
      to={link}
      className="bg-cream-100 rounded-lg p-6 border border-gray-200 hover:border-primary hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
        <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Icon
            className="text-gray-600 group-hover:text-primary transition-colors"
            size={24}
          />
        </div>
      </div>
    </Link>
  );

  return (
    <AccountLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        {/* Welcome & Membership Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-gray-200/60 pb-6 relative z-30">
          {/* Left: Greeting */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-gray-900">
              Hello, {user?.name || "User"} 👋
            </h1>
            <p className="text-text-muted mt-1 font-body">Welcome back to your account</p>
          </div>

          {/* Right: ONLY SHOW IF MEMBERSHIP IS ACTIVE */}
          {user?.membership === "active" && (
            <div className="relative flex flex-col items-end" ref={dropdownRef}>
              
              {/* 1. Clickable Trigger Button */}
              <button 
                onClick={() => setIsMembershipMenuOpen(!isMembershipMenuOpen)}
                className="relative overflow-hidden bg-gradient-to-r from-primary to-primary-dark rounded-xl p-3 sm:p-4 shadow-lg border border-primary/50 min-w-[240px] sm:min-w-[260px] flex items-center justify-between group transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 text-left"
              >
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl pointer-events-none"></div>
                
                <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shrink-0">
                    <Award className="text-accent w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-montserrat font-bold text-accent uppercase tracking-widest mb-0.5">
                      Bagchee
                    </p>
                    <p className="text-white text-sm sm:text-base font-display font-bold flex items-center gap-2">
                      Member
                    </p>
                  </div>
                </div>

                <ChevronDown 
                  className={`text-white/70 transition-transform duration-300 ${isMembershipMenuOpen ? 'rotate-180' : ''}`} 
                  size={20} 
                />
              </button>

              {/* 🌟 30-Day Warning Banner (Outside the dropdown, directly visible) */}
              {isExpiringSoon && (
                <div className="mt-2 w-full bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-start gap-2 shadow-sm animate-fadeInRight">
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-xs font-bold text-red-700 uppercase font-montserrat tracking-tight">Expiring Soon!</p>
                    <p className="text-[11px] text-red-600 mt-0.5 font-body leading-tight">Your membership expires in <span className="font-bold">{daysLeft} days</span>.</p>
                  </div>
                </div>
              )}

              {/* 2. Dropdown Menu (Only Date Details, No Links) */}
              <Transition
                show={isMembershipMenuOpen}
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1 scale-95"
                enterTo="opacity-100 translate-y-0 scale-100"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 scale-100"
                leaveTo="opacity-0 translate-y-1 scale-95"
              >
                <div className="absolute right-0 top-[70px] mt-2 w-full sm:w-[320px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden origin-top-right z-50">
                  
                  {/* Date Details */}
                  <div className="p-4 space-y-3 font-body bg-cream-50">
                    <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
                      <span className="text-sm text-text-muted font-medium">Membership start</span>
                      <span className="text-sm font-bold text-text-main">{formatMembershipDate(user?.membershipStart)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-sm text-text-muted font-medium">membership end</span>
                      <span className={`text-sm font-bold ${isExpiringSoon ? 'text-red-600' : 'text-text-main'}`}>
                        {formatMembershipDate(user?.membershipEnd)}
                      </span>
                    </div>
                  </div>
                  
                </div>
              </Transition>
            </div>
          )}
        </div>



        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-cream-100 rounded-lg p-6 border border-gray-200 animate-pulse"
              >
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              value={stats.totalOrders}
              label="Total Orders"
              icon={Package}
              link="/account/orders"
            />
            <StatCard
              value={stats.pendingOrders}
              label="Active Orders"
              icon={Clock}
              link="/account/orders"
            />
            <StatCard
              value={stats.wishlistItems}
              label="Wishlist Items"
              icon={Heart}
              link="/account/wishlist"
            />
            <StatCard
              value={stats.savedAddresses}
              label="Saved Addresses"
              icon={MapPin}
              link="/account/address"
            />
          </div>
        )}

        {!loading && (
          <div className="bg-cream-100 rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="text-primary" size={18} />
              <p className="font-semibold text-text-main">Quick Summary</p>
            </div>
            <p className="text-sm text-text-muted">
              You have{" "}
              <span className="font-semibold text-text-main">
                {stats.pendingOrders}
              </span>{" "}
              active order{stats.pendingOrders === 1 ? "" : "s"} and{" "}
              <span className="font-semibold text-text-main">
                {stats.wishlistItems}
              </span>{" "}
              saved wishlist item{stats.wishlistItems === 1 ? "" : "s"}.
            </p>
          </div>
        )}

        {/* Recent Orders */}
        <div className="bg-cream-100 rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-main">
                Recent Orders
              </h2>
              <Link
                to="/account/orders"
                className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
              >
                View All
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </div>
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="p-6 hover:bg-cream-200/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Order #
                        {order.order_number ||
                          order.orderId ||
                          order._id?.slice(-8)?.toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatOrderDate(order)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                    >
                      {formatStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 font-medium">
                      {getOrderItems(order).length}{" "}
                      {getOrderItems(order).length === 1 ? "item" : "items"} •{" "}
                      <span className="text-text-main font-bold">
                        {order.currency || 'USD'} {Number(order.total || 0).toFixed(2)}
                      </span>
                    </p>
                    <button
                     onClick={() => navigate(`/account/order-status/${order._id || order.id}`, { state: { orderData: order } })}
                      className="text-sm text-primary hover:text-primary-dark font-bold uppercase tracking-tighter"
                    >
                      View Details
                    </button>
                  </div>
                  {/* Payment link for approved deferred orders */}
                  {(order.status || '').toLowerCase() === 'payment pending' && (order.paymentLink || order.payment_link) && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between gap-3">
                      <p className="text-xs text-orange-700 font-medium">Payment link ready</p>
                      <a
                        href={order.paymentLink || order.payment_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-black text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded transition-colors uppercase tracking-wide"
                      >
                        Pay Now →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Package className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-600 mb-4">No orders yet</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium"
              >
                Start Shopping
                <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>


      {/* 🟢 NAYA: Order Details Modal (Same as Orders Page) */}
      <Transition show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeOrderDetails}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </TransitionChild>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-cream-100 shadow-xl transition-all">
                  {selectedOrder && (
                    <>
                      {/* Modal Header */}
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <h2 className="text-2xl font-display font-bold text-text-main">
                              Order #
                              {selectedOrder.order_number ||
                                selectedOrder._id.slice(-8).toUpperCase()}
                            </h2>
                            <p className="text-sm text-text-muted mt-1">
                              Placed on{" "}
                              {new Date(
                                selectedOrder.createdAt ||
                                selectedOrder.created_at,
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <button
                            onClick={closeOrderDetails}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>

                      {/* Modal Body */}
                      <div className="p-6 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Products Section */}
                          <div className="lg:col-span-2 space-y-4">
                            <h3 className="font-semibold text-text-main mb-3">
                              {selectedOrder.products?.length || 0}{" "}
                              {selectedOrder.products?.length === 1
                                ? "Item"
                                : "Items"}{" "}
                              Ordered
                            </h3>

                            <div className="space-y-4">
                              {selectedOrder.products &&
                                selectedOrder.products.length > 0 ? (
                                selectedOrder.products.map((product, idx) => {
                                  const productInfo = getProductInfo(product); // 🟢 Data normalize kiya
                                  const bookLink = getBookDetailLink(productInfo);

                                  return (
                                    <div
                                      key={idx}
                                      className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                      {/* Product Image */}
                                      <Link
                                        to={bookLink}
                                        className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden hover:opacity-80 transition-opacity"
                                      >
                                        {productInfo.default_image ? (
                                          <img
                                            src={productInfo.default_image}
                                            alt={productInfo.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.target.style.display = "none";
                                              e.target.nextSibling.style.display =
                                                "block";
                                            }}
                                          />
                                        ) : null}
                                        <ShoppingBag
                                          className="w-8 h-8 text-gray-400"
                                          style={{
                                            display: productInfo.default_image
                                              ? "none"
                                              : "block",
                                          }}
                                        />
                                      </Link>

                                      {/* Product Details */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                          <div className="flex-1">
                                            <Link
                                              to={bookLink}
                                              className="hover:text-primary transition-colors"
                                            >
                                              <h4 className="font-medium text-text-main truncate">
                                                {productInfo.title ||
                                                  productInfo.name}
                                              </h4>
                                            </Link>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-text-muted">
                                              <span>
                                                Qty: {product.quantity}
                                              </span>
                                              <span className="font-medium text-primary">
                                                {formatAmount(
                                                  product.price,
                                                  selectedOrder.currency,
                                                )}
                                              </span>
                                              {product.status && (
                                                <span
                                                  className={`px-2 py-0.5 rounded text-xs ${getStatusColor(product.status)}`}
                                                >
                                                  {formatStatusLabel(
                                                    product.status,
                                                  )}
                                                </span>
                                              )}
                                            </div>
                                            {product.tracking_id && (
                                              <p className="text-xs text-text-muted mt-1">
                                                Tracking: {product.tracking_id}
                                              </p>
                                            )}
                                          </div>

                                          {/* Product Actions */}
                                          <div className="flex gap-2">
                                            {bookLink ? (
                                              <Link
                                                to={bookLink}
                                                className="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                                              >
                                                View Book Details
                                              </Link>
                                            ) : (
                                              <span className="px-3 py-1.5 text-xs bg-gray-200 text-gray-500 rounded cursor-not-allowed">
                                                Product Unavailable
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-8">
                                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                  <p className="text-text-muted">
                                    No products found for this order
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Order Summary */}
                          <div className="space-y-4">
                            {/* Price Breakdown */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="font-semibold text-text-main mb-3">
                                Order Summary
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-text-muted">
                                    Subtotal:
                                  </span>
                                  <span className="font-medium text-text-main">
                                    {formatAmount(
                                      selectedOrder.total || 0,
                                      selectedOrder.currency,
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-muted">
                                    Shipping:
                                  </span>
                                  <span className="font-medium text-text-main">
                                    {formatAmount(
                                      selectedOrder.shipping_cost || 0,
                                      selectedOrder.currency,
                                    )}
                                  </span>
                                </div>
                                {selectedOrder.membership_discount > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-text-muted">
                                      Membership Discount:
                                    </span>
                                    <span className="font-medium text-green-600">
                                      -
                                      {formatAmount(
                                        selectedOrder.membership_discount,
                                        selectedOrder.currency,
                                      )}
                                    </span>
                                  </div>
                                )}
                                <div className="border-t border-gray-200 pt-2 mt-2">
                                  <div className="flex justify-between text-lg font-bold">
                                    <span className="text-text-main">
                                      Total:
                                    </span>
                                    <span className="text-primary">
                                      {formatAmount(
                                        getOrderTotal(selectedOrder),
                                        selectedOrder.currency,
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-xs text-text-muted mt-1">
                                    Order currency:{" "}
                                    {selectedOrder.currency || "INR"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Order Status */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="font-semibold text-text-main mb-3">
                                Order Status
                              </h4>
                              <div
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(selectedOrder.status)}`}
                              >
                                {getStatusIcon(selectedOrder.status)}
                                {formatStatusLabel(selectedOrder.status)}
                              </div>
                            </div>

                            {/* Payment Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="font-semibold text-text-main mb-3">
                                Payment Details
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-text-muted">
                                    Method:
                                  </span>
                                  <span className="font-medium text-text-main">
                                    {selectedOrder.payment_type ||
                                      "Not specified"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-muted">
                                    Status:
                                  </span>
                                  <span
                                    className={`font-medium ${selectedOrder.payment_status === "Paid" ? "text-green-600" : "text-yellow-600"}`}
                                  >
                                    {selectedOrder.payment_status || "Pending"}
                                  </span>
                                </div>
                                {selectedOrder.transaction_id && (
                                  <div className="flex justify-between">
                                    <span className="text-text-muted">
                                      Transaction ID:
                                    </span>
                                    <span className="font-mono text-xs text-text-main">
                                      {selectedOrder.transaction_id}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Shipping Address */}
                            {selectedOrder.shipping_details && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-text-main mb-3">
                                  Shipping Address
                                </h4>
                                <div className="text-sm text-text-muted space-y-1">
                                  <p className="font-medium text-text-main">
                                    {selectedOrder.shipping_details.first_name}{" "}
                                    {selectedOrder.shipping_details.last_name}
                                  </p>
                                  <p>
                                    {selectedOrder.shipping_details.address_1}
                                  </p>
                                  {selectedOrder.shipping_details.address_2 && (
                                    <p>
                                      {selectedOrder.shipping_details.address_2}
                                    </p>
                                  )}
                                  <p>
                                    {selectedOrder.shipping_details.city},{" "}
                                    {
                                      selectedOrder.shipping_details
                                        .state_region
                                    }{" "}
                                    {selectedOrder.shipping_details.postcode}
                                  </p>
                                  <p>
                                    {selectedOrder.shipping_details.country}
                                  </p>
                                  <p className="text-primary">
                                    📞 {selectedOrder.shipping_details.phone}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </AccountLayout>
  );
};

export default UserDashboard;
