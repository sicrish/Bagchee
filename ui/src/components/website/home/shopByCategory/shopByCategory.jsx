import React, { useState, useEffect, useCallback, memo } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// 🟢 Skeleton Component: Keeps layout stable during transitions
const CategorySkeleton = () => (
    <div className="flex flex-col items-center animate-pulse">
        <div className="w-28 h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full bg-gray-200 border-4 border-cream-200 shadow-sm" />
        <div className="h-4 bg-gray-200 rounded w-24 mt-4" />
    </div>
);

const ShopByCategory = () => {
  // States
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination States (Server Side)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6; 

  // 🛠️ Image Logic (Memoized to prevent jitter during re-renders)
  const getImageUrl = useCallback((cat) => {
    const imgRaw = cat.image || cat.categoryiconname;
    if (!imgRaw) return "https://placehold.co/300x300?text=No+Img";

    const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:3001";
    return imgRaw.startsWith('http') ? imgRaw : `${API_BASE}${imgRaw.startsWith('/') ? '' : '/'}${imgRaw}`;
  }, []);

  // 🟢 FETCH FUNCTION
  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/category/fetch?page=${page}&limit=${itemsPerPage}`);
      
      if (res.data.status) {
        const fetchedData = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
        setCategories(fetchedData);
        const totalCount = res.data.total || 0;
        setTotalPages(Math.ceil(totalCount / itemsPerPage));
      }
    } catch (error) {
      console.error("Error fetching Categories:", error);
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage]);

  useEffect(() => {
    // Initial fetch
    fetchData(true);

    // Background polling (Updates data quietly every 30s)
    const interval = setInterval(() => {
      fetchData(false); 
    }, 30000);

    // Tab focus revalidation
    const handleFocus = () => fetchData(false);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData]);

  // Handlers
  const handleNext = useCallback(() => {
    if (page < totalPages) setPage(prev => prev + 1);
  }, [page, totalPages]);

  const handlePrev = useCallback(() => {
    if (page > 1) setPage(prev => prev - 1);
  }, [page]);

  if (!loading && categories.length === 0) return null;

  return (
    <section className="py-10 md:py-16 bg-cream-50 border-b border-cream-200 font-body overflow-hidden">
      <div className="w-full px-4 md:px-4 group/section">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-8 md:mb-10 text-center md:text-left transition-all duration-500">
          <div>
            <span className="text-secondary text-[10px] md:text-xs tracking-[0.2em] uppercase mb-1 block font-montserrat font-bold">
              Collections
            </span>
            <h2 className="text-2xl md:text-3xl font-display text-text-main tracking-tight uppercase">
              Shop by Category
            </h2>
          </div>
          <Link to="/allcategories" className="hidden md:flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors font-montserrat font-semibold">
            View All Categories <ArrowRight size={16} />
          </Link>
        </div>

        {/* --- Slider Container --- */}
        <div className="relative px-2 md:px-4">
          
          {/* Left Arrow */}
          <button 
            onClick={handlePrev}
            disabled={page === 1}
            className={`absolute top-1/2 -left-2 md:-left-4 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-cream-100 border border-cream-200 rounded-full flex items-center justify-center text-text-muted shadow-lg z-10 transition-all duration-300 ${page === 1 ? 'opacity-30 cursor-not-allowed scale-90' : 'hover:text-primary hover:border-primary hover:scale-110 active:scale-95'}`}
            aria-label="Previous categories"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Grid Container: Fixed heights to prevent Content Jumping */}
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 min-h-[180px] md:min-h-[240px] transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {loading ? (
                // 🟢 Skeleton Loaders maintain symmetry during fetch
                Array(itemsPerPage).fill(0).map((_, i) => <CategorySkeleton key={i} />)
            ) : (
                categories.map((cat) => (
                    <div key={cat.id || cat._id} className="group cursor-pointer flex flex-col items-center text-center">
                        <Link to={`/books/${cat.slug}`} className="contents">
                            <div className="relative w-28 h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-cream-200 shadow-sm group-hover:border-secondary group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-105" style={{ willChange: 'transform, border-color' }}>
                                <img
                                    src={getImageUrl(cat)}
                                    alt={cat.title || cat.categorytitle}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.src = "https://placehold.co/300x300?text=Error"; }}
                                />
                                <div className="absolute inset-0 bg-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            <h3 className="mt-3 md:mt-4 text-sm md:text-base font-bold text-text-main group-hover:text-primary transition-colors font-display tracking-wide uppercase">
                                {cat.title || cat.categorytitle}
                            </h3>
                        </Link>
                    </div>
                ))
            )}
          </div>

          {/* Right Arrow */}
          <button 
            onClick={handleNext}
            disabled={page >= totalPages}
            className={`absolute top-1/2 -right-2 md:-right-4 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-cream-100 border border-cream-200 rounded-full flex items-center justify-center text-text-muted shadow-lg z-10 transition-all duration-300 ${page >= totalPages ? 'opacity-30 cursor-not-allowed scale-90' : 'hover:text-primary hover:border-primary hover:scale-110 active:scale-95'}`}
            aria-label="Next categories"
          >
            <ChevronRight size={20} />
          </button>

        </div>
      </div>
    </section>
  );
};

export default memo(ShopByCategory);