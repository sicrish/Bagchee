import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ShopByCategory = () => {
  // States
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination States (Server Side)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6; // Backend limit

  // 🟢 1. FETCH FUNCTION (Wrapped in useCallback to avoid unnecessary re-renders)
  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      
      // Calling the updated fetchCategory controller with pagination params
      const res = await axios.get(`${API_URL}/category/fetch?page=${page}&limit=${itemsPerPage}`);
      
      if (res.data.status) {
        // Handle pagination response
        const fetchedData = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
        setCategories(fetchedData);
        
        // Calculate Total Pages from backend 'total' field
        const totalCount = res.data.total || 0;
        setTotalPages(Math.ceil(totalCount / itemsPerPage));
      }
    } catch (error) {
      console.error("Error fetching Categories:", error);
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage]);

  // 🟢 2. INITIAL FETCH & AUTO-REFRESH LOGIC
  useEffect(() => {
    // Initial fetch on page change
    fetchData(true);

    // MNC Standard: Polling logic (Har 30 second mein check karega bina page load dikhaye)
    const interval = setInterval(() => {
      fetchData(false); // Background update
    }, 30000);

    // Focus Revalidation: Jab user browser tab par wapas aayega, data refresh ho jayega
    const handleFocus = () => fetchData(false);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData]);

  // Handlers for Pagination
  const handleNext = () => {
    if (page < totalPages) setPage(prev => prev + 1);
  };

  const handlePrev = () => {
    if (page > 1) setPage(prev => prev - 1);
  };

  // Initial loading state for the first page
  if (loading && page === 1) {
    return (
      <section className="py-16 bg-cream-50 flex justify-center items-center border-b border-cream-200">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </section>
    );
  }

  // If no data, hide section
  if (!loading && categories.length === 0) return null;

  return (
    <section className="py-10 md:py-16 bg-cream-50 border-b border-cream-200 font-body">
      <div className="max-w-[1400px] mx-auto px-4 group/section">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-8 md:mb-10 text-center md:text-left">
          <div>
            <span className="text-secondary text-[10px] md:text-xs tracking-[0.2em] uppercase mb-1 block font-montserrat">
              Collections
            </span>
            <h2 className="text-2xl md:text-3xl font-display text-text-main tracking-tight">
              Shop by Category
            </h2>
          </div>
          <Link to="/categories" className="hidden md:flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors font-montserrat">
            View All Categories <ArrowRight size={16} />
          </Link>
        </div>

        {/* --- Slider Container --- */}
        <div className="relative px-2 md:px-4">
          
          {/* Left Arrow */}
          <button 
            onClick={handlePrev}
            disabled={page === 1}
            className={`absolute top-1/2 -left-2 md:-left-4 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-cream-100 border border-cream-200 rounded-full flex items-center justify-center text-text-muted shadow-lg z-10 transition-all duration-300 ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:text-primary hover:border-primary hover:scale-110'}`}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Grid of Items */}
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {categories.map((cat) => {
                
                // 🛠️ Image Logic (Category Icon Name)
                let imageUrl = "https://placehold.co/300x300?text=No+Img";
                const imgRaw = cat.categoryiconname;
                
                if (imgRaw) {
                    const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:5000";
                    if (imgRaw.startsWith('http')) {
                        imageUrl = imgRaw;
                    } else {
                        imageUrl = `${API_BASE}${imgRaw.startsWith('/') ? '' : '/'}${imgRaw}`;
                    }
                    
                    // 🟢 Professional Cache Busting: Adding version based on DB updatedAt timestamp
                    // Isse bina URL change kiye image load ho jayegi refresh ke baad
                    imageUrl = `${imageUrl}?v=${cat.updatedAt ? new Date(cat.updatedAt).getTime() : new Date().getTime()}`;
                }

                return (
                  <div key={cat._id} className="group cursor-pointer flex flex-col items-center text-center">
                    
                    <Link to={`/category/${cat.slug}`} className="contents">
                        {/* Image Circle Container */}
                        <div className="relative w-28 h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-cream-200 shadow-sm group-hover:border-secondary group-hover:shadow-xl transition-all duration-300">
                        <img 
                            src={imageUrl} 
                            alt={cat.categorytitle} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => { e.target.src = "https://placehold.co/300x300?text=Error"; }}
                        />
                        {/* Overlay on Hover */}
                        <div className="absolute inset-0 bg-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        {/* Category Name */}
                        <h3 className="mt-3 md:mt-4 text-sm md:text-base font-bold text-text-main group-hover:text-primary transition-colors font-display">
                        {cat.categorytitle}
                        </h3>
                    </Link>
                  </div>
                );
            })}
          </div>

          {/* Right Arrow */}
          <button 
            onClick={handleNext}
            disabled={page >= totalPages}
            className={`absolute top-1/2 -right-2 md:-right-4 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-cream-100 border border-cream-200 rounded-full flex items-center justify-center text-text-muted shadow-lg z-10 transition-all duration-300 ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:text-primary hover:border-primary hover:scale-110'}`}
          >
            <ChevronRight size={20} />
          </button>

        </div>

      </div>
    </section>
  );
};

export default ShopByCategory;