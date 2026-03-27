import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/images/common/logo.png';

const LogoBlue = ({ className = '' }) => {
  return (
    // 🚀 OPTIMIZATION 1: Duplicate <div> hataya aur 'className' prop ko use kiya taaki parent element ise control kar sake (Clean DOM)
    <Link to="/" className={`flex items-center group gap-2 ${className}`}>
      
      <div className="relative">
        <div className="absolute inset-0 bg-primary rounded-lg opacity-90"></div>
        <img
          src={logoImg}
          alt="Bagchee Icon"
          className="relative h-10 md:h-12 w-auto object-contain p-1"
          // 🚀 OPTIMIZATION 2: Image Loading Speed Boosters
          fetchpriority="high" // Browser ko batata hai ki ye image top priority par load karni hai
          decoding="async"     // Website ka baaki text aur layout load hone se nahi rukega
        />
      </div>

      <div className="flex flex-col leading-none">
        <span className="text-xl md:text-2xl tracking-[0.2em] text-black uppercase font-bold">
          Bagchee
        </span>
        <div className="h-[1px] bg-white/80 my-0.5 w-full"></div> {/* White line */}
        <span className="text-[8px] md:text-[10px] tracking-[0.4em] text-black/80 uppercase font-medium">
          Books That Stick
        </span>
      </div>

    </Link>
  );
};

// 🚀 OPTIMIZATION 3: memo() ensure karta hai ki header bar-bar bewajah re-render na ho
export default memo(LogoBlue);