'use client';

import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; 
import DashboardCard from '../../components/admin/DashboardCard';

// 🟢 SAFE IMPORTS: Native names clash se bachne ke liye 'Image' ki jagah 'ImageIcon' use karte hain
import { 
  Sliders, List, Type, ShoppingBag, Percent, 
  Newspaper, Image as ImageIcon, Users, LayoutTemplate 
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate(); 
  
  // 🚀 OPTIMIZATION 1: Navigation function ko memoize kiya
  // Isse har card ke liye naya function memory mein nahi banega (Speed boost)
  const handleNavigate = useCallback((path) => {
    if (path) navigate(path);
  }, [navigate]);

  // 🚀 OPTIMIZATION 2: useMemo ka use kiya
  // Iska matlab hai ki jab bhi admin dashboard par state change hogi,
  // ye lamba chauda array dobara calculate nahi hoga. 
  const cards = useMemo(() => [
    { title: "SLIDER", icon: Sliders, link: "/admin/home-slider" },
    { title: "SECTIONS TITLES", icon: Type, link: "/admin/titles" },
    { title: "FEATURED TODAY", icon: ShoppingBag, link: "/admin/home-section-1" },
    { title: "IN THE SPOTLIGHT", icon: ShoppingBag, link: "/admin/home-section-2" },
    { title: "SALE TODAY", icon: Percent, link: "/admin/sale-today" },
    { title: "NEW AND NOTEWORTHY", icon: Newspaper, link: "/admin/new-and-noteworthy" },
    { title: "BestSellers", icon: Newspaper, link: "/admin/home-best-seller" },
    { title: "Books of the Month", icon: Newspaper, link: "/admin/books-of-the-month" },

    // 🟢 BUG FIX: Yahan 'Image' ki jagah 'ImageIcon' use kiya gaya hai
    { title: "side banner1", icon: ImageIcon, link: "/admin/side-banner-one" }, 
    { title: "side banner2", icon: ImageIcon, link: "/admin/side-banner-two" },

    { title: "CATEGORIES", icon: List, link: "/admin/main-categories" }, 
    { title: "TOP AUTHORS", icon: Users, link: "/admin/top-authors" },
    { title: "FOOTER", icon: LayoutTemplate, link: "/admin/footer" },
  ], []);

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto">
      
      {/* Page Title */}
      <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-text-main font-display mb-2">
            Hello, admin!
          </h1>
          <p className="text-text-muted font-montserrat text-sm tracking-widest uppercase">
            Welcome to your control panel
          </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards.map((card, index) => (
          <DashboardCard 
            key={index}
            title={card.title}
            icon={card.icon}
            // 🟢 Optimized handler pass kiya
            onClick={() => handleNavigate(card.link)} 
          />
        ))}
      </div>

    </div>
  );
};

export default AdminDashboard;