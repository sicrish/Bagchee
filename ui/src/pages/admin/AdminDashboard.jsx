import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import {
  TrendingUp, ShoppingBag, BookOpen, PlusCircle, Users, Star, Loader2, ArrowRight,
  Sliders, Type, Percent, Newspaper, Image as ImageIcon, List, LayoutTemplate, Settings
} from 'lucide-react';

const money = (n) =>
  '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const Stars = ({ value = 0 }) => (
  <span className="inline-flex">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={13} className={i <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
    ))}
  </span>
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/dashboard/summary`);
        if (active && res.data?.status) setData(res.data.data);
      } catch (err) {
        console.error('Dashboard load failed:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const sales = data?.sales || {};
  const salesCards = [
    { label: 'This Month', value: sales.currentMonth },
    { label: 'Last Month', value: sales.lastMonth },
    { label: 'Last Year', value: sales.lastYear },
  ];

  const quickLinks = [
    { label: 'Books', to: '/admin/books', icon: BookOpen },
    { label: 'Add a Book', to: '/admin/add-book', icon: PlusCircle },
    { label: 'Orders', to: '/admin/orders', icon: ShoppingBag },
  ];

  // Home Page settings — manage the storefront home page. The sidebar "Home page"
  // link lands on /admin, so these shortcuts must live here.
  const homeSettings = [
    { label: 'Slider', to: '/admin/home-slider', icon: Sliders },
    { label: 'Section Titles', to: '/admin/titles', icon: Type },
    { label: 'Featured Today', to: '/admin/home-section-1', icon: ShoppingBag },
    { label: 'In the Spotlight', to: '/admin/home-section-2', icon: ShoppingBag },
    { label: 'Sale Today', to: '/admin/sale-today', icon: Percent },
    { label: 'New & Noteworthy', to: '/admin/new-and-noteworthy', icon: Newspaper },
    { label: 'Bestsellers', to: '/admin/home-best-seller', icon: Newspaper },
    { label: 'Books of the Month', to: '/admin/books-of-the-month', icon: BookOpen },
    { label: 'Side Banner 1', to: '/admin/side-banner-one', icon: ImageIcon },
    { label: 'Side Banner 2', to: '/admin/side-banner-two', icon: ImageIcon },
    { label: 'E-Gift Card Banner', to: '/admin/e-gift-card-banner', icon: ImageIcon },
    { label: 'Categories', to: '/admin/main-categories', icon: List },
    { label: 'Top Authors', to: '/admin/top-authors', icon: Users },
    { label: 'Footer', to: '/admin/footer', icon: LayoutTemplate },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-main font-display">Hello, admin!</h1>
        <p className="text-text-muted text-sm">Here's how the store is doing.</p>
      </div>

      {/* Sales figures */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {salesCards.map((c) => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">{c.label}</p>
              <TrendingUp size={16} className="text-primary" />
            </div>
            <p className="text-2xl font-black text-text-main">{money(c.value)}</p>
            <p className="text-[10px] text-text-muted mt-1">Sales (excl. cancelled)</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {quickLinks.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="flex items-center gap-3 bg-primary hover:bg-primary-dark text-white rounded-xl px-5 py-4 shadow-sm transition-colors"
          >
            <q.icon size={20} />
            <span className="font-bold text-sm uppercase tracking-wide">{q.label}</span>
            <ArrowRight size={16} className="ml-auto opacity-80" />
          </Link>
        ))}
      </div>

      {/* Home Page Settings — manage storefront home page content */}
      <div className="mb-10">
        <h2 className="font-bold text-text-main mb-3 flex items-center gap-2"><Settings size={16} className="text-primary" /> Home Page Settings</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {homeSettings.map((h) => (
            <Link key={h.to} to={h.to} className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm hover:border-primary hover:shadow transition-all">
              <h.icon size={16} className="text-primary shrink-0" />
              <span className="text-sm font-semibold text-text-main">{h.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="font-bold text-text-main flex items-center gap-2"><ShoppingBag size={16} className="text-primary" /> Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs font-bold text-primary hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {(data?.recentOrders || []).length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No orders yet.</p>}
            {(data?.recentOrders || []).map((o) => (
              <Link key={o.id} to={`/admin/edit-orders/${o.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-blue-50/40 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-main truncate">{o.customerName}</p>
                  <p className="text-[11px] text-text-muted truncate">{o.orderNumber} · {o.country}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-text-main">{o.currency} {Number(o.total || 0).toFixed(2)}</p>
                  <p className="text-[10px] text-text-muted">{fmtDate(o.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Users */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="font-bold text-text-main flex items-center gap-2"><Users size={16} className="text-primary" /> Recent Users</h2>
            <Link to="/admin/users" className="text-xs font-bold text-primary hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {(data?.recentUsers || []).length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No users yet.</p>}
            {(data?.recentUsers || []).map((u) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm font-semibold text-text-main truncate">{u.name}</p>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-xs text-text-muted">{u.country}</p>
                  <p className="text-[10px] text-text-muted">{fmtDate(u.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Reviews */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="font-bold text-text-main flex items-center gap-2"><Star size={16} className="text-primary" /> Recent Reviews</h2>
            <Link to="/admin/reviews" className="text-xs font-bold text-primary hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {(data?.recentReviews || []).length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No reviews yet.</p>}
            {(data?.recentReviews || []).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3 gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    {!r.active && <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Pending</span>}
                  </div>
                  <p className="text-[12px] text-text-main truncate mt-0.5">{r.title || '(no title)'}{r.productTitle ? ` — ${r.productTitle}` : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-text-muted truncate max-w-[140px]">{r.name}</p>
                  <p className="text-[10px] text-text-muted">{fmtDate(r.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
