import React, { useState, useContext, memo, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, ShoppingCart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query'; // 🟢 React Query Import
import { CurrencyContext } from '../../../../context/CurrencyContext.jsx';
import { useCart } from '../../../../context/CartContext.jsx'; // 🟢 Cart Context Import
import ProductModal from '../../ProductModal.jsx'; // 🟢 Modal Import
import toast from 'react-hot-toast';
import { getProductImageUrl } from '../../../../utils/imageUrl.js';

// 🟢 Skeleton Component: Loading ke waqt layout ko stable rakhne ke liye
const ProductSkeleton = () => (
    <div className="bg-cream-100 rounded-lg overflow-hidden animate-pulse border border-gray-100">
        <div className="aspect-[2/3] bg-gray-200" />
        <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-2 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3 mt-3" />
        </div>
    </div>
);

const makeBookUrl = (book) => {
    const slug = (book.title || 'product')
        .toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    return `/books/${book.bagcheeId || book.id}/${slug}`;
};

const RecommendedSection = () => {
    const navigate = useNavigate();
    const { formatPrice } = useContext(CurrencyContext);
    const { addToCart, toggleWishlist, isInWishlist } = useCart(); // Context logic

    // Pagination State
    const [page, setPage] = useState(1);
    const itemsPerPage = 6;

    // 🟢 Modal States
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 🟢 React Query: Fetching Logic
    const { data: queryData, isLoading, isPlaceholderData } = useQuery({
        queryKey: ['recommended-products', page], // cache key based on page
        queryFn: async () => {
            const API_URL = process.env.REACT_APP_API_URL;
            const res = await axios.get(`${API_URL}/product/recommended?page=${page}&limit=${itemsPerPage}`);
            return res.data;
        },
        placeholderData: (previousData) => previousData, // 🟢 Smooth Transition (Layout jump fix)
        staleTime: 300000, // 5 minutes cache
    });

    // Derived values from query
    const products = queryData?.data || [];
    const totalPages = Math.ceil((queryData?.total || 0) / itemsPerPage);

    // 🟢 Handlers
    const openModal = useCallback((e, product) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedProduct(product);
        setIsModalOpen(true);
    }, []);

    const handleAddToCart = useCallback((e, product) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product);
        toast.success(`${product.title.substring(0, 20)}... added to cart!`);
    }, [addToCart]);

    const handleWishlist = useCallback((e, product) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
    }, [toggleWishlist]);

    const handleNext = () => { if (page < totalPages) setPage(p => p + 1); };
    const handlePrev = () => { if (page > 1) setPage(p => p - 1); };

    if (!isLoading && products.length === 0) return null;

    return (
        <section className="py-10 md:py-16 bg-cream-50 font-body">
            <div className="max-w-[1400px] mx-auto px-4 group/section">

                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-10 gap-2 md:gap-4 border-b border-primary-200 pb-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-display text-text-main tracking-tight uppercase">
                            RECOMMENDED FOR YOU
                        </h2>
                        <p className="text-text-muted text-xs md:text-sm mt-1 font-body italic">
                            Personalized book picks you'll love reading.
                        </p>
                    </div>
                    <Link to="/recommended" className="flex items-center gap-2 text-xs md:text-sm uppercase tracking-wider text-text-main hover:text-primary transition-colors self-end md:self-auto font-montserrat">
                        See All <ArrowRight size={16} />
                    </Link>
                </div>

                {/* --- SLIDER CONTAINER --- */}
                <div className="relative">

                    {/* Left Arrow */}
                    <button
                        onClick={handlePrev}
                        disabled={page === 1}
                        aria-label="Previous recommended"
                        className={`absolute top-1/2 -left-2 md:-left-5 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-cream-100 border border-cream-200 rounded-full flex items-center justify-center text-text-muted shadow-lg z-20 transition-all duration-300 ${page === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-primary hover:border-primary hover:scale-110'}`}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    {/* Grid */}
                    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 min-h-[350px] transition-opacity duration-200 ${isPlaceholderData ? 'opacity-50' : 'opacity-100'}`}>
                        {isLoading ? (
                            Array(itemsPerPage).fill(0).map((_, i) => <ProductSkeleton key={i} />)
                        ) : (
                            products.map((book) => {
                                if (!book || !book.id) return null;

                                // 1. Pehle Pricing Variables nikalye (Relative Discount Logic)
                                const mPrice = Number(book.price || 0);       // USD MRP
                                const rPrice = Number(book.realPrice || book.real_price || 0);  // USD Final (Discounted)
                                const iPrice = Number(book.inrPrice || book.inr_price || 0);   // Flat INR price

                                const imageUrl = getProductImageUrl(book, { width: 300 });
                                const authorName = book.authors?.[0]?.author?.fullName
                                    || `${book.authors?.[0]?.author?.firstName || ''} ${book.authors?.[0]?.author?.lastName || ''}`.trim()
                                    || (typeof book.author === 'object' ? (book.author?.name || book.author?.firstName || '') : (book.author || ''));

                                return (
                                    <div key={book.id} className="bg-cream-100 hover:shadow-xl transition-all group cursor-pointer flex flex-col block rounded-lg overflow-hidden border border-transparent hover:border-primary-100 relative">

                                        {/* 🟢 Image Click -> Details Page */}
                                        <div className="relative aspect-[2/3] overflow-hidden bg-gray-200" onClick={() => navigate(makeBookUrl(book))}>
                                            <img
                                                src={imageUrl}
                                                alt={book.title}
                                                loading="lazy"
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                onError={(e) => { e.target.src = "https://placehold.co/300x450/f9f5ef/1a3c5e?text=No+Cover"; }}
                                            />

                                            {book.discount && Number(book.discount) > 0 && (
                                                <div className="absolute top-2 left-2 bg-secondary text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold shadow-md z-10 font-montserrat">
                                                    {book.discount}%
                                                </div>
                                            )}

                                            {/* 🟢 Quick View Overlay -> Opens Modal */}
                                            <div
                                                className="absolute bottom-0 left-0 w-full bg-primary/80 backdrop-blur-sm text-white text-center py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden md:block"
                                                onClick={(e) => openModal(e, book)}
                                            >
                                                <span className="text-sm font-semibold font-montserrat uppercase">Quick View</span>
                                            </div>
                                        </div>

                                        {/* Content Area */}
                                        <div className="text-left px-3 pt-3 flex flex-col flex-1 pb-3">
                                            <Link to={makeBookUrl(book)}>
                                                <h3 className="font-display font-bold text-text-main text-xs md:text-sm truncate" title={book.title}>
                                                    {book.title}
                                                </h3>
                                            </Link>
                                            <h3 className="text-text-muted text-[10px] md:text-xs truncate mt-0.5 font-body">
                                                {authorName || "Unknown Author"}
                                            </h3>

                                            <div className="mt-auto pt-3 flex items-center justify-between gap-1">
                                                <div className="flex flex-col leading-none">
                                                    {mPrice > rPrice && (
                                                        <span className="text-[10px] md:text-xs text-text-muted line-through font-body opacity-60">
                                                            {formatPrice(mPrice, iPrice, mPrice)}
                                                        </span>
                                                    )}
                                                    <p className="text-primary font-bold text-sm md:text-base font-montserrat">
                                                        {formatPrice(mPrice, iPrice, rPrice)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        aria-label={isInWishlist(book.id) ? "Remove from wishlist" : "Add to wishlist"}
                                                        className={`p-1 md:p-1.5 rounded-full transition-all ${isInWishlist(book.id) ? 'text-red-500 bg-red-50' : 'text-text-muted hover:text-red-500 hover:bg-red-50'}`}
                                                        onClick={(e) => handleWishlist(e, book)}
                                                    >
                                                        <Heart size={16} fill={isInWishlist(book.id) ? "currentColor" : "none"} className="md:w-[18px] md:h-[18px]" />
                                                    </button>
                                                    <button
                                                        aria-label="Add to cart"
                                                        className="text-text-muted hover:text-primary hover:bg-primary/10 p-1 md:p-1.5 rounded-full transition-all"
                                                        onClick={(e) => handleAddToCart(e, book)}
                                                    >
                                                        <ShoppingCart size={16} className="md:w-[18px] md:h-[18px]" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Right Arrow */}
                    <button
                        onClick={handleNext}
                        disabled={page >= totalPages}
                        aria-label="Next recommended"
                        className={`absolute top-1/2 -right-2 md:-right-5 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-cream-100 border border-cream-200 rounded-full flex items-center justify-center text-text-muted shadow-lg z-20 transition-all duration-300 ${page >= totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:text-primary hover:border-primary hover:scale-110'}`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* 🟢 Product Quick View Modal */}
            <ProductModal
                product={selectedProduct}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </section>
    );
};

export default memo(RecommendedSection);