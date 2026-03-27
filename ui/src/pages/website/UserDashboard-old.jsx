'use client';

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, User, MapPin, Heart, CreditCard, Gift, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../../components/common/Logo.jsx';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profileImg, setProfileImg] = useState(null);


  const API_BASE_URL = import.meta.env.REACT_APP_API_URL

  // 1. Page Load Check
  useEffect(() => {
    const authData = localStorage.getItem("auth");
    
    if (authData) {
      const parsedData = JSON.parse(authData);
      const userData = parsedData.userDetails;
      setUser(userData); 

      if (userData.profileImage && userData.profileImage !== "") {
        // 🖼️ Logic: Agar URL full hai (Cloudinary) to wahi dikhao, 
        // warna backend URL ke sath path jodo (Local)
        const finalUrl = userData.profileImage.startsWith('http') 
            ? userData.profileImage 
            : `${API_BASE_URL}${userData.profileImage}`;
            
        setProfileImg(finalUrl);
      } else {
        setProfileImg(null); 
      }
    } else {
      navigate("/login");
    }
  }, [navigate, API_BASE_URL]);

  // 2. Logout Function
  const handleLogout = () => {
    localStorage.removeItem("auth"); 
    toast.success("Logged out successfully");
    navigate("/login"); 
  };

  const dashboardItems = [
    { title: "ORDERS", desc: "Check your order status", icon: <Package size={48} />, link: "/account/orders" },
    { title: "PROFILE", desc: "Edit personal details", icon: <User size={48} />, link: "/account/profile" },
    { title: "ADDRESS", desc: "Manage shipping address", icon: <MapPin size={48} />, link: "/account/address" },
    { title: "WISHLIST", desc: "Your favorite items", icon: <Heart size={48} />, link: "/account/wishlist" },
    { title: "MEMBERSHIP", desc: "View membership benefits", icon: <CreditCard size={48} />, link: "/membership" },
    { title: "E-GIFT Certificates", desc: "Redeem or buy cards", icon: <Gift size={48} />, link: "/account/gift-cards" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-body flex flex-col">
      
      {/* --- HEADER LOGO --- */}
      <div className="py-8 flex justify-center border-b border-primary-dark bg-gradient-to-r from-primary to-primary-dark shadow-md">
         <div className="text-white">
            <Logo className="h-20 w-auto text-white" />
         </div>
      </div>

      {/* --- SUB NAV --- */}
      <div className="bg-white border-b border-gray-200 py-4 shadow-sm">
        <div className="container mx-auto flex flex-wrap justify-center gap-6 md:gap-12 text-sm md:text-base font-bold tracking-widest uppercase font-montserrat text-text-main">
          
          <Link to="/account/orders" className="hover:text-primary transition-colors">Your Orders</Link>
          <Link to="/account" className="text-primary transition-colors">Your Account</Link>
          <Link to="/" className="hover:text-primary transition-colors">Bagchee.com</Link>
          
        </div>
      </div>

      {/* --- WELCOME SECTION --- */}
      <div className="container mx-auto px-4 py-12 text-center flex-grow">
        
        <div className="w-28 h-28 bg-white rounded-full mx-auto mb-5 flex items-center justify-center border-4 border-primary shadow-xl text-primary overflow-hidden relative">
             
             {/* 🟢 IMAGE vs ICON LOGIC (With Safety Check) */}
             {profileImg ? (
                 <img 
                    src={profileImg} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                        // Agar image load fail ho jaye to Icon show karo
                        e.target.style.display = 'none'; 
                        setProfileImg(null); 
                    }}
                 />
             ) : (
                 <User size={50} className="text-gray-400" />
             )}

        </div>

        <h1 className="text-3xl font-bold text-text-main font-display mb-2">
          Welcome, {user?.name || "User"}
        </h1>
        
        <button onClick={handleLogout} className="text-base font-bold text-text-muted hover:text-red-500 flex items-center justify-center gap-2 mx-auto transition-colors font-montserrat">
          (Sign Out <LogOut size={16} />)
        </button>

        <p className="text-text-muted text-base mt-4 font-body max-w-lg mx-auto">
          Manage your orders, personal details, and account settings from your dashboard.
        </p>

        {/* --- GRID CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 max-w-7xl mx-auto">
          {dashboardItems.map((item, index) => (
            <Link to={item.link} key={index} className="bg-white p-10 min-h-[240px] rounded-2xl shadow-[0_4px_25px_rgb(0,0,0,0.06)] border border-gray-100 flex flex-col items-center justify-center text-center gap-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300 relative z-10">
                {item.icon}
              </div>
              <div className="relative z-10 space-y-2">
                <h3 className="text-2xl font-bold text-text-main uppercase font-montserrat group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-base text-text-muted font-body">{item.desc}</p>
              </div>
              <span className="text-sm font-bold text-primary uppercase tracking-wide group-hover:text-primary-dark mt-2 border-b-2 border-transparent group-hover:border-primary transition-all">Click Here</span>
            </Link>
          ))}
        </div>
      </div>

      {/* --- FOOTER STRIP --- */}
      <div className="bg-text-main text-white py-6 mt-8 border-t-8 border-primary">
        <div className="container mx-auto w-full max-w-2xl flex flex-wrap justify-between items-center px-6 text-sm font-bold tracking-widest uppercase font-montserrat">
          <Link to="/help" className="hover:text-accent transition-colors">Help</Link>
          <Link to="/services" className="hover:text-accent transition-colors">Services</Link>
          <Link to="/company" className="hover:text-accent transition-colors">Company</Link>
        </div>
      </div>

    </div>
  );
};

export default UserDashboard;