import React, { useContext, memo, useMemo, useCallback } from 'react';
import { CurrencyContext } from '../../context/CurrencyContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProductCardGrid = ({ data, onQuickView }) => {
    const { formatPrice } = useContext(CurrencyContext);
    const { addToCart, toggleWishlist, isInWishlist } = useCart();

    // 🟢 Optimization 1: Memoize Slug Creation (Expensive string operations avoid honge)
    const productUrl = useMemo(() => {
        if (!data.title) return `/books/${data.bagchee_id || data._id}/product`;
        const slug = data.title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        return `/books/${data.bagchee_id || data._id}/${slug}`;
    }, [data.title, data.bagchee_id, data._id]);

    // 🟢 Optimization 2: Memoize Pricing Logic
    const priceData = useMemo(() => {
        const price = Number(data.price || 0);
        const realPrice = Number(data.real_price || 0);
        const showDiscount = realPrice > price;
        const discountPercentage = showDiscount
            ? Math.round(((realPrice - price) / realPrice) * 100)
            : 0;
        return { price, realPrice, showDiscount, discountPercentage };
    }, [data.price, data.real_price]);

    // 🟢 Optimization 3: Stable Handlers (Re-renders rokne ke liye)
    const handleAddToCart = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation(); // Parent link click na ho jaye
        addToCart(data);
        toast.success(`${data.title.substring(0, 20)}... added to cart!`, {
            style: { fontSize: '12px', fontFamily: 'Montserrat' }
        });
    }, [data, addToCart]);

    const handleWishlist = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(data);
    }, [data, toggleWishlist]);

    // 🟢 Optimization 4: Smart Image URL
    const imageUrl = useMemo(() => {
        if (!data.default_image) return "https://placehold.co/300x400?text=No+Image";
        if (data.default_image.startsWith('http')) return data.default_image;
        const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:5000";
        return `${API_BASE}/${data.default_image.replace(/^\//, '')}`;
    }, [data.default_image]);

    return (
        <div className="group bg-white rounded-lg border border-cream-200 overflow-hidden hover:shadow-xl transition-all duration-300 relative font-body flex flex-col h-full translate-z-0">
            
            {/* --- IMAGE SECTION --- */}
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
                        decoding="async" // 🟢 MNC Standard: Decoding background mein hogi
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        style={{ willChange: 'transform' }} // 🟢 Smooth animation
                        onError={(e) => { e.target.src = "https://placehold.co/300x400?text=Error" }}
                    />
                </Link>

                {/* QUICK VIEW POPUP */}
                <div
                    onClick={(e) => { e.preventDefault(); onQuickView(data); }}
                    className="absolute bottom-0 left-0 w-full bg-primary/80 backdrop-blur-sm text-white text-center py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 cursor-pointer hidden md:block z-20"
                >
                    <span className="text-xs font-semibold font-montserrat tracking-wider uppercase">Quick View</span>
                </div>
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
                    {data.author?.name || (data.author?.first_name ? `${data.author.first_name} ${data.author.last_name || ''}` : 'Unknown Author')}
                </p>

                {/* BOTTOM ROW */}
                <div className="mt-auto flex items-end justify-between border-t border-cream-100 pt-3">
                    {/* Price Section */}
                    <div className="flex flex-col">
                        {priceData.showDiscount && (
                            <span className="text-[10px] md:text-xs text-text-muted/70 line-through font-body">
                                {formatPrice(priceData.realPrice)}
                            </span>
                        )}
                        <span className="text-sm md:text-base font-bold text-primary font-display">
                            {formatPrice(priceData.price)}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1.5 md:gap-2">
                        <button
                            onClick={handleWishlist}
                            aria-label="Toggle Wishlist"
                            className={`p-2 rounded-full border transition-all duration-300 active:scale-75 ${
                                isInWishlist(data._id)
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : 'bg-cream-50 text-text-muted border-cream-200 hover:bg-red-50 hover:text-red-600'
                            }`}
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

// 🟢 Optimization 5: Use memo to prevent re-rendering if props haven't changed
export default memo(ProductCardGrid);