import React, { useEffect, useState, useContext,useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, Loader2, Eye, ShoppingBag, Clock, CheckCircle, Truck, XCircle, RefreshCw, X, ExternalLink, Wallet, Calendar, Boxes } from 'lucide-react';
import { Dialog, Transition, TransitionChild, DialogPanel } from '@headlessui/react';
import { Fragment } from 'react';
import axios from '../../../utils/axiosConfig';
import AccountLayout from '../../../layouts/AccountLayout';
import { CurrencyContext } from '../../../context/CurrencyContext';
import { useQuery } from '@tanstack/react-query';

const Orders = () => {
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productDetails, setProductDetails] = useState({}); // Cache for product details
  const { formatPrice } = useContext(CurrencyContext);
  

  



  // 1. Get User ID safely (useMemo performance ke liye best hai)
  const userId = useMemo(() => {
    const authData = localStorage.getItem('auth');
    if (!authData) return null;
    const parsedData = JSON.parse(authData);
    return parsedData.userDetails?.id || parsedData.userDetails?._id;
  }, []);

  // 🟢 2. REACT QUERY: Ye akela hook loading aur data dono handle kar lega
  const { data: orders = [], isLoading: loading } = useQuery({
    queryKey: ['my-orders', userId], 
    queryFn: async () => {
      if (!userId) return [];
      const res = await axios.get('/orders/my-orders', {
        params: { customer_id: userId }
      });
      return res.data.status ? (res.data.data || []) : [];
    },
    enabled: !!userId, // Sirf tabhi chalega jab userId milegi
  });



  const fetchProductDetails = async (productId) => {
    if (!productId || productDetails[productId]) return;
    try {
      let response;
      try { response = await axios.get(`/product/fetch?id=${productId}`); }
      catch { response = await axios.get(`/product/fetch?bagchee_id=${productId}`); }
      if (response.data.status && response.data.data) {
        const productData = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
        setProductDetails(prev => ({ ...prev, [productId]: productData }));
      }
    } catch (error) { console.error(error); }
  };

  // Jab orders load ho jayein, tab details fetch karein
  React.useEffect(() => {
    if (orders.length > 0) {
      orders.forEach(order => {
        order.products?.forEach(p => p.product_id && fetchProductDetails(p.product_id));
      });
    }
  }, [orders]);

  const getProductInfo = (product) => {
    const details = productDetails[product.product_id];
    if (details) {
      // Ensure default_image has full URL
      let imageUrl = details.default_image;
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${process.env.REACT_APP_API_URL}${imageUrl}`;
      }
      
      return {
        ...product,
        title: details.title || product.name,
        default_image: imageUrl,
        bagchee_id: details.bagchee_id
      };
    }
    return product;
  };

  // Generate book detail link in correct format: /books/:bagcheeId/:slug
  const getBookDetailLink = (productInfo) => {
    const bagcheeId = productInfo.bagchee_id;
    if (!bagcheeId) return null;
    const title = productInfo.title || productInfo.name || 'book';
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `/books/${bagcheeId}/${slug}`;
  };

  const getStatusIcon = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'payment pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'payment pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getOrderTotal = (order) => {
    return (order.total || 0) + (order.shipping_cost || 0);
  };

  const formatStatusLabel = (status) => {
    if (!status) return 'Pending';
    return status
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount, currencyCode) => {
    const numericAmount = Number(amount || 0);

    if (currencyCode) {
      try {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: currencyCode,
          maximumFractionDigits: 2
        }).format(numericAmount);
      } catch (error) {
        return formatPrice(numericAmount);
      }
    }

    return formatPrice(numericAmount);
  };

  const totalSpent = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const activeOrders = orders.filter((order) => {
    const status = (order.status || '').toLowerCase();
    return status === 'processing' || status === 'payment pending' || status === 'not yet ordered';
  }).length;

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <AccountLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12" />
          <p className="text-text-muted">Loading your orders...</p>
        </div>
      </AccountLayout>
    );
  }
  return (
    <AccountLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-text-main mb-2">
            My Orders
          </h1>
          <p className="text-text-muted">Track and manage your book orders</p>
        </div>

        {orders.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-cream-100 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-text-muted mb-1">Total Orders</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-text-main">
                  {orders.length}
                </p>
                <Boxes className="text-primary" size={20} />
              </div>
            </div>
            <div className="bg-cream-100 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-text-muted mb-1">Active Orders</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-text-main">
                  {activeOrders}
                </p>
                <Package className="text-primary" size={20} />
              </div>
            </div>
            <div className="bg-cream-100 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-text-muted mb-1">Total Spent</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-text-main">
                  {formatPrice(totalSpent)}
                </p>
                <Wallet className="text-primary" size={20} />
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div
                key={order._id}
                className="bg-cream-100 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-4 border-b border-gray-200 bg-cream-100/30">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-display font-bold text-text-main">
                          Order #
                          {order.order_number ||
                            order._id.slice(-8).toUpperCase()}
                        </h2>
                        <div
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          {formatStatusLabel(order.status)}
                        </div>
                      </div>
                      <p className="text-sm text-text-muted flex items-center gap-1.5">
                        <Calendar size={14} />
                        Placed on{" "}
                        {formatDate(order.createdAt || order.created_at)}
                      </p>
                    </div>

                    {/* Header Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openOrderDetails(order)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:text-primary-dark hover:bg-primary/5 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                      <div className="text-right">
                        <p className="text-sm text-text-muted">Order Total</p>
                        <p className="text-lg font-bold text-text-main">
                          {formatAmount(getOrderTotal(order), order.currency)}
                        </p>
                        <p className="text-xs text-text-muted">
                          Currency: {order.currency || "INR"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Products Preview */}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {order.products &&
                          order.products.slice(0, 3).map((product, idx) => {
                            const productInfo = getProductInfo(product);
                            const bookLink = getBookDetailLink(productInfo);
                            const ImageWrapper = bookLink ? Link : "div";
                            const wrapperProps = bookLink
                              ? {
                                  to: bookLink,
                                  className:
                                    "w-12 h-12 bg-gray-200 rounded-lg overflow-hidden border-2 border-white flex items-center justify-center hover:opacity-80 transition-opacity",
                                }
                              : {
                                  className:
                                    "w-12 h-12 bg-gray-200 rounded-lg overflow-hidden border-2 border-white flex items-center justify-center",
                                };

                            return (
                              <ImageWrapper key={idx} {...wrapperProps}>
                                {productInfo.default_image ? (
                                  <img
                                    src={productInfo.default_image}
                                    alt={productInfo.title || "Product"}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextSibling.style.display =
                                        "block";
                                    }}
                                  />
                                ) : null}
                                <ShoppingBag
                                  className="w-6 h-6 text-gray-400"
                                  style={{
                                    display: productInfo.default_image
                                      ? "none"
                                      : "block",
                                  }}
                                />
                              </ImageWrapper>
                            );
                          })}
                        {order.products && order.products.length > 3 && (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-medium text-text-muted">
                              +{order.products.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-text-main font-medium">
                          {order.products?.length || 0}{" "}
                          {order.products?.length === 1 ? "item" : "items"}
                        </p>
                        <p className="text-sm text-text-muted">
                          {order.products && order.products.length > 0
                            ? order.products
                                .slice(0, 2)
                                .map((p) => {
                                  const info = getProductInfo(p);
                                  return info.title || info.name;
                                })
                                .join(", ") +
                              (order.products.length > 2 ? "..." : "")
                            : "No products"}
                        </p>
                      </div>
                    </div>

                    {/* Quick View Book Details Links */}
                    {order.products && order.products.length > 0 && (
                      <div className="hidden md:flex items-center gap-2">
                        {order.products.slice(0, 2).map((product, idx) => {
                          const productInfo = getProductInfo(product);
                          const bookLink = getBookDetailLink(productInfo);

                          if (!bookLink) return null;

                          return (
                            <Link
                              key={idx}
                              to={bookLink}
                              className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark hover:underline transition-colors"
                              title={`View ${productInfo.title || "Book"} Details`}
                            >
                              <ExternalLink size={12} />
                              <span className="hidden lg:inline">
                                {productInfo.title || "Book"}
                              </span>
                            </Link>
                          );
                        })}
                        {order.products.length > 2 && (
                          <span className="text-xs text-text-muted">
                            +{order.products.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-cream-100 rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-2xl font-display font-bold text-text-main mb-2">
                No Orders Yet
              </h3>
              <p className="text-text-muted mb-8 max-w-md mx-auto">
                Looks like you haven't placed any orders yet. Start exploring
                our collection of amazing books!
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-lg hover:bg-primary-dark transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                <ShoppingBag size={20} />
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
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
                                  const productInfo = getProductInfo(product);
                                  const bookLink =
                                    getBookDetailLink(productInfo);

                                  return (
                                    <div
                                      key={idx}
                                      className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                      {/* Product Image */}
                                      <Link
                                        to={bookLink || "#"}
                                        className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden hover:opacity-80 transition-opacity"
                                      >
                                        {productInfo.default_image ? (
                                          <img
                                            src={productInfo.default_image}
                                            alt={productInfo.title || "Product"}
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
                                              to={bookLink || "#"}
                                              className="hover:text-primary transition-colors"
                                            >
                                              <h4 className="font-medium text-text-main truncate">
                                                {productInfo.title ||
                                                  productInfo.name ||
                                                  "Book"}
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
}
export default Orders;

