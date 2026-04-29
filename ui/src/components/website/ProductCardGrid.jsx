import React, { useContext, memo, useMemo, useCallback } from 'react';
import { CurrencyContext } from '../../context/CurrencyContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProductImageUrl } from '../../utils/imageUrl';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query'; 
import axios from '../../utils/axiosConfig.js';

const ProductCardGrid = ({ data, onQuickView }) => {
    const { formatPrice } = useContext(CurrencyContext);
    const { addToCart, toggleWishlist, isInWishlist } = useCart();
    const queryClient = useQueryClient();

    // 🟢 Optimization 1: Memoize Slug Creation
    const productUrl = useMemo(() => {
        const id = data.bagcheeId || data.bagchee_id || data._id || data.id;
        if (!data.title) return `/books/${id}/product`;
        const slug = data.title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        return `/books/${id}/${slug}`;
    }, [data.title, data.bagcheeId, data.bagchee_id, data._id, data.id]);

    // 🟢 Optimization 2: Memoize Pricing Logic
    const priceData = useMemo(() => {
        const mPrice = Number(data.price || 0);
        const rPrice = Number(data.realPrice ?? data.real_price ?? 0);
        const iPrice = Number(data.inrPrice ?? data.inr_price ?? 0);

        // Logic: Discount tabhi hai jab MRP Final price se bada ho
        const showDiscount = mPrice > rPrice && rPrice > 0;
        
        const discountPercentage = showDiscount 
            ? Math.round(((mPrice - rPrice) / mPrice) * 100) 
            : 0;

        return { mPrice, rPrice, iPrice, showDiscount, discountPercentage };
    }, [data.price, data.realPrice, data.real_price, data.inrPrice, data.inr_price]);

    // 🟢 React Query Mutation for Cart (Background Sync)
    const cartMutation = useMutation({
        mutationFn: async (product) => {
            return product;
        }
    });

    // 🟢 React Query Mutation for Wishlist
    const wishlistMutation = useMutation({
        mutationFn: async (product) => {
            const response = await axios.post('/user/wishlist/toggle', { productId: product._id });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['wishlist']);
            queryClient.invalidateQueries(['userProfile']);
        }
    });

    // 🟢 Optimization 3: Stable Handlers
    const handleAddToCart = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        
        addToCart(data);
        cartMutation.mutate(data); 
        
        toast.success(`${data.title.substring(0, 20)}... added to cart!`, {
            style: { fontSize: '12px', fontFamily: 'Montserrat' }
        });
    }, [data, addToCart, cartMutation]);

    const handleWishlist = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        
        toggleWishlist(data);
        wishlistMutation.mutate(data); 
    }, [data, toggleWishlist, wishlistMutation]);

    // 🟢 Optimization 4: Smart Image URL
    const imageUrl = useMemo(() => {
        return getProductImageUrl(data) || "https://placehold.co/300x400?text=No+Image";
    }, [data]);

    return (
        <div className="group bg-white rounded-lg border border-cream-200 overflow-hidden hover:shadow-xl transition-all duration-300 relative font-body flex flex-col h-full translate-z-0">
            
            {/* --- IMAGE SECTION (Click to Product Page) --- */}
            <div className="relative overflow-hidden aspect-[3/4] bg-cream-50">
                {/* Discount Badge */}
                {priceData.showDiscount && priceData.discountPercentage >= 20 && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-sm z-10 shadow-sm font-montserrat animate-in fade-in">
                        {priceData.discountPercentage}% OFF
                    </span>
                )}

                <Link to={productUrl} className="block w-full h-full">
                    <img
                        src={imageUrl}
                        alt={data.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                        style={{ willChange: 'transform' }}
                        onError={(e) => { e.target.src = "https://placehold.co/300x400?text=No+Image" }}
                    />
                </Link>
                {onQuickView && (
                    <button
                        onClick={(e) => { e.preventDefault(); onQuickView(data); }}
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 text-primary text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-white font-montserrat whitespace-nowrap"
                    >
                        <Eye size={12} /> Quick View
                    </button>
                )}
            </div>

            {/* --- CONTENT SECTION --- */}
            <div className="p-3 md:p-4 flex flex-col flex-grow">
                {/* Title */}
                <h3 className="text-sm md:text-[15px] font-bold text-text-main leading-tight line-clamp-2 hover:text-primary transition-colors mb-1 h-8 md:h-10">
                    <Link to={productUrl}>
                        {data.title}
                    </Link>
                </h3>

                {/* Author */}
                <p className="text-[11px] md:text-xs text-text-muted mb-1 line-clamp-1 font-medium italic opacity-80">
                    {data.authors?.[0]?.author?.fullName || data.author?.name || (data.author?.first_name ? `${data.author.first_name} ${data.author.last_name || ''}` : 'Unknown Author')}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-1 text-xs text-accent font-bold mb-2">
                    {'★'.repeat(data.rating || 0)}{'☆'.repeat(5 - (data.rating || 0))}
                    {(data.ratedTimes || 0) > 0 && (
                        <span className="text-text-muted text-[10px] font-normal font-body">({data.ratedTimes})</span>
                    )}
                </div>

                {/* BOTTOM ROW */}
                <div className="mt-auto flex items-end justify-between border-t border-cream-100 pt-3">
                    {/* Price Section */}
                    <div className="flex flex-col">
                        {priceData.showDiscount && (
                            <span className="text-[10px] md:text-xs text-text-muted/70 line-through font-body">
{formatPrice(priceData.mPrice, priceData.iPrice, priceData.mPrice)}                            </span>
                        )}
                        <span className="text-sm md:text-base font-bold text-primary font-display">
                        {formatPrice(priceData.mPrice, priceData.iPrice, priceData.rPrice)}                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1.5 md:gap-2">
                        <button
                            onClick={handleWishlist}
                            disabled={wishlistMutation.isPending} 
                            aria-label="Toggle Wishlist"
                            className={`p-2 rounded-full border transition-all duration-300 active:scale-75 ${
                                isInWishlist(data._id)
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : 'bg-cream-50 text-text-muted border-cream-200 hover:bg-red-50 hover:text-red-600'
                            } ${wishlistMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Heart size={16} fill={isInWishlist(data._id) ? "currentColor" : "none"} className="md:w-[18px] md:h-[18px]" />
                        </button>
                        <button
                            onClick={handleAddToCart}
                            aria-label="Add to Cart"
                            className="p-2 rounded-full bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg transition-all active:scale-75 flex items-center justify-center"
                        >
                            <ShoppingCart size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(ProductCardGrid);