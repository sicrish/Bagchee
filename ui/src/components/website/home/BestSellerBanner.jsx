import React from 'react';
import { Link } from 'react-router-dom'; 

// ✅ Images Import
import desktopImg from '../../../assets/images/website/best_seller_banner/best-seller-desktop.jpg';


const BestSellerBanner = () => {
  return (
    <div className="w-full bg-gray-50 my-8">
      
      <Link to="/best-sellers" className="block w-full cursor-pointer group overflow-hidden">
        
        <picture>
          {/* 1. Desktop (> 1024px) - Ye tab chalega jab screen badi hogi */}
          <source 
            media="(min-width: 1024px)" 
            srcSet={desktopImg} 
          />
          
          <img 
            src={desktopImg}  
            alt="Best Seller Books Collection" 
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

export default React.memo(BestSellerBanner);