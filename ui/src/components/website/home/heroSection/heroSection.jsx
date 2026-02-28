import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios'; 
import { useQuery } from '@tanstack/react-query'; // 🟢 React Query Import

// 🟢 Optimized: Moved outside to maintain referential identity
const getImageUrl = (imgName) => {
  if (!imgName) return "";
  if (imgName.startsWith("http")) return imgName;
  const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '');
  return `${API_BASE}/${imgName.replace(/^\//, '')}`;
};

const HeroSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false); 

  // 🟢 React Query: Fetching Logic
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['hero-banners'], // Cache key
    queryFn: async () => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/home-slider/list`);
      if (res.data.status) {
        const activeBanners = res.data.data
          .filter(b => b.isActive)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Smarter Background Pre-loading within the query function
        activeBanners.forEach((banner) => {
          const imgD = new Image();
          imgD.src = getImageUrl(banner.desktopImage);
          const imgM = new Image();
          imgM.src = getImageUrl(banner.mobileImage);
        });
        
        return activeBanners;
      }
      return [];
    },
    staleTime: 600000, // 10 minutes cache
  });

  // 🟢 Auto-slide logic with Pause control
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return; 
    
    const slideInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);
    
    return () => clearInterval(slideInterval);
  }, [banners.length, isPaused]);

  const prevSlide = useCallback((e) => {
    e?.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  }, [banners.length]);

  const nextSlide = useCallback((e) => {
    e?.preventDefault();
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  }, [banners.length]);

  // 🟢 Toggle Handler
  const togglePause = () => setIsPaused(!isPaused);

  const renderedSlides = useMemo(() => {
    return banners.map((banner, index) => {
      const isActive = index === currentIndex;
      
      return (
        <div 
          key={banner._id || index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          style={{ willChange: 'opacity' }} // GPU optimization
        >
           <Link 
             to={banner.link || "/shop"} 
             className={`block w-full h-full ${isActive ? 'pointer-events-auto' : 'pointer-events-none'}`}
           >
                <picture className="w-full h-full block">
                    <source 
                        media="(min-width: 768px)" 
                        srcSet={getImageUrl(banner.desktopImage)} 
                    />
                    <img 
                        src={getImageUrl(banner.mobileImage)} 
                        loading={index === 0 ? "eager" : "lazy"}
                        {...(index === 0 ? { fetchpriority: "high" } : {})}
                        alt={banner.title || `Banner ${index}`} 
                        className="w-full h-full object-contain md:object-fill"
                        draggable="false"
                    />
                </picture>
           </Link>
        </div>
      );
    });
  }, [banners, currentIndex]);

  if (isLoading) {
    return (
      <div className="w-full h-[400px] md:h-[350px] lg:h-[400px] bg-cream-100 animate-pulse flex items-center justify-center">
         <span className="text-text-muted font-montserrat font-bold uppercase tracking-widest text-xs">Loading Banners...</span>
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <div className="w-full relative group overflow-hidden">
      
      <div className="w-full relative bg-cream-100 transition-all duration-500 h-[400px] md:h-[350px] lg:h-[400px]">
        {renderedSlides}
      </div>

      {/* --- CONTROLS --- */}
      {banners.length > 1 && (
        <>
          <button 
              onClick={prevSlide} 
              className=" group-hover:flex absolute top-1/2 -translate-y-1/2 left-4 z-20 w-10 h-10 bg-black/20 hover:bg-primary text-text-light rounded-full items-center justify-center backdrop-blur-sm transition-all shadow-lg border border-text-light/30 active:scale-90"
              aria-label="Previous slide"
          >
            <ArrowLeft size={20} />
          </button>

          <button 
              onClick={nextSlide} 
              className=" group-hover:flex absolute top-1/2 -translate-y-1/2 right-4 z-20 w-10 h-10 bg-black/20 hover:bg-primary text-text-light rounded-full items-center justify-center backdrop-blur-sm transition-all shadow-lg border border-text-light/30 active:scale-90"
              aria-label="Next slide"
          >
            <ArrowRight size={20} />
          </button>

          {/* Dots & Pause Container */}
          <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20'>
            <div className="flex gap-2">
              {banners.map((_, index) => (
                  <button 
                  key={index} 
                  onClick={() => setCurrentIndex(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 shadow-md ${currentIndex === index ? 'bg-primary w-8' : 'bg-text-light/60 w-2 hover:bg-text-light'}`}
                  aria-label={`Go to slide ${index + 1}`}
                  ></button>
              ))}
            </div>

            <button 
              onClick={togglePause}
              className="w-7 h-7 flex items-center justify-center bg-text-light/20 backdrop-blur-sm text-text-light rounded-full border border-text-light/40 hover:bg-primary transition-colors shadow-md active:scale-90"
              title={isPaused ? "Play Slider" : "Pause Slider"}
            >
              {isPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
            </button>
          </div>
        </>
      )}

    </div>
  );
};

export default memo(HeroSlider);