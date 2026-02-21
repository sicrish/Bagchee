import React from 'react';
import { Link } from 'react-router-dom'; 

// ✅ Images Import (Path apni file ke hisab se check kr lena)
import desktopImg from '../../../assets/images/website/sale_today_banner/sale_today.jpeg';

const SaleTodayBanner = () => {
  return (
    <div className="w-full bg-gray-50 my-8">
      
      {/* 🟢 Link Updated to /sale-today */}
      <Link to="/sale-today" className="block w-full cursor-pointer group overflow-hidden">
        
        <picture>
          {/* 1. Desktop (> 1024px) */}
          <source 
            media="(min-width: 1024px)" 
            srcSet={desktopImg} 
          />
          
          <img 
            src={desktopImg}  
            alt="Sale Today Books Collection" 
            className="w-full h-auto object-cover transition-transform duration-500 ease-in-out group-hover:scale-[1.02]"
            loading="lazy" 
            width="1920" 
            height="600"
          />
        </picture>

      </Link>
    </div>
  );
};

export default React.memo(SaleTodayBanner);