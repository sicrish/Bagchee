import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios'; 

const getImageUrl = (imgName) => {
  if (!imgName) return "";
  if (imgName.startsWith("http")) return imgName;
  const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:5000";
  return `${API_BASE}/${imgName.replace(/^\//, '')}`;
};

const HeroSlider = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL; 
        const res = await axios.get(`${API_URL}/home-slider/list`);
        
        if (res.data.status) {
          const activeBanners = res.data.data
            .filter(b => b.isActive)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          
          setBanners(activeBanners);

          activeBanners.forEach((banner) => {
            const imgDesktop = new Image();
            imgDesktop.src = getImageUrl(banner.desktopImage);
            const imgMobile = new Image();
            imgMobile.src = getImageUrl(banner.mobileImage);
          });
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const slideInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(slideInterval);
  }, [banners.length]);

  const prevSlide = useCallback((e) => {
    e?.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  }, [banners.length]);

  const nextSlide = useCallback((e) => {
    e?.preventDefault();
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  }, [banners.length]);

  const renderedSlides = useMemo(() => {
    return banners.map((banner, index) => {
      const isActive = index === currentIndex;
      
      return (
        <div 
          key={banner._id || index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
           <Link 
             to={banner.link || "/shop"} 
             className={`block w-full h-full ${isActive ? 'pointer-events-auto' : 'pointer-events-none'}`}
           >
                <picture className="w-full h-full block">
                    {/* Desktop: 16/9 Ratio (Widescreen) */}
                    <source 
                        media="(min-width: 768px)" 
                        srcSet={getImageUrl(banner.desktopImage)} 
                    />
                    {/* Mobile: 4/5 Ratio (Portrait/Square) */}
                    <img 
                        src={getImageUrl(banner.mobileImage)} 
                        alt={`Banner ${index}`} 
                        className="w-full h-full object-contain md:object-fill"
                        loading="eager"
                        draggable="false"
                    />
                </picture>
           </Link>
        </div>
      );
    });
  }, [banners, currentIndex]);

  if (loading) {
    return (
      <div className="w-full aspect-[4/5] md:aspect-video bg-gray-100 animate-pulse flex items-center justify-center">
         <span className="text-gray-400 font-montserrat font-bold uppercase tracking-widest text-xs">Loading Banners...</span>
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <div className="w-full relative group overflow-hidden">
      
      {/* 🟢 Container: Aspect Ratio based Responsive Heights */}
      <div className="w-full relative bg-white transition-all duration-500 h-[400px] md:h-[350px] lg:h-[400px]">
        {renderedSlides}
      </div>

      {/* --- CONTROLS --- */}
      {banners.length > 1 && (
        <>
          <button 
              onClick={prevSlide} 
              className="hidden group-hover:flex absolute top-1/2 -translate-y-1/2 left-4 z-20 w-10 h-10 bg-black/20 hover:bg-primary text-white rounded-full items-center justify-center backdrop-blur-sm transition-all shadow-lg border border-white/30"
          >
            <ArrowLeft size={20} />
          </button>

          <button 
              onClick={nextSlide} 
              className="hidden group-hover:flex absolute top-1/2 -translate-y-1/2 right-4 z-20 w-10 h-10 bg-black/20 hover:bg-primary text-white rounded-full items-center justify-center backdrop-blur-sm transition-all shadow-lg border border-white/30"
          >
            <ArrowRight size={20} />
          </button>

          {/* Dots Container */}
          <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20'>
            {banners.map((_, index) => (
                <button 
                key={index} 
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 shadow-md ${currentIndex === index ? 'bg-primary w-8' : 'bg-white/60 w-2 hover:bg-white'}`}
                aria-label={`Go to slide ${index + 1}`}
                ></button>
            ))}
          </div>
        </>
      )}

    </div>
  );
};

export default memo(HeroSlider);