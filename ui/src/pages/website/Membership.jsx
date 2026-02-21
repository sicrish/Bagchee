'use client';

import React from 'react';
import { Check, Truck, Star, BookOpen, Smartphone, Globe, ArrowRight } from 'lucide-react';

const Membership = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-body">
      
      {/* 🟢 HERO SECTION (Blue Background matching Image) */}
      <div className="relative bg-gradient-to-r from-[#56CCF2] to-[#2F80ED] overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-white/10 blur-3xl"></div>

        <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center justify-between gap-10">
          
          {/* Left Content */}
          <div className="w-full md:w-1/2 text-white space-y-6 z-10 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-extrabold font-display leading-tight uppercase tracking-wide">
              Bagchee Membership <br />
              <span className="text-yellow-300">Save 10% Every Day</span>
            </h1>
            
            <p className="text-lg md:text-xl font-medium opacity-90 max-w-lg mx-auto md:mx-0">
              Buy the Bagchee Membership and get an additional <span className="font-bold">10% OFF</span> everytime you shop at Bagchee.com for a full year.
            </p>

            <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 inline-block border border-white/30">
               <p className="text-sm font-bold uppercase tracking-wider mb-1">Full Year Access</p>
               <p className="text-2xl font-bold">Only ₹2510.87 / year</p>
            </div>

            <div className="pt-4">
              <button className="bg-primary hover:bg-primary-dark text-white text-lg font-bold py-4 px-10 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.2)] transition-all transform hover:scale-105 hover:shadow-xl flex items-center gap-2 mx-auto md:mx-0 uppercase tracking-widest font-montserrat">
                 Buy Membership <ArrowRight size={20} />
              </button>
            </div>
          </div>

          {/* Right Image/Illustration */}
          <div className="w-full md:w-1/2 flex justify-center z-10 relative">
             {/* 3D Illustration Placeholder (Replace with your actual image) */}
             <div className="relative w-80 h-80 md:w-96 md:h-96">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-[60px]"></div>
                {/* Agar aapke paas image h to yahan img tag lagayein */}
                {/* <img src="/assets/membership-hero.png" alt="Membership" className="relative z-10 w-full hover:scale-105 transition-transform duration-500" /> */}
                
                {/* Fallback Icon Design if image not available */}
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <BookOpen size={200} className="text-white drop-shadow-2xl" strokeWidth={1} />
                    <div className="absolute -bottom-4 -right-4 bg-yellow-400 text-primary-dark font-bold px-6 py-2 rounded-full shadow-lg transform rotate-[-5deg]">
                        SAVE 10%
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
                <h3 className="text-2xl font-bold text-gray-800 font-display">Save Extra 10% <br/> Everyday</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                   Enjoy exclusive savings! This offer is valid for every item on Bagchee.com including sale items. The discount is automatically applied.
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
                <h3 className="text-2xl font-bold text-gray-800 font-display">Free Worldwide <br/> Delivery</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                   Members get free air delivery worldwide on orders over <span className="font-bold text-gray-800">$45.00</span> via Airmail. Orders over $500 shipped via courier.
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
                <h3 className="text-2xl font-bold text-gray-800 font-display">Exclusive Member <br/> Benefits</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                   Exclusive member-only offers and discounts throughout the year. Receive special offers, coupons, and news on latest releases.
                </p>
             </div>
          </div>

        </div>
      </div>

      {/* 🟢 BOTTOM INFO SECTION */}
      <div className="bg-white py-20 border-t border-gray-100">
          <div className="container mx-auto px-4 text-center max-w-3xl">
              <h2 className="text-2xl font-bold text-text-main mb-6 font-display uppercase tracking-wider">How it works</h2>
              <p className="text-lg text-text-muted leading-relaxed">
                 Purchase your <span className="font-bold text-primary">Bagchee Membership</span> today and receive instant savings on every item in your cart. Each time you return to make a purchase, <span className="font-bold text-gray-800">log in</span> to your Bagchee Account and your 10% discount will be automatically applied when you checkout.
              </p>
              
              <div className="mt-10 flex flex-wrap justify-center gap-6">
                 <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><Check size={16}/></div>
                    Instant Activation
                 </div>
                 <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Globe size={16}/></div>
                    Valid Globally
                 </div>
                 <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><Smartphone size={16}/></div>
                    Mobile Ready
                 </div>
              </div>
          </div>
      </div>

    </div>
  );
};

export default Membership;