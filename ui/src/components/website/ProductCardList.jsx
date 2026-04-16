import React, { useState, useContext, memo, useMemo, useCallback } from 'react';
import { createSafeHtml } from '../../utils/sanitize';
import { Heart, ShoppingCart, Globe, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { CurrencyContext } from '../../context/CurrencyContext.jsx';
import { Link } from 'react-router-dom';
import { getProductImageUrl } from '../../utils/imageUrl';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query'; // 🟢 React Query
import axios from '../../utils/axiosConfig.js';

const ProductCardList = ({ data }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { formatPrice } = useContext(CurrencyContext);
    const { addToCart, toggleWishlist, isInWishlist } = useCart();
    const queryClient = useQueryClient();

    // 🟢 Optimization 1: Memoize Product URL (Slug Logic)
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

    // 🟢 Optimization 2: Memoize Synopsis Calculation
    const synopsisData = useMemo(() => {
        const rawSynopsis = data.synopsis || "No description available.";
        const canExpand = rawSynopsis.length > 250;
        const truncated = rawSynopsis.slice(0, 250) + (canExpand ? "..." : "");
        return { rawSynopsis, truncated, canExpand };
    }, [data.synopsis]);

    const displaySynopsis = isExpanded ? synopsisData.rawSynopsis : synopsisData.truncated;

    // 🟢 Optimization: MNC Standard Pricing Logic
    const priceData = useMemo(() => {
        const mPrice = Number(data.price || 0);
        const rPrice = Number(data.realPrice ?? data.real_price ?? 0);
        const iPrice = Number(data.inrPrice ?? data.inr_price ?? 0);

        const hasDiscount = mPrice > rPrice && rPrice > 0;
        const discountPercentage = hasDiscount ? Math.round(((mPrice - rPrice) / mPrice) * 100) : 0;

        return { mPrice, rPrice, iPrice, hasDiscount, discountPercentage };
    }, [data.price, data.realPrice, data.real_price, data.inrPrice, data.inr_price]);

    // 🟢 React Query Mutation for Wishlist
    const wishlistMutation = useMutation({
        mutationFn: async (product) => {
            return await axios.post('/user/wishlist/toggle', { productId: product._id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['wishlist']);
            queryClient.invalidateQueries(['userProfile']);
        }
    });

    // 🟢 React Query Mutation for Cart Sync
    const cartMutation = useMutation({
        mutationFn: async (product) => {
            // Backend sync logic if exists
            return product;
        }
    });

    // 🟢 Optimization 3: Stable Handlers
    const handleAdd = useCallback(() => {
        addToCart(data);
        cartMutation.mutate(data);
        toast.success(`${data.title.substring(0, 20)}... added to cart!`, {
            style: { fontSize: '12px', fontFamily: 'Montserrat' }
        });
    }, [data, addToCart, cartMutation]);

    const handleWishlist = useCallback((e) => {
        e.preventDefault();
        toggleWishlist(data);
        wishlistMutation.mutate(data);
    }, [data, toggleWishlist, wishlistMutation]);

    // 🟢 Optimization 4: Smart Image URL
    const imageUrl = useMemo(() => {
        return getProductImageUrl(data) || "https://placehold.co/300x400?text=No+Image";
    }, [data]);

    return (
        <div className="bg-white rounded-lg border border-cream-200 p-3 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 shadow-sm hover:shadow-md transition-all duration-300 font-body">

            {/* --- LEFT: IMAGE (Click to Product Page) --- */}
            <div className="w-40 md:w-44 aspect-[3/4] shrink-0 relative bg-cream-50 rounded overflow-hidden group mx-auto md:mx-0">
                {priceData.hasDiscount && priceData.discountPercentage >= 20 && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm z-10 shadow-sm font-montserrat">
                        {priceData.discountPercentage}% OFF
                    </span>
                )}
                <Link to={productUrl} className="block w-full h-full">
                    <img
                        src={imageUrl}
                        alt={data.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = "https://placehold.co/300x400?text=No+Image" }}
                    />
                </Link>
            </div>

            {/* --- MIDDLE: CONTENT --- */}
            <div className="flex-1">
                <h2 className="text-lg md:text-xl font-display font-bold text-text-main hover:text-primary transition-colors mb-1 leading-tight">
                    <Link to={productUrl}>{data.title}</Link>
                </h2>

                <div className="flex items-center gap-1 text-sm text-accent font-bold mb-2 md:mb-3">
                    {'★'.repeat(data.rating || 0)}{'☆'.repeat(5 - (data.rating || 0))}
                    <span className="text-text-muted text-xs font-normal ml-1 font-body">({data.ratedTimes || 0} reviews)</span>
                </div>

                <p className="text-xs md:text-sm font-bold text-text-main mb-1 font-montserrat">
                    By <span className="text-primary hover:underline cursor-pointer">
                        {data.authors?.[0]?.author?.fullName || data.author?.name || (data.author?.first_name ? `${data.author.first_name} ${data.author.last_name || ''}` : 'Unknown Author')}
                    </span>
                </p>

                <div className="text-xs md:text-sm text-text-muted mt-2 md:mt-3 leading-relaxed font-body">
                    <span dangerouslySetInnerHTML={createSafeHtml(displaySynopsis)} />
                    {synopsisData.canExpand && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-primary font-bold text-xs ml-1 hover:underline uppercase tracking-wide"
                        >
                            {isExpanded ? 'Read Less' : 'Read More'}
                        </button>
                    )}
                </div>
            </div>

            {/* --- RIGHT: ACTIONS & PRICE --- */}
            <div className="w-full md:w-64 shrink-0 border-t md:border-t-0 md:border-l border-cream-200 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">

                <div>
                    <div className="flex items-baseline gap-2 mb-1">
                        {/* 🟢 Final Selling Price (Jo user pay karega) */}
                        <span className="text-xl md:text-2xl font-bold text-primary font-display">
                            {formatPrice(priceData.mPrice, priceData.iPrice, priceData.rPrice)}
                        </span>

                        {/* 🟢 MRP (Strikethrough) - Sirf tab jab discount ho */}
                        {priceData.hasDiscount && (
                            <span className="text-xs md:text-sm text-text-muted/60 line-through font-body">
                                {formatPrice(priceData.mPrice, priceData.iPrice, priceData.mPrice)}
                            </span>
                        )}
                    </div>

                    <div className="space-y-2 mt-2 md:mt-4 text-[10px] md:text-xs text-text-muted font-body">
                        <div className="flex items-center gap-2">
                            <Globe size={14} className="text-primary" /> Free delivery Worldwide
                        </div>
                        <div className="flex items-center gap-2">
                            <Truck size={14} className="text-primary" /> Ships in {data.shipDays || 2}-{data.deliverDays || 7} days
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2 mt-4 md:mt-6">
                    <button
                        onClick={handleAdd}
                        className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded font-bold text-xs md:text-sm transition-all uppercase tracking-slick font-montserrat shadow-sm hover:shadow-md active:scale-95"
                    >
                        Add to Cart
                    </button>

                    <Link
                        to={productUrl}
                        className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded font-bold text-xs md:text-sm transition-all uppercase tracking-slick font-montserrat shadow-sm hover:shadow-md active:scale-95 text-center"
                    >
                        Buy Now
                    </Link>

                    <button
                        onClick={handleWishlist}
                        disabled={wishlistMutation.isPending}
                        className={`w-full border-2 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all uppercase font-montserrat flex items-center justify-center gap-2 active:scale-95 group/wish ${isInWishlist(data._id)
                            ? 'border-red-500 bg-red-50 text-red-600'
                            : 'border-secondary text-text-main hover:bg-secondary hover:text-white'
                            } ${wishlistMutation.isPending ? 'opacity-70' : ''}`}
                    >
                        <Heart
                            size={18}
                            fill={isInWishlist(data._id) ? "currentColor" : "none"}
                            className={isInWishlist(data._id) ? "text-red-600" : "text-secondary group-hover/wish:text-white transition-colors"}
                        />
                        {wishlistMutation.isPending ? 'Updating...' : (isInWishlist(data._id) ? 'In Wishlist' : 'Add to Wishlist')}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default memo(ProductCardList);