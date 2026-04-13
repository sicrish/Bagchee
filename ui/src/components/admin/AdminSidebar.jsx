'use client';

import React, { useState, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight, LogOut, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); // Mobile Menu State
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop Shrink State

  const menuItems = [
    { name: "Home page", path: "/admin" },
    { name: "Products", path: "/admin/products" },
    { name: "Products types", path: "/admin/product-types" },
    { name: "Categories", path: "/admin/categories" },
    { name: "Navigation", path: "/admin/navigation" },
    { name: "Authors", path: "/admin/authors" },
    { name: "Coupons", path: "/admin/coupons" },
    { name: "Languages", path: "/admin/languages" },
    { name: "Tags", path: "/admin/tags" },
    { name: "Formats", path: "/admin/formats" },
    { name: "Publishers", path: "/admin/publishers" },
    { name: "Series", path: "/admin/series" },
    { name: "Pages", path: "/admin/pages" },
    { name: "Help pages", path: "/admin/help-pages" },
    { name: "Socials", path: "/admin/socials" },
    { name: "Orders", path: "/admin/orders" },
    { name: "Order status", path: "/admin/order-status" },
    { name: "Reviews", path: "/admin/reviews" },
    { name: "Couriers", path: "/admin/couriers" },
    { name: "Shipping", path: "/admin/shipping-options" },
    { name: "Payments", path: "/admin/payments" },
    { name: "Users", path: "/admin/users" },
    { name: "NewsLetter subs", path: "/admin/newsletter-subs" },
    { name: "Meta", path: "/admin/meta-tags" },
    { name: "Setting", path: "/admin/settings" },
  ];

  // 🟢 LOGOUT FUNCTION (Optimized with useCallback)
  const handleLogout = useCallback(() => {
    // 1. Clear LocalStorage
    localStorage.removeItem('token');
    localStorage.removeItem('admin');

    // 2. Show Success Message
    toast.success("Logged out successfully");

    // 3. Redirect to Login Page
    navigate('/login');
  }, [navigate]);

  const handleLinkClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* 🟢 1. MOBILE TOGGLE BUTTON */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-primary text-white p-2 rounded shadow-lg hover:bg-primary-hover transition-colors"
      >
        <Menu size={24} />
      </button>

      {/* 🟢 2. OVERLAY (Mobile Only) */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
        ></div>
      )}

      {/* 🟢 3. SIDEBAR CONTAINER */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 bg-text-main text-gray-300 shadow-2xl flex flex-col font-body
          transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:relative
          ${isCollapsed ? 'w-10' : 'w-60'}
        `}
      >
        
        {/* --- HEADER --- */}
        <div className={`
            flex items-center h-16 border-b border-gray-700 bg-black/20 font-display tracking-wide text-white transition-all
            ${isCollapsed ? 'justify-center px-0' : 'justify-between px-5'}
        `}>
          {!isCollapsed && (
            <span className="font-bold truncate text-lg animate-fadeIn">Admin</span>
          )}
          
          <button 
             onClick={() => setIsOpen(false)} 
             className="md:hidden hover:bg-white/10 p-1 rounded transition-colors"
          >
              <X size={20} />
          </button>

          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              hidden md:flex hover:bg-white/10 p-1.5 rounded transition-colors text-gray-400 hover:text-white
              ${isCollapsed ? 'mx-auto' : ''}
            `}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
              {isCollapsed ? <ChevronRight size={24} className="text-primary" /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* --- MENU LIST --- */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar ${isCollapsed ? 'hidden' : 'block'}`}>
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={index}>
                  <Link 
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`
                      flex items-center transition-all font-medium font-montserrat tracking-wide text-sm px-5 py-3 gap-3
                      ${isActive 
                        ? "bg-white/10 text-primary border-r-4 border-primary" 
                        : "hover:bg-white/5 hover:text-primary hover:border-r-4 hover:border-primary border-r-4 border-transparent"
                      }
                    `}
                  >
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* --- FOOTER --- */}
        <div className={`p-4 border-t border-gray-700 bg-black/20 ${isCollapsed ? 'hidden' : 'block'}`}>
            <button 
            onClick={handleLogout}
              className="flex items-center text-sm font-bold text-gray-400 hover:text-primary transition-colors uppercase font-montserrat w-full gap-2 px-2"
            >
               <LogOut size={18} /> 
               <span>Logout</span>
            </button>
        </div>
      </div>
    </>
  );
};

export default memo(AdminSidebar); // 🟢 Memoized for Performance