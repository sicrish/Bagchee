import React, { memo } from 'react';
import logoImg from '../../assets/images/common/logo.png';

const Logo = () => {
  return (
    <div className="flex items-center group gap-2">
      {/* 1. Upar wala Icon (Image) */}
      <img 
        src={logoImg} 
        alt="Bagchee Icon" 
        className="h-10 md:h-12 w-auto object-contain" 
        // 🚀 OPTIMIZATION: Loading Speed Boosters
        fetchPriority="high" // Browser ko signal deta hai ki ye LCP (main image) hai, isey sabse pehle load karo
        decoding="async"     // Image process hote waqt website ki baaki cheezein block nahi hongi
      />

      {/* 2. Niche wala Text (Code se) */}
      <div className="flex flex-col leading-none">
        <span className="text-xl md:text-2xl tracking-[0.2em] text-white uppercase">
          Bagchee
        </span>
        <div className="h-[1px] bg-white/30 my-1 w-full"></div> {/* Patli line */}
        <span className="text-[8px] md:text-[10px] tracking-[0.4em] text-gray-300 uppercase">
          Books That Stick
        </span>
      </div>
    </div>
  );
};

// 🚀 OPTIMIZATION: memo() already laga hai, jo ki perfect hai taaki header re-render na ho.
export default memo(Logo);