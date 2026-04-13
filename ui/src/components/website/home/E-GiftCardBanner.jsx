import React from 'react';
import { Link } from 'react-router-dom'; 

// ✅ Images Import
import desktopImg from '../../../assets/images/website/E-gift card banner/E-Gift_card.jpeg';


const EGiftcardBanner = () => {
  return (
  <div className="w-full bg-cream-50 py-8 flex items-center justify-center">
      
      <Link 
        to="/gift-card-detail" 
        className="block w-full cursor-pointer group overflow-hidden"
      >
        
        <picture className="block w-full">
  <img 
    src={desktopImg}  
    alt="E-Gift Card Banner" 
    /* 🟢 MAGIC YAHAN HAI: 
      - w-full h-auto: Mobile aur Tablet me image apne natural ratio me 100% width legi (left/right se bilkul cut nahi hogi aur height khud set karegi).
      - lg:h-[400px] xl:h-[500px]: Sirf Desktop par height fix rahegi.
      - object-cover: Isse image height kam hone par width kam nahi karegi, balki pura container (left-to-right) bharegi (haan, desktop pe top/bottom thoda cut ho sakta hai jo banners ke liye normal hai).
    */
    className="block w-full h-auto lg:h-[250px] xl:h-[300px] object-cover object-center transition-transform duration-500 ease-in-out "
    loading="lazy" 
    width="1920" 
    height="600"
  />
</picture>

      </Link>
    </div>
  );
};

export default React.memo(EGiftcardBanner);