  import React, { useState, memo, useRef, useEffect } from "react";
  import { ArrowLeft, ArrowRight } from "lucide-react";
  import { Link } from "react-router-dom";

  /* ---------- IMAGES ---------- */
  // Make sure ye paths 100% sahi ho
  import sideBanner1 from "../../../../assets/images/website/banners/side1.jpg.jpeg";
  import sideBanner2 from "../../../../assets/images/website/banners/side2.jpg.jpeg";

  const banners = [
    {
      id: 1,
      image: sideBanner1,
      link: "/category/sale",
      alt: "Mega Sale",
    },
    {
      id: 2,
      image: sideBanner2,
      link: "/category/new",
      alt: "New Arrivals",
    },
  ];

  /* 🔥 ANTI-FLICKER STYLE (Safe Mode) */
  const gpuLockStyle = {
    // Browser Optimization
    contain: "paint layout",
    
    // Flicker Fix
    WebkitMaskImage: "-webkit-radial-gradient(white, black)", 
    overflow: "hidden",
    isolation: "isolate",
    borderRadius: "8px", // Explicit border radius to help browser clip
    
    // Hardware Acceleration
    transform: "translate3d(0, 0, 0)",
    willChange: "transform",
  };

  const DualBanner = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    /* ---------- SAFE PRELOADING (No Crash) ---------- */
    useEffect(() => {
      banners.forEach((b) => {
        // Sirf background me load karo, zabardasti decode mat karo
        const img = new Image();
        img.src = b.image;
      });
    }, []);

    /* ---------- TOUCH LOGIC ---------- */
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const handleTouchStart = (e) => (touchStartX.current = e.targetTouches[0].clientX);
    const handleTouchMove = (e) => (touchEndX.current = e.targetTouches[0].clientX);
    
    const handleTouchEnd = () => {
      const diff = touchStartX.current - touchEndX.current;
      if (Math.abs(diff) > 50) diff > 0 ? nextSlide() : prevSlide();
    };

    const prevSlide = () => setCurrentIndex((p) => (p === 0 ? banners.length - 1 : p - 1));
    const nextSlide = () => setCurrentIndex((p) => (p === banners.length - 1 ? 0 : p + 1));

    return (
      <section className="w-full py-6 md:py-8 bg-white">
        <div className="container mx-auto px-4">

          {/* ================= DESKTOP VIEW ================= */}
          <div className="hidden lg:grid grid-cols-2 gap-6">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="relative w-full h-[340px] xl:h-[400px] rounded-lg bg-gray-200 group"
                style={gpuLockStyle} // ✅ CSS Fix applied
              >
                <Link to={banner.link} className="block w-full h-full">
                  <img
                    src={banner.image}
                    alt={banner.alt}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    
                    // 🟢 SAFE SETTINGS:
                    loading="eager"       // Turant load karo
                    decoding="async"      // ✅ Crash fix (async decoding)
                    draggable="false"
                    
                    // GPU Hints
                    style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
                    
                    // Error Handle: Agar image corrupt hai to console me bataye
                    onError={(e) => {
                      console.error("Image Failed to Load:", banner.image);
                      e.target.style.display = 'none'; // Broken icon chupao
                    }}
                  />
                  
                  {/* Dark Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none z-10"></div>
                </Link>
              </div>
            ))}
          </div>

          {/* ================= MOBILE VIEW ================= */}
          <div className="block lg:hidden w-full max-w-md mx-auto">
            <div
              className="relative w-full h-[280px] sm:h-[320px] rounded-lg bg-gray-200 shadow-md"
              style={gpuLockStyle} // ✅ CSS Fix applied
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* TRACK */}
              <div
                className="flex w-full h-full transition-transform duration-500 ease-out"
                style={{
                  transform: `translate3d(-${currentIndex * 100}%, 0, 0)`,
                  willChange: "transform",
                }}
              >
                {banners.map((banner) => (
                  <div
                    key={banner.id}
                    className="w-full h-full flex-shrink-0"
                    style={{ transform: "translateZ(0)" }}
                  >
                    <Link to={banner.link} className="block w-full h-full">
                      <img
                        src={banner.image}
                        alt={banner.alt}
                        className="w-full h-full object-cover object-center"
                        
                        // 🟢 SAFE SETTINGS:
                        loading="eager"
                        decoding="async" // ✅ Crash fix
                        draggable="false"
                        style={{ backfaceVisibility: "hidden" }}
                      />
                    </Link>
                  </div>
                ))}
              </div>

              {/* ARROWS */}
              <button
                onClick={(e) => { e.preventDefault(); prevSlide(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow z-10 active:scale-95 transition-transform"
              >
                <ArrowLeft size={18} />
              </button>

              <button
                onClick={(e) => { e.preventDefault(); nextSlide(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow z-10 active:scale-95 transition-transform"
              >
                <ArrowRight size={18} />
              </button>
            </div>

            {/* DOTS */}
            <div className="flex justify-center gap-2 mt-4">
              {banners.map((_, i) => (
                <span
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                    currentIndex === i
                      ? "w-6 bg-primary"
                      : "w-2 bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  };

  export default memo(DualBanner);