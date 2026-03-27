import React, { useContext, memo, useMemo, useCallback } from 'react';
import { CurrencyContext } from '../../context/CurrencyContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { Heart, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query'; 
import axios from '../../utils/axiosConfig.js';
import { getProductImageUrl } from '../../utils/imageUrl.js';

const ProductCardGrid = ({ data }) => {
    const { formatPrice } = useContext(CurrencyContext);
    const { addToCart, toggleWishlist, isInWishlist } = useCart();
    const queryClient = useQueryClient();

    // 🟢 Optimization 1: Memoize Slug Creation
    const productUrl = useMemo(() => {
        if (!data.title) return `/books/${data.bagcheeId || data.id}/product`;
        const slug = data.title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        return `/books/${data.bagcheeId || data.id}/${slug}`;
    }, [data.title, data.bagcheeId, data.id]);

    // 🟢 Optimization 2: Memoize Pricing Logic
    const priceData = useMemo(() => {
        const mPrice = Number(data.price || 0);                               // USD Original (MRP)
        const rPrice = Number(data.realPrice || data.real_price || 0);       // USD Final (Discounted)
        const iPrice = Number(data.inrPrice || data.inr_price || 0);         // Backend Fixed INR Price

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
            const response = await axios.post('/user/wishlist/toggle', { productId: product.id });
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

    const imageUrl = useMemo(() => getProductImageUrl(data), [data]);

    return (
        <div className="group bg-white rounded-lg border border-cream-200 overflow-hidden hover:shadow-xl transition-all duration-300 relative font-body flex flex-col h-full translate-z-0">
            
            {/* --- IMAGE SECTION (Click to Product Page) --- */}
            <div className="relative overflow-hidden aspect-[3/4] bg-cream-50">
                {/* Discount Badge */}
                {priceData.showDiscount && priceData.discountPercentage > 0 && (
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
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        style={{ willChange: 'transform' }}
                        onError={(e) => { e.target.src = "https://placehold.co/300x400/f9f5ef/1a3c5e?text=No+Cover" }}
                    />
                </Link>
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
                <p className="text-[11px] md:text-xs text-text-muted mb-3 line-clamp-1 font-medium italic opacity-80">
                    {data.author?.name || (data.author?.firstName || data.author?.first_name ? `${data.author.firstName || data.author.first_name} ${data.author.lastName || data.author.last_name || ''}` : 'Unknown Author')}
                </p>

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
                                isInWishlist(data.id)
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : 'bg-cream-50 text-text-muted border-cream-200 hover:bg-red-50 hover:text-red-600'
                            } ${wishlistMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Heart size={16} fill={isInWishlist(data.id) ? "currentColor" : "none"} className="md:w-[18px] md:h-[18px]" />
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