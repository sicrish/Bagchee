import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../../../utils/axiosConfig.js'
import { Loader2 } from 'lucide-react';

const EGiftcardBanner = () => {
  // 1. Fetch Data from API
  const { data: bannerList, isLoading } = useQuery({
    queryKey: ['eGiftCardBannerWebsite'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/e-gift-card-banner/list`, {
        params: { isActive: 'yes' } // Sirf active banners mangwa rahe hain
      });
      return response.data.data;
    },
    staleTime: 1000 * 60 * 10, // 10 mins cache
  });

  // Helper to get full image path
  const getFullImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith('http')) return path;
    const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:5000";
    return `${API_BASE}/${path.replace(/^\//, '')}`;
  };

  if (isLoading) return null; // Background mein load hone do ya loader dikhao

  // 2. Filter Active and Sort by Order
  const activeBanners = bannerList
    ?.filter(b => b.isActive)
    ?.sort((a, b) => (a.order || 0) - (b.order || 0));

  if (!activeBanners || activeBanners.length === 0) return null;

  // Filhal hum pehla (top priority) banner dikha rahe hain
  const banner = activeBanners[0];

  return (
    <div className="w-full bg-cream-50 py-4 md:py-8 flex items-center justify-center">
      <Link 
        to="/gift-card-detail" 
        className="block w-full cursor-pointer group overflow-hidden"
      >
        <picture className="block w-full">
          {/* 🟢 Mobile Image (Screen < 1024px) */}
          {banner.mobileImage && (
            <source 
              media="(max-width: 1023px)" 
              srcSet={getFullImageUrl(banner.mobileImage)} 
            />
          )}

          {/* 🟢 Desktop Image (Default / Screen >= 1024px) */}
          <img 
            src={getFullImageUrl(banner.desktopImage)}  
            alt="E-Gift Card Banner" 
            className="block w-full h-auto lg:max-h-[400px] object-cover object-center transition-transform duration-700 group-hover:scale-105"
            loading="lazy" 
          />
        </picture>
      </Link>
    </div>
  );
};

export default React.memo(EGiftcardBanner);