import React, { useState , useContext} from 'react';
import { Heart, ShoppingCart, Eye, Globe, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { CurrencyContext } from '../../context/CurrencyContext.jsx';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProductCardList = ({ data, onQuickView }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { formatPrice } = useContext(CurrencyContext);
    // 🟢 Context se functions nikale
    const { addToCart, toggleWishlist, isInWishlist } = useCart();


    // 🟢 Add to Cart Logic
    const handleAdd = () => {
        addToCart(data);
        toast.success(`${data.title.substring(0, 20)}... added to cart!`);
    };

    // 🟢 Wishlist Logic
    const handleWishlist = (e) => {
        e.preventDefault();
        toggleWishlist(data);
    };

    // Synopsis Truncate Logic
    const synopsis = data.synopsis || "No description available.";
    const showReadMore = synopsis.length > 250;
    const displaySynopsis = isExpanded ? synopsis : synopsis.slice(0, 250) + (showReadMore ? "..." : "");

    return (
        // 🟢 Container: padding adjust ki mobile ke liye (p-3) vs desktop (p-6)
        <div className="bg-white rounded-lg border border-cream-200 p-3 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 shadow-sm hover:shadow-md transition-shadow font-body">

            {/* --- LEFT: IMAGE --- */}
            {/* 🟢 CHANGE: 'h-64 md:h-auto' added to fix mobile height issue */}
            <div className="w-full h-64 md:h-auto md:w-48 shrink-0 relative bg-cream-50 rounded overflow-hidden">
                <img
                    src={`${process.env.REACT_APP_API_URL}${data.default_image}`}
                    alt={data.title}
                    // 🟢 CHANGE: 'h-full' ensure image fills the restricted height on mobile
                    className="w-full h-full md:h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onQuickView(data)}
                    onError={(e) => { e.target.src = "https://via.placeholder.com/300x400?text=No+Image" }}
                />
                <div className="absolute top-2 left-2 bg-white/95 backdrop-blur px-2 py-1 text-[10px] font-bold text-text-main rounded shadow-sm uppercase tracking-wide font-montserrat">
                    {/* {data.product_type} */}
                </div>
            </div>

            {/* --- MIDDLE: CONTENT --- */}
            <div className="flex-1">
                <h2 className="text-lg md:text-xl font-display font-bold text-text-main hover:text-primary transition-colors mb-1 leading-tight">
                    <Link to={`/product/${data._id}`}>{data.title}</Link>
                </h2>

                <div className="flex items-center gap-1 text-sm text-accent font-bold mb-2 md:mb-3">
                    {'★'.repeat(data.rating || 0)}{'☆'.repeat(5 - (data.rating || 0))}
                    <span className="text-text-muted text-xs font-normal ml-1 font-body">({data.ratedTimes || 0} reviews)</span>
                </div>

                <p className="text-xs md:text-sm font-bold text-text-main mb-1 font-montserrat">
                    By <span className="text-primary hover:underline cursor-pointer">{data.author?.first_name} {data.author?.last_name}</span>
                </p>

                <div className="text-xs md:text-sm text-text-muted mt-2 md:mt-3 leading-relaxed font-body">
                    <span dangerouslySetInnerHTML={{ __html: displaySynopsis }} />
                    {showReadMore && (
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
                        <span className="text-xl md:text-2xl font-bold text-primary font-display">{formatPrice(data.price)}</span>
                        {data.real_price > data.price && (
                            <span className="text-xs md:text-sm text-text-muted/60 line-through font-body">{formatPrice(data.real_price)}</span>
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
                    {/* 🟢 CHANGE: text-xs on mobile to prevent overflow, md:text-sm on desktop */}
                    <button
                        onClick={handleAdd}
                        className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded font-bold text-xs md:text-sm transition-colors uppercase tracking-slick font-montserrat shadow-sm hover:shadow-md active:scale-95"
                    >
                        Add to Cart
                    </button>

                    <button className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded font-bold text-xs md:text-sm transition-colors uppercase tracking-slick font-montserrat shadow-sm hover:shadow-md">
                        Buy Now
                    </button>

                    {/* 🟢 ADD TO WISHLIST BUTTON  */}
                    <button
                        onClick={handleWishlist}
                        className={`w-full border-2 py-2 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all uppercase font-montserrat flex items-center justify-center gap-2 active:scale-95 group/wish ${isInWishlist(data._id)
                                ? 'border-red-500 bg-red-50 text-red-600'
                                : 'border-secondary text-text-main hover:bg-secondary hover:text-white'
                            }`}
                    >
                        <Heart
                            size={18}
                            fill={isInWishlist(data._id) ? "currentColor" : "none"}
                            className={isInWishlist(data._id) ? "text-red-600" : "text-secondary group-hover/wish:text-white transition-colors"}
                        />
                        {isInWishlist(data._id) ? 'In Wishlist' : 'Add to Wishlist'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ProductCardList;