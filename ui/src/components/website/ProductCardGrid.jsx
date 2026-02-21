import React, { useContext } from 'react';
import { CurrencyContext } from '../../context/CurrencyContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast'; // 🟢 Added

const ProductCardGrid = ({ data, onQuickView }) => {
    const { formatPrice } = useContext(CurrencyContext);
    const { addToCart, toggleWishlist, isInWishlist } = useCart();
    // 1. Helper Function: Create URL Slug
    const createSlug = (title) => {
        if (!title) return '';
        return title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    };

    // 2. Generate Dynamic Link
    const slug = createSlug(data.title);
    const productUrl = `/books/${data.bagchee_id || data._id}/${slug}`;

    // 3. Price & Discount Logic
    const price = Number(data.price || 0);
    const realPrice = Number(data.real_price || 0);
    const showDiscount = realPrice > price;
    const discountPercentage = showDiscount
        ? Math.round(((realPrice - price) / realPrice) * 100)
        : 0;

    // 🟢 Cart Handler
    const handleAddToCart = (e) => {
        e.preventDefault(); // Page redirect hone se roko
        addToCart(data);
        toast.success(`${data.title.substring(0, 20)}... added to cart!`);
    };

    // 🟢 Wishlist Handler
    const handleWishlist = (e) => {
        e.preventDefault();
        toggleWishlist(data);
    };

    const imageUrl = data.default_image
        ? `${process.env.REACT_APP_API_URL}${data.default_image}`
        : "https://via.placeholder.com/300x400?text=No+Image";

    return (
        // 🟢 CHANGE: border-cream-200 (Theme match)
        <div className="group bg-white rounded-lg border border-cream-200 overflow-hidden hover:shadow-xl transition-all duration-300 relative font-body flex flex-col h-full">

            {/* --- IMAGE SECTION --- */}
            {/* 🟢 CHANGE: bg-cream-50 (Theme match) & aspect-[3/4] (Height Reduced) */}
            <div className="relative overflow-hidden aspect-[3/4] bg-cream-50">

                {/* Discount Badge (Using config red-600) */}
                {showDiscount && discountPercentage > 0 && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-sm z-10 shadow-sm font-montserrat">
                        {discountPercentage}% OFF
                    </span>
                )}

                {/* Image Link */}
                <Link to={productUrl} className="block w-full h-full">
                    <img
                        src={imageUrl}
                        alt={data.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/300x400?text=No+Image" }}
                    />
                </Link>

                {/* 🟢 VIEW DETAILS POPUP (Exactly like Slider) */}
                <div
                    onClick={() => onQuickView(data)}
                    className="absolute bottom-0 left-0 w-full bg-primary/80 backdrop-blur-sm text-white text-center py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 cursor-pointer hidden md:block"
                >
                    <span className="text-xs font-semibold font-montserrat tracking-wider uppercase">Quick View</span>
                </div>
            </div>

            {/* --- CONTENT SECTION --- */}
            <div className="p-3 md:p-4 flex flex-col flex-grow">

                {/* Title */}
                <h3 className="text-sm md:text-[15px] font-bold text-text-main leading-tight line-clamp-2 hover:text-primary transition-colors mb-1">
                    <Link to={productUrl}>
                        {data.title}
                    </Link>
                </h3>

                {/* Author */}
                <p className="text-xs text-text-muted mb-3 line-clamp-1 font-medium">
                    {data.author?.first_name ? `${data.author.first_name} ${data.author.last_name || ''}` : 'Unknown Author'}
                </p>

                {/* BOTTOM ROW */}
                {/* 🟢 CHANGE: border-cream-100 instead of gray-100 */}
                <div className="mt-auto flex items-end justify-between border-t border-cream-100 pt-3">

                    {/* Left: Price Section */}
                    <div className="flex flex-col">
                        {/* 🟢 Real Price (FormatPrice use kiya h) */}
                        {showDiscount && (
                            <span className="text-xs text-text-muted/70 line-through font-body">
                                {formatPrice(realPrice)}
                            </span>
                        )}

                        {/* 🟢 Selling Price (FormatPrice use kiya h) */}
                        <span className="text-base md:text-lg font-bold text-primary font-display">
                            {formatPrice(price)}
                        </span>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleWishlist}
                            title={isInWishlist(data._id) ? "Remove from Wishlist" : "Add to Wishlist"}
                            className={`p-2 rounded-full border transition-all ${isInWishlist(data._id)
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : 'bg-cream-50 text-text-muted border-cream-200 hover:bg-red-50 hover:text-red-600'
                                }`}
                        >
                            <Heart size={18} fill={isInWishlist(data._id) ? "currentColor" : "none"} />
                        </button>
                        <button
                            onClick={handleAddToCart}
                            title="Add to Cart"
                            className="p-2 rounded-full bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg transition-all active:scale-90"
                        >
                            <ShoppingCart size={18} />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProductCardGrid;