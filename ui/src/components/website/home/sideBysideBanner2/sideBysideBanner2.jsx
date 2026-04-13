import React, { useState, memo, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

/* 🔥 ANTI-FLICKER STYLE (Optimized for GPU) */
const gpuLockStyle = {
  contain: "paint layout",
  WebkitMaskImage: "-webkit-radial-gradient(white, black)",
  overflow: "hidden",
  isolation: "isolate",
  borderRadius: "8px",
  transform: "translate3d(0, 0, 0)",
  willChange: "transform",
};

// 🟢 Sirf component ka naam change kiya hai
const DualBannerTwo = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 🟢 Helper to fix image URL (Memoized for stability)
  const getImageUrl = useCallback((imgRaw) => {
    if (!imgRaw) return "";
    if (imgRaw.startsWith("http")) return imgRaw;
    const API_BASE = process.env.REACT_APP_API_URL?.replace("/api", "");
    return `${API_BASE}/${imgRaw.replace(/^\//, "")}`;
  }, []);

  // 🟢 Fetch Data from Backend
  useEffect(() => {
    let isMounted = true;
    const fetchBanners = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        // ⚠️ API route yahan change kar lena agar zaroorat ho (e.g., side-banner-two/list)
        const res = await axios.get(`${API_URL}/side-banner-two/list`);
        if (res.data.status && res.data.data.length > 0 && isMounted) {
          const formatted = res.data.data
            .filter((b) => b.isActive)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((b) => ({
              id: b._id,
              image1: getImageUrl(b.image1),
              image2: getImageUrl(b.image2),
              link1: b.link1 || "/shop",
              link2: b.link2 || "/shop",
            }));
          
          setBanners(formatted[0] ? [
            { id: 1, image: formatted[0].image1, link: formatted[0].link1, alt: "Side Banner Left" },
            { id: 2, image: formatted[0].image2, link: formatted[0].link2, alt: "Side Banner Right" }
          ] : []);
        }
      } catch (err) {
        console.error("Dual Banner Two Fetch Error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchBanners();
    return () => { isMounted = false; };
  }, [getImageUrl]);

  /* ---------- TOUCH LOGIC ---------- */
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => (touchStartX.current = e.targetTouches[0].clientX);
  const handleTouchMove = (e) => (touchEndX.current = e.targetTouches[0].clientX);

  const prevSlide = useCallback(() => {
    setCurrentIndex((p) => (p === 0 ? banners.length - 1 : p - 1));
  }, [banners.length]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((p) => (p === banners.length - 1 ? 0 : p + 1));
  }, [banners.length]);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  }, [nextSlide, prevSlide]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[340px] xl:h-[400px] bg-gray-100 animate-pulse rounded-lg" />
          <div className="hidden lg:block h-[340px] xl:h-[400px] bg-gray-100 animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <section className="w-full py-6 md:py-8 bg-white">
      <div className="container mx-auto px-4">
        {/* ================= DESKTOP VIEW ================= */}
        <div className="hidden lg:grid grid-cols-2 gap-6">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="relative w-full h-[340px] xl:h-[400px] rounded-lg bg-gray-200 group"
              style={gpuLockStyle}
            >
              <Link to={banner.link} className="block w-full h-full">
                <img
                  src={banner.image}
                  alt={banner.alt}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  // 🟢 Fetch Priority for better LCP
                  loading={index === 0 ? "eager" : "lazy"}
                  {...(index === 0 ? { fetchpriority: "high" } : {})}
                  decoding="async"
                  draggable="false"
                  style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
                  onError={(e) => (e.target.style.display = "none")}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none z-10"></div>
              </Link>
            </div>
          ))}
        </div>

        {/* ================= MOBILE VIEW ================= */}
        <div className="block lg:hidden w-full max-w-md mx-auto">
          <div
            className="relative w-full h-[280px] sm:h-[320px] rounded-lg bg-gray-200 shadow-md"
            style={gpuLockStyle}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
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
                      loading="eager"
                      decoding="async"
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
              aria-label="Previous slide"
            >
              <ArrowLeft size={18} />
            </button>

            <button
              onClick={(e) => { e.preventDefault(); nextSlide(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow z-10 active:scale-95 transition-transform"
              aria-label="Next slide"
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
                  currentIndex === i ? "w-6 bg-primary" : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default memo(DualBannerTwo);