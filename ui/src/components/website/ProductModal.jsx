import React, { memo, useMemo, useCallback,useContext } from 'react';
import { X, ShoppingCart, Heart } from 'lucide-react';
import { Dialog, Transition, TransitionChild, DialogPanel } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { createSafeHtml } from '../../utils/sanitize';
import { CurrencyContext } from '../../context/CurrencyContext.jsx';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query'; // 🟢 Mutations use karenge
import axios from '../../utils/axiosConfig.js';
import { getProductImageUrl } from '../../utils/imageUrl.js';

const ProductModal = ({ product, isOpen, onClose }) => {
    const { addToCart, toggleWishlist, isInWishlist } = useCart();
    const { formatPrice } = useContext(CurrencyContext);
    const queryClient = useQueryClient();

    // 🟢 Wishlist Mutation (Syncing with backend in background)
    const wishlistMutation = useMutation({
        mutationFn: async (productId) => {
            return await axios.post('/user/wishlist/toggle', { productId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['wishlist']); // 🛡️ Header/Cards ko update karega
        }
    });

    const previewImage = useMemo(() => {
        if (!product) return "";
        return getProductImageUrl(product) || "https://placehold.co/500x700?text=No+Cover";
    }, [product]);

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    const handleAddToCart = () => {
        if (product) {
            addToCart(product);
            toast.success(`${product.title.substring(0, 20)}... added to cart!`);
        }
    };

    const handleWishlist = (e) => {
        e.preventDefault();
        if (product) {
            toggleWishlist(product); // Local state update (Instant UI change)
            wishlistMutation.mutate(product.id); // Server sync
        }
    };

    if (!product) return null;

    return (
        <Transition show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={handleClose}>
                <TransitionChild
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                </TransitionChild>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
                        <TransitionChild
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-2xl transition-all font-body relative flex flex-col md:flex-row max-h-[95vh] md:h-[600px]">
                                
                                <button 
                                    onClick={handleClose}
                                    className="absolute top-3 right-3 z-[70] p-2 bg-white/80 backdrop-blur-md rounded-full hover:bg-gray-200 text-text-main shadow-md transition-all active:scale-90"
                                >
                                    <X size={20} />
                                </button>

                                {/* --- LEFT: IMAGE --- */}
                                <div className="w-full md:w-1/2 bg-gray-50 overflow-y-auto custom-scrollbar border-b md:border-b-0 md:border-r border-gray-100 p-6 flex items-center justify-center min-h-[300px] md:min-h-full">
                                    <img 
                                        src={previewImage} 
                                        alt={product.title} 
                                        className="max-w-full h-auto shadow-lg rounded-sm object-contain max-h-[400px] md:max-h-full"
                                        onError={(e) => { e.target.src = "https://via.placeholder.com/500x700?text=No+Preview+Available" }}
                                    />
                                </div>

                                {/* --- RIGHT: DETAILS --- */}
                                <div className="w-full md:w-1/2 p-5 sm:p-8 flex flex-col overflow-hidden text-left">
                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                                        <h2 className="text-xl sm:text-2xl font-display font-bold text-text-main mb-2 leading-tight">
                                            {product.title}
                                        </h2>
                                        <p className="text-sm font-semibold text-primary mb-4 italic">
                                            By {product.author?.firstName || product.author?.first_name} {product.author?.lastName || product.author?.last_name || product.author?.name}
                                        </p>

                                        <div className="text-2xl sm:text-3xl font-bold text-text-main font-montserrat mb-6">
                                        {formatPrice(product.price, product.inrPrice || product.inr_price, product.realPrice || product.real_price)}
                                        {Number(product.price) > Number(product.realPrice || product.real_price) && (
                                                <span className="text-base sm:text-lg font-normal text-gray-400 line-through opacity-70">
                                                    {/* Original MRP */}
                                                    {formatPrice(product.price, product.inrPrice || product.inr_price, product.price)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 bg-cream-50 p-4 rounded-lg border border-cream-200">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold font-montserrat">ISBN</span>
                                                <span className="font-bold text-text-main text-xs sm:text-sm">{product.isbn13 || product.isbn || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold font-montserrat">Format</span>
                                                <span className="font-bold text-text-main text-xs sm:text-sm capitalize">{product.binding || 'Paperback'}</span>
                                            </div>
                                        </div>

                                        <div className="text-sm text-text-muted leading-relaxed mb-4">
                                            <div dangerouslySetInnerHTML={createSafeHtml(product.synopsis || "No description available.")} />
                                        </div>
                                    </div>

                                    {/* --- BOTTOM ACTIONS --- */}
                                    <div className="mt-auto pt-4 border-t border-gray-100 bg-white space-y-3">
                                        <button 
                                            onClick={handleAddToCart}
                                            className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md font-montserrat"
                                        >
                                            <ShoppingCart size={20} /> Add to Cart
                                        </button>
                                        
                                        <div className="flex gap-3">
                                            <Link 
                                                to={`/books/${product.bagcheeId || product.id}/${product.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-main py-3 rounded-lg font-bold uppercase text-[11px] sm:text-xs tracking-wider transition-colors flex items-center justify-center font-montserrat"
                                            >
                                                View Full Details
                                            </Link>
                                            <button 
                                                onClick={handleWishlist}
                                                disabled={wishlistMutation.isPending}
                                                className={`px-4 rounded-lg transition-colors ${
                                                    isInWishlist(product.id) 
                                                    ? 'bg-red-50 text-red-600 border border-red-100' 
                                                    : 'bg-gray-100 hover:bg-red-50 hover:text-red-500 border border-transparent'
                                                }`}
                                            >
                                                <Heart 
                                                    size={20} 
                                                    fill={isInWishlist(product.id) ? "currentColor" : "none"}
                                                    className={wishlistMutation.isPending ? "animate-pulse" : ""}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default memo(ProductModal);