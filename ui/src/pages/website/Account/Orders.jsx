import React, { useEffect, useState, useContext,useMemo } from 'react';
import { Package, Loader2, Eye, ShoppingBag, Clock, CheckCircle, Truck, XCircle, RefreshCw, X, ExternalLink, Wallet, Calendar, Boxes,ChevronLeft,ChevronRight } from 'lucide-react';

import { Dialog, Transition, TransitionChild, DialogPanel } from '@headlessui/react';
import { Fragment } from 'react';
import axios from '../../../utils/axiosConfig';
import AccountLayout from '../../../layouts/AccountLayout';
import { CurrencyContext } from '../../../context/CurrencyContext';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate add kiya

const Orders = () => {

const navigate = useNavigate();

  // const [selectedOrder, setSelectedOrder] = useState(null);
  // const [isModalOpen, setIsModalOpen] = useState(false);
  const [productDetails, setProductDetails] = useState({}); // Cache for product details
  const { formatPrice } = useContext(CurrencyContext);


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;



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
        const items = order.items || order.products || [];
        items.forEach(p => {
          const pid = p.productId || p.product_id;
          if (pid && !p.product) fetchProductDetails(pid);
        });
      });
    }
  }, [orders]);

  const getProductInfo = (item) => {
    // Prisma includes nested product relation — use it first
    if (item.product) {
      let imageUrl = item.product.defaultImage || item.product.default_image || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${process.env.REACT_APP_API_URL}${imageUrl}`;
      }
      return {
        ...item,
        title: item.product.title || item.name,
        default_image: imageUrl,
        bagchee_id: item.product.bagcheeId || item.product.bagchee_id
      };
    }
    // Fallback: separately fetched details cache
    const pid = item.productId || item.product_id;
    const details = productDetails[pid];
    if (details) {
      let imageUrl = details.defaultImage || details.default_image || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${process.env.REACT_APP_API_URL}${imageUrl}`;
      }
      return {
        ...item,
        title: details.title || item.name,
        default_image: imageUrl,
        bagchee_id: details.bagcheeId || details.bagchee_id
      };
    }
    return item;
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
      case 'IN PROGRESS':
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
    return (order.total || 0) + (order.shippingCost ?? order.shipping_cost ?? 0);
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
        return new Intl.NumberFormat('en-US', {
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

  const activeOrders = orders.filter((order) => {
    const status = (order.status || '').toLowerCase();
    return status === 'processing' || status === 'payment pending' || status === 'not yet ordered' || status === 'pending';
  }).length;

  // 🟢 FRONTEND PAGINATION LOGIC
  const totalPages = Math.ceil(orders.length / itemsPerPage) || 1;
  const displayedOrders = orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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

          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length > 0 ? (
            displayedOrders.map((order) => (
              <div
                key={order.id || order._id}
                className="bg-cream-100 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-4 border-b border-gray-200 bg-cream-100/30">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-display font-bold text-text-main">
                          Order #
                          {order.orderNumber || order.order_number ||
                            String(order.id || order._id || '').slice(-8).toUpperCase()}
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
                        {formatDate(order.createdAt || order.created_at || order.date)}
                      </p>
                    </div>

                    {/* Header Actions */}
                    <div className="flex items-center gap-3">
                      <button
                       onClick={() => navigate(`/account/order-status/${order.id || order._id}`, { state: { orderData: order } })}
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
                          Currency: {order.currency || "USD"}
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
                        {(order.items || order.products) &&
                          (order.items || order.products).slice(0, 3).map((product, idx) => {
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
                        {(order.items || order.products) && (order.items || order.products).length > 3 && (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-medium text-text-muted">
                              +{(order.items || order.products).length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-text-main font-medium">
                          {(order.items || order.products)?.length || 0}{" "}
                          {(order.items || order.products)?.length === 1 ? "item" : "items"}
                        </p>
                        {/* <p className="text-sm text-text-muted">
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
                        </p> */}
                      </div>
                    </div>

                    {/* Quick View Book Details Links */}
                    {/* {order.products && order.products.length > 0 && (
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
                    )} */}
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


        {/* 🟢 PAGINATION BUTTONS (Product Listing Jaisi Same UI) */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center mt-10 mb-10 gap-3 font-montserrat">
            {/* FIRST PAGE BUTTON */}
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(1)}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                currentPage === 1
                  ? 'text-cream-200 border-cream-100 cursor-not-allowed'
                  : 'text-primary border-primary hover:bg-primary hover:text-white shadow-sm active:scale-95'
              }`}
              title="First Page"
            >
              <ChevronLeft size={18} strokeWidth={3} className="-mr-2" />
              <ChevronLeft size={18} strokeWidth={3} />
            </button>

            {/* PREV BUTTON */}
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className={`flex items-center gap-1 px-5 py-2.5 rounded-full border-2 font-bold text-[11px] uppercase tracking-widest transition-all ${
                currentPage === 1
                  ? 'text-cream-200 border-cream-100 cursor-not-allowed'
                  : 'text-primary border-primary hover:bg-primary hover:text-white shadow-md active:scale-95'
              }`}
            >
              <ChevronLeft size={16} strokeWidth={3} /> PREV
            </button>

            {/* PAGE NUMBERS */}
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-11 h-11 rounded-full font-display font-bold text-sm transition-all border-2 ${
                        currentPage === pageNum
                          ? 'bg-primary text-white border-primary shadow-lg scale-110 z-10'
                          : 'bg-white text-text-main border-cream-200 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} className="text-cream-200 px-1 font-black">...</span>;
                }
                return null;
              })}
            </div>

            {/* NEXT BUTTON */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className={`flex items-center gap-1 px-5 py-2.5 rounded-full border-2 font-bold text-[11px] uppercase tracking-widest transition-all ${
                currentPage === totalPages
                  ? 'text-cream-200 border-cream-100 cursor-not-allowed'
                  : 'text-primary border-primary hover:bg-primary hover:text-white shadow-md active:scale-95'
              }`}
            >
              NEXT <ChevronRight size={16} strokeWidth={3} />
            </button>

            {/* LAST PAGE BUTTON */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(totalPages)}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                currentPage === totalPages
                  ? 'text-cream-200 border-cream-100 cursor-not-allowed'
                  : 'text-primary border-primary hover:bg-primary hover:text-white shadow-sm active:scale-95'
              }`}
              title="Last Page"
            >
              <ChevronRight size={18} strokeWidth={3} />
              <ChevronRight size={18} strokeWidth={3} className="-ml-2" />
            </button>
          </div>
        )}
      </div>


    </AccountLayout>
  );
}
export default Orders;