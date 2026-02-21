import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, ShoppingCart, Loader2 } from 'lucide-react';
import { CurrencyContext } from '../../../../context/CurrencyContext.jsx'; // ⚠️ Path check kar lena

const Bestsellers = () => {
  const { formatPrice } = useContext(CurrencyContext);

  // States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination States (Server Side)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6; // Backend limit

  // 🟢 1. API Call (Fetch Hybrid Best Sellers)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        
        // 🟢 Calling the Hybrid Best Seller API
        const res = await axios.get(`${API_URL}/home-best-seller/frontend-list?page=${page}&limit=${itemsPerPage}`); 

        if (res.data.status) {
          setProducts(res.data.data);
          
          // 🟢 Calculate Total Pages from Backend Count
          const totalCount = res.data.total || 0;
          setTotalPages(Math.ceil(totalCount / itemsPerPage));
        }
      } catch (error) {
        console.error("Error fetching Best Sellers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page]); // Run whenever 'page' changes

  // Handlers for Pagination
  const handleNext = () => {
    if (page < totalPages) setPage(prev => prev + 1);
  };

  const handlePrev = () => {
    if (page > 1) setPage(prev => prev - 1);
  };

  if (loading && page === 1) {
    // Initial Load Spinner
    return (
      <section className="py-16 bg-cream-50 flex justify-center items-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </section>
    );
  }

  // If no data, hide section
  if (!loading && products.length === 0) return null;

  return (
    <section className="py-10 md:py-16 bg-cream-50 font-body">
      <div className="max-w-[1400px] mx-auto px-4 group/section">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-10 gap-2 md:gap-4 border-b border-primary-200 pb-4">
            <div>
                <h2 className="text-2xl md:text-3xl font-display text-text-main tracking-tight">
                  Best Sellers
                </h2>
                <p className="text-text-muted text-xs md:text-sm mt-1 font-body">
                  "Browse our bestselling titles and hidden gems"
                </p>
            </div>
            {/* Link to Shop page with Sort=bestseller */}
            <Link to="/book?sort=bestseller" className="flex items-center gap-2 text-xs md:text-sm uppercase tracking-wider text-text-main hover:text-primary transition-colors self-end md:self-auto font-montserrat">
                See All Offers <ArrowRight size={16} />
            </Link>
        </div>

        {/* --- SLIDER CONTAINER --- */}
        <div className="relative">
            
            {/* Left Arrow */}
            <button 
                onClick={handlePrev} 
                disabled={page === 1}
                className={`absolute top-1/2 -left-2 md:-left-5 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-cream-100 border border-cream-200 rounded-full flex items-center justify-center text-text-muted shadow-lg z-20 transition-all duration-300 ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:text-primary hover:border-primary hover:scale-110'}`}
            >
                <ChevronLeft size={20} />
            </button>

            {/* Grid */}
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 min-h-[350px] transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {products.map((book) => {
                // ⚠️ NOTE: Yahan hum 'item.product' nahi kar rahe, kyunki Backend ne list merge karke bheji hai.
                // 'book' directly product object hai.
                // 🟢 SAFETY CHECK ADDED HERE
                if (!book || !book._id) return null;

                // 🛠️ Image Logic
                let imageUrl = "https://placehold.co/300x450?text=No+Image";
                const imgRaw = book.default_image || book.producticonname;
                
                if (imgRaw) {
                    const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:5000";
                    if (imgRaw.startsWith('http')) {
                        imageUrl = imgRaw;
                    } else {
                        imageUrl = `${API_BASE}${imgRaw.startsWith('/') ? '' : '/'}${imgRaw}`;
                    }
                }

                // 🛠️ Author Name Logic
                let displayAuthor = "Unknown Author";
                if (book.author) {
                    if (typeof book.author === 'object') {
                         displayAuthor = book.author.name || `${book.author.first_name || ''} ${book.author.last_name || ''}`;
                    } else {
                        displayAuthor = String(book.author);
                    }
                }

                return (
                    <Link to={`/product/${book._id}`} key={book._id} className="bg-cream-100 hover:shadow-xl transition-all group cursor-pointer flex flex-col block rounded-lg overflow-hidden">
                    
                    {/* Image Area */}
                    <div className="relative aspect-[2/3] overflow-hidden">
                        <img 
                            src={imageUrl} 
                            alt={book.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => { e.target.src = "https://placehold.co/300x450?text=Error"; }}
                        />
                        
                        {/* Discount Badge */}
                        {book.discount && Number(book.discount) > 0 && (
                            <div className="absolute top-2 left-2 bg-secondary text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold shadow-md text-center leading-tight z-10 font-montserrat">
                                {book.discount}%
                            </div>
                        )}

                        <div className="absolute bottom-0 left-0 w-full bg-primary/80 backdrop-blur-sm text-white text-center py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden md:block">
                           <span className="text-sm font-semibold font-montserrat">View Details</span>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="text-left px-3 pt-3 flex flex-col flex-1 pb-3">
                        
                        {/* Title */}
                        <h3 className="font-display font-bold text-text-main text-xs md:text-sm truncate" title={book.title}>
                            {book.title}
                        </h3>
                        
                        {/* Author */}
                        <h3 className="text-text-muted text-[10px] md:text-xs truncate mt-0.5 font-body">
                            {displayAuthor}
                        </h3>
                        
                        {/* Price & Icons Row */}
                        <div className="mt-2 md:mt-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-1">
                            
                            {/* Price */}
                            <div className="flex flex-col md:flex-row md:items-baseline md:gap-2 leading-none">
                                {book.real_price && Number(book.real_price) > Number(book.price) && (
                                     <span className="text-[10px] md:text-xs text-text-muted line-through font-body">
                                        {formatPrice(book.real_price)}
                                     </span>
                                )}
                                <p className="text-primary font-bold text-sm md:text-base font-montserrat">
                                    {formatPrice(book.price)}
                                </p>
                            </div>
                            
                            {/* Icons Container */}
                            <div className="flex items-center gap-1">
                                <button 
                                    className="text-text-muted hover:text-red-500 hover:bg-red-50 p-1 md:p-1.5 rounded-full transition-all" 
                                    title="Add to Wishlist"
                                    onClick={(e) => { e.preventDefault(); /* Wishlist Logic */ }}
                                >
                                    <Heart size={16} className="md:w-[18px] md:h-[18px]" />
                                </button>
                                <button 
                                    className="text-text-muted hover:text-primary hover:bg-primary/10 p-1 md:p-1.5 rounded-full transition-all" 
                                    title="Add to Cart"
                                    onClick={(e) => { e.preventDefault(); /* Cart Logic */ }}
                                >
                                    <ShoppingCart size={16} className="md:w-[18px] md:h-[18px]" />
                                </button>
                            </div>
                        </div>

                    </div>
                    </Link>
                );
            })}
            </div>

            {/* Right Arrow */}
            <button 
                onClick={handleNext} 
                disabled={page >= totalPages}
                className={`absolute top-1/2 -right-2 md:-right-5 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-cream-100 border border-cream-200 rounded-full flex items-center justify-center text-text-muted shadow-lg z-20 transition-all duration-300 ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:text-primary hover:border-primary hover:scale-110'}`}
            >
                <ChevronRight size={20} />
            </button>
        </div>
        
      </div>
    </section>
  );
};

export default Bestsellers;