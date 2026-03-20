import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Heart,
  MapPin,
  ChevronRight,
  Clock,
  Wallet,
} from "lucide-react";
import AccountLayout from "../../layouts/AccountLayout";
import axiosInstance from "../../utils/axiosConfig";
import { CurrencyContext } from "../../context/CurrencyContext";

const UserDashboard = () => {
  const { formatPrice } = useContext(CurrencyContext);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    wishlistItems: 0,
    savedAddresses: 0,
    lifetimeValue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

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
        params: { customer_id: userId },
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
      const pendingOrders = normalizedOrders.filter((order) => {
        const normalizedStatus = (order.status || "").toLowerCase();
        return (
          normalizedStatus === "payment pending" ||
          normalizedStatus === "processing" ||
          normalizedStatus === "not yet ordered"
        );
      }).length;

      const lifetimeValue = normalizedOrders.reduce((sum, order) => {
        const subtotal = Number(order.total || order.totalAmount || 0);
        const shipping = Number(order.shipping_cost || 0);
        return sum + subtotal + shipping;
      }, 0);

      setStats({
        totalOrders: normalizedOrders.length,
        pendingOrders,
        wishlistItems: wishlist.length,
        savedAddresses: addresses.length,
        lifetimeValue,
      });

      // Get recent 5 orders
      setRecentOrders(normalizedOrders.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const normalizedStatus = (status || "").toLowerCase();
    const colors = {
      "not yet ordered": "text-gray-700 bg-gray-100",
      "payment pending": "text-yellow-700 bg-yellow-100",
      processing: "text-blue-700 bg-blue-100",
      shipped: "text-indigo-700 bg-indigo-100",
      delivered: "text-green-700 bg-green-100",
      cancelled: "text-red-700 bg-red-100",
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
    return status
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
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
        <div className="mb-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Hello, {user?.name || "User"} 👋
          </h1>
          <p className="text-text-muted mt-1">Welcome back to your account</p>
        </div>

        <div className="bg-cream-100 border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-text-muted mb-1">Lifetime spend</p>
          <p className="text-2xl font-bold text-text-main">
            {formatPrice(stats.lifetimeValue)}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Based on all your placed orders
          </p>
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
                    <p className="text-sm text-gray-600">
                      {getOrderItems(order).length}{" "}
                      {getOrderItems(order).length === 1 ? "item" : "items"} •{" "}
                      {formatPrice(getOrderTotal(order))}
                    </p>
                    <Link
                      to="/account/orders"
                      className="text-sm text-primary hover:text-primary-dark font-medium"
                    >
                      View Details
                    </Link>
                  </div>
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
    </AccountLayout>
  );
};

export default UserDashboard;
