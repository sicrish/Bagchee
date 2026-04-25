'use client';

import React, { useContext } from 'react';
import { useQuery } from '@tanstack/react-query'; // React Query hook
import { Check, Truck, Star, BookOpen, Smartphone, Globe, ArrowRight, UserPlus, ShoppingCart } from 'lucide-react';
import logoImg from '../../assets/images/common/logo.png';
import { CurrencyContext } from '../../context/CurrencyContext';
import axios from '../../utils/axiosConfig';
import { differenceInDays, isAfter } from 'date-fns';


const Membership = () => {

  const { formatPrice } = useContext(CurrencyContext);
  const API_BASE_URL = process.env.REACT_APP_API_URL;


  // ─── 🟢 1. FETCH USER DATA (For Membership Status) ───
  const { data: authData, isLoading: userLoading } = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/user/verify`);
        return res.data.success ? res.data.user : null;
      } catch (err) {
        return null; // Guest user case
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 min cache
  });


  // ─── 🟢 REACT QUERY: FETCH SETTINGS ───
  // Isse settings data cache ho jayega aur performance fast hogi
  const { data: settings, isLoading } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/settings/public`);
      if (res.data.status && res.data.data) {
        return res.data.data;
      }
      return null;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });



  // ─── 🟢 3. DYNAMIC STATUS RENDERER (Based on your 4 Images) ───
  const renderMembershipStatus = () => {
    if (userLoading) return <div className="animate-pulse h-10 w-32 bg-white/10 rounded-full"></div>;

    // IMAGE 1: Guest / Not Logged In
    if (!authData) {
      return (
        <div className="text-right">
          <p className="text-white/60 text-xs font-medium">
            Already subscribed to Meritus? <br />
            <a href="/login" className="text-white underline hover:text-accent transition-colors">Log in now</a>
          </p>
        </div>
      );
    }

    const today = new Date();
    const expiryDate = authData.membershipEnd ? new Date(authData.membershipEnd) : null;

    // Membership Active hai ya nahi check karein
    const isCurrentlyActive = authData.membership === 'active' && expiryDate && isAfter(expiryDate, today);
    const daysRemaining = expiryDate ? differenceInDays(expiryDate, today) : 0;

    // IMAGE 2: Active (> 30 Days)
    if (isCurrentlyActive && daysRemaining > 30) {
      return (
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Current status</span>
          <div className="bg-[#2ecc71] text-white px-8 py-1.5 rounded-md text-[11px] font-black tracking-tighter uppercase shadow-lg shadow-green-500/20">
            ACTIVE
          </div>
          <span className="text-[10px] text-gray-300 mt-1 font-bold italic">{daysRemaining} days remaining</span>
        </div>
      );
    }


    // IMAGE 3: Expires Soon (30 Days or Less)
    if (isCurrentlyActive && daysRemaining <= 30 && daysRemaining >= 0) {
      return (
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1 text-right">Current status</span>
          <div className="bg-[#f39c12] text-white px-6 py-1.5 rounded-md text-[11px] font-black tracking-tighter uppercase shadow-lg shadow-orange-500/20">
            EXPIRES SOON
          </div>
          <span className="text-[10px] text-orange-400 mt-1 font-black animate-pulse">{daysRemaining} days remaining</span>
        </div>
      );
    }


    // IMAGE 4: Inactive / Expired
    return (
      <div className="flex flex-col items-end">
        <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Current status</span>
        <div className="bg-[#e74c3c] text-white px-8 py-1.5 rounded-md text-[11px] font-black tracking-tighter uppercase shadow-lg shadow-red-500/20">
          INACTIVE
        </div>
      </div>
    );
  };



  // ─── 🟢 DYNAMIC PRICE HELPER ───
  const getMembershipPriceUI = () => {
    if (isLoading) return "---";
    if (!settings) return "N/A";

    return formatPrice(
      settings.membership_cost || 0,        // USD value
      settings.membership_cart_price || 0, // INR value
      settings.membership_cost || 0         // Real/Default value
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-body">

      {/* 🟢 HERO SECTION (Blue Background matching Image) */}
      {/* 🟢 HERO SECTION (Premium Brand Identity - No AI look) */}
      <div className="relative bg-[#0B2F3A] overflow-hidden">

        {/* Dynamic Status Display (Circle area in your images) */}
        <div className="relative md:absolute top-4 md:top-10 right-0 md:right-20 z-20 flex justify-center md:justify-end px-6 pt-4 md:pt-0">
          {renderMembershipStatus()}
        </div>

        {/* Subtle Brand Patterns - Graphic Designer Touch */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent opacity-50"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border-[1px] border-white/10"></div>
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full border-[1px] border-white/5 -translate-y-1/2"></div>

        <div className="container mx-auto px-6 py-20 md:py-15 flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">

          {/* Left Content: Bold Puma-style Typography */}
          <div className="w-full lg:w-3/5 text-white space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 px-4 py-2 rounded-full backdrop-blur-md">
              <Star size={16} className="text-accent fill-accent" />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-primary-50">Elite Access</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black font-display leading-[1.1] uppercase italic tracking-tight">
              Bagchee <br />
              <span className="text-primary italic">Membership</span> <br />
              <span className="text-white/40 text-3xl md:text-5xl tracking-tighter not-italic font-light">Save 10% Every day</span>
            </h1>

            <p className="text-lg md:text-xl font-body text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Buy the Bagchee Membership and get additional 10% off everytime you shop at Bagchee.com for a full year.

              Simply add your membership in your shopping bag and the 10% discount will be applied immediately to the items you are purcahseing today.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
              <button className="group bg-primary hover:bg-white text-white hover:text-primary py-5 px-12 rounded-full font-black uppercase tracking-slick text-sm transition-all duration-500 shadow-[0_20px_40px_-10px_rgba(0,141,218,0.5)] flex items-center gap-3">
                Join Now <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>

              <div className="flex flex-col items-center lg:items-start">
                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Annual Subscription</span>
                <span className="text-2xl font-black font-display text-accent italic">{getMembershipPriceUI()} <span className="text-sm opacity-50">/ Year</span></span>
              </div>
            </div>
          </div>

          {/* Right Content: Professional Graphic Design Styled Illustration (No AI) */}
          <div className="w-full lg:w-2/5 flex justify-center relative">
            <div className="relative w-full max-w-[400px]">
              {/* Layered Cards Styling like your Home Banner */}
              <div className="relative z-20 bg-white rounded-[2rem] p-8 shadow-2xl rotate-3 transform group hover:rotate-0 transition-transform duration-700">
                <div className="flex justify-between items-start mb-8">
                  <img src={logoImg} alt="Logo" className="h-6 object-contain grayscale opacity-50" />
                  {/* <div className="bg-accent px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter text-text-main italic">VIP Pass</div> */}
                </div>

                <div className="space-y-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <BookOpen size={40} className="text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-text-main font-display font-black text-3xl uppercase leading-none">Bagchee <br /> Member</h2>
                    <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest font-bold">Unlimited 10% Savings</p>
                  </div>
                </div>

                <div className="mt-12 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-primary"></div>
                </div>
              </div>

              {/* Decorative Secondary Layer Card */}
              <div className="absolute top-4 -left-4 w-full h-full bg-primary rounded-[2rem] -rotate-3 shadow-lg z-10 border border-white/10"></div>

              {/* Badge Overlay */}
              <div className="absolute -bottom-6 -right-6 z-30 animate-bounce">
                <div className="bg-accent text-text-main w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 border-[#0B2F3A] shadow-2xl shadow-accent/50">
                  <span className="text-xs font-black uppercase leading-none">Save</span>
                  <span className="text-2xl font-black italic leading-none">10%</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      {/* 🟢 BENEFITS CARDS SECTION */}
      <div className="container mx-auto px-4 py-16 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Card 1: Save Extra 10% (Teal/Green) */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
            <div className="h-48 bg-gradient-to-b from-[#4ecdc4] to-[#556270] flex items-center justify-center relative overflow-hidden">
              <div className="absolute w-64 h-64 bg-white/20 rounded-full -top-10 -right-10 blur-xl"></div>
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg z-10 text-[#4ecdc4]">
                <BookOpen size={48} />
              </div>
              <div className="absolute top-4 right-4 bg-red-500 text-white font-bold text-xs px-3 py-1 rounded-full shadow-md">10% OFF</div>
            </div>
            <div className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold text-gray-800 font-display">Save Extra 10% <br /> Everyday</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                This discount is in addition to our already great prices. This offer is valid for every item at Bagchee.com including Sale items. The discount does not apply to gift certificates.
              </p>
            </div>
          </div>

          {/* Card 2: Free Delivery (Orange/Red) */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden group hover:-translate-y-2 transition-transform duration-300 transform scale-105 md:scale-110 z-10 border-4 border-white">
            <div className="h-48 bg-gradient-to-b from-[#ff6b6b] to-[#ee5253] flex items-center justify-center relative overflow-hidden">
              <div className="absolute w-64 h-64 bg-white/20 rounded-full -bottom-10 -left-10 blur-xl"></div>
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg z-10 text-[#ff6b6b]">
                <Truck size={48} />
              </div>
              <div className="absolute top-4 right-4 bg-white text-[#ff6b6b] font-bold text-xs px-3 py-1 rounded-full shadow-md">FREE</div>
            </div>
            <div className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold text-gray-800 font-display">Free Worldwide <br /> Delivery</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Members get free air delivery worldwide on orders over $35 via Air. Orders over $250 shipped via courier.
              </p>
            </div>
          </div>

          {/* Card 3: Exclusive Benefits (Blue) */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
            <div className="h-48 bg-gradient-to-b from-[#54a0ff] to-[#2e86de] flex items-center justify-center relative overflow-hidden">
              <div className="absolute w-64 h-64 bg-white/20 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-xl"></div>
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg z-10 text-[#54a0ff]">
                <Star size={48} />
              </div>
              <div className="absolute top-4 right-4 bg-yellow-400 text-blue-900 font-bold text-xs px-3 py-1 rounded-full shadow-md">$35 / Year</div>
            </div>
            <div className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold text-gray-800 font-display">Exclusive Member <br /> Benefits</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Exclusive member-only offers and discount throughout the year. Recieve special offers and coupons, as well as find out about the hottest new releases in books, movies, music, author signing, bargains and more.
              </p>
            </div>
          </div>

        </div>
      </div>



      {/* 🟢 ULTRA-MODERN LAYERED STEPS SECTION */}
      <div className="bg-cream-50 py-24 border-t border-cream-200 overflow-hidden relative">
        {/* Background Subtle Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] -ml-64 -mb-64"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-text-main font-display mb-4 uppercase ">
              How it works
            </h2>
            <div className="flex items-center justify-center gap-4">
              <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-primary/40"></div>
              <p className="text-primary font-black text-xs md:text-sm uppercase tracking-[0.4em]">
                3 Easy Steps
              </p>
              <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-primary/40"></div>
            </div>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-20 md:gap-10 items-start max-w-7xl mx-auto">

            {/* 🟢 Desktop Flow Line */}
            <div className="hidden md:block absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent z-0"></div>

            {/* Step 1: Sign In */}
            <div className="flex flex-col items-center text-center group relative z-10">
              <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center mb-10">
                {/* Layered Card UI */}
                <div className="absolute inset-0 bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] rounded-[3rem] border border-gray-50 group-hover:rotate-6 transition-transform duration-500"></div>
                <div className="absolute inset-0 bg-primary/5 rounded-[3rem] rotate-[-6deg] group-hover:rotate-0 transition-transform duration-500 border border-primary/10"></div>

                <div className="relative flex flex-col items-center animate-float">
                  <div className="p-5 bg-white rounded-3xl shadow-sm border border-gray-50 mb-3">
                    <UserPlus size={48} className="text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    <img src={logoImg} alt="Bagchee" className="w-4 h-4 object-contain opacity-70" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Secure Entry</span>
                  </div>
                </div>
                <div className="absolute -top-4 -left-4 w-14 h-14 bg-white text-primary rounded-2xl flex items-center justify-center text-xl font-black shadow-xl border border-primary/10">01</div>
              </div>
              <h3 className="text-xl font-black text-text-main font-montserrat leading-tight px-4 group-hover:text-primary transition-colors">
                Create Account <br /> <span className="text-primary/50 font-medium lowercase italic">or Sign in</span>
              </h3>
            </div>

            {/* Step 2: Add to Cart */}
            <div className="flex flex-col items-center text-center group relative z-10">
              <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center mb-10">
                {/* Layered Card UI */}
                <div className="absolute inset-0 bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] rounded-[3rem] border border-gray-50 group-hover:rotate-6 transition-transform duration-500"></div>
                <div className="absolute inset-0 bg-secondary/5 rounded-[3rem] rotate-[-6deg] group-hover:rotate-0 transition-transform duration-500 border border-secondary/10"></div>

                <div className="relative animate-float" style={{ animationDelay: '0.2s' }}>
                  <div className="p-6 bg-white rounded-[2.5rem] shadow-sm border border-gray-50">
                    <ShoppingCart size={52} className="text-secondary" strokeWidth={1.5} />
                  </div>
                  <div className="absolute -bottom-3 -right-6 bg-accent text-text-main text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border-2 border-white tracking-tighter">
                    READY TO ACTIVATE
                  </div>
                </div>
                <div className="absolute -top-4 -left-4 w-14 h-14 bg-white text-secondary rounded-2xl flex items-center justify-center text-xl font-black shadow-xl border border-secondary/10">02</div>
              </div>
              <h3 className="text-xl font-black text-text-main font-montserrat leading-tight px-4 group-hover:text-secondary transition-colors">
                Add membership to your shopping cart and checkout
              </h3>
            </div>

            {/* Step 3: Discount */}
            <div className="flex flex-col items-center text-center group relative z-10">
              <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center mb-10">
                {/* Layered Card UI */}
                <div className="absolute inset-0 bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] rounded-[3rem] border border-gray-50 group-hover:rotate-6 transition-transform duration-500"></div>
                <div className="absolute inset-0 bg-primary-dark/5 rounded-[3rem] rotate-[-6deg] group-hover:rotate-0 transition-transform duration-500 border border-primary-dark/10"></div>

                <div className="relative animate-float" style={{ animationDelay: '0.4s' }}>
                  <div className="bg-gradient-to-br from-primary via-primary to-primary-dark p-8 rounded-[2.5rem] shadow-2xl transform group-hover:scale-110 transition-transform duration-500">
                    <span className="text-5xl font-black text-white font-display leading-none">10%</span>
                    <div className="h-px w-full bg-white/20 my-2"></div>
                    <p className="text-[10px] font-bold text-white/90 uppercase text-center tracking-[0.2em]">Off Now</p>
                  </div>
                </div>
                <div className="absolute -top-4 -left-4 w-14 h-14 bg-white text-primary-dark rounded-2xl flex items-center justify-center text-xl font-black shadow-xl border border-primary-dark/10">03</div>
              </div>
              <h3 className="text-xl font-black text-text-main font-montserrat leading-tight px-4 group-hover:text-primary transition-colors">
                10% Discount will be applied automatically to your current order
              </h3>
            </div>

          </div>
        </div>

        <style jsx>{`
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0); }
      50% { transform: translateY(-15px) rotate(2deg); }
    }
    .animate-float {
      animation: float 5s ease-in-out infinite;
    }
  `}</style>
      </div>

    </div>
  );
};

export default Membership;