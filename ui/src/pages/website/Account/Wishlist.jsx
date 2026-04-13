'use client';

import React, { useState, useMemo, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, Star, Package, BookOpen, Globe, FileText, Plus, Minus } from 'lucide-react';
import axios from '../../../utils/axiosConfig';
import toast from 'react-hot-toast';
import AccountLayout from '../../../layouts/AccountLayout';
import { useCart } from '../../../context/CartContext';
import { CurrencyContext } from '../../../context/CurrencyContext';
import { useQuery } from '@tanstack/react-query'; // 🟢 React Query

const Wishlist = () => {
  const { wishlist, toggleWishlist, cart, addToCart, updateQuantity } = useCart();

  const { formatPrice } = useContext(CurrencyContext);

  const [removing, setRemoving] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  // 🟢 1. FETCH PRODUCT DETAILS FOR WISHLIST ITEMS
  // Hum useQuery ka use karke poore wishlist data ko ek saath manage karenge
  const { data: productsData = {}, isLoading: loading } = useQuery({
    queryKey: ['wishlist-details', wishlist.map(item => item._id)], // Depend on wishlist IDs
    queryFn: async () => {
      const productDetails = {};
      // Wishlist ke har item ke liye detail fetch karenge
      const detailPromises = wishlist.map(async (product) => {
        const productId = product.bagchee_id || product._id;
        try {
          let response;
          // Aapka purana fallback logic
          try {
            response = await axios.get(`${API_BASE_URL}/product/fetch?bagchee_id=${productId}`);
          } catch (error) {
            try {
              response = await axios.get(`${API_BASE_URL}/product/fetch?id=${productId}`);
            } catch (error2) {
              response = await axios.get(`${API_BASE_URL}/product/get/${productId}`);
            }
          }

          if (response.data.status && response.data.data) {
            const bookData = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
            productDetails[product._id] = bookData;
          }
        } catch (error) {
          console.error(`Error fetching product ${product._id}:`, error);
        }
      });

      await Promise.all(detailPromises);
      return productDetails;
    },
    enabled: wishlist.length > 0, // Sirf tabhi chale jab wishlist me items hon
    staleTime: 1000 * 60 * 5, // 5 minute tak data fresh rahega
  });

  const handleRemove = async (productId) => {
    try {
      setRemoving(productId);
      const product = wishlist.find(item => item._id === productId);
      if (product) {
        toggleWishlist(product);
        toast.success('Removed from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove item');
    } finally {
      setRemoving(null);
    }
  };

  const getImageUrl = (product) => {
    // Agar default_image hai
    if (product?.default_image) {
        return product.default_image.startsWith('http') 
            ? product.default_image 
            : `${process.env.REACT_APP_API_URL.replace('/api', '')}${product.default_image}`;
    }
    // Agar images array mein pehli image hai
    if (product?.images && product.images.length > 0) {
        const img = product.images[0];
        return img.startsWith('http') 
            ? img 
            : `${process.env.REACT_APP_API_URL.replace('/api', '')}${img}`;
    }
    // Fallback placeholder
    return 'https://via.placeholder.com/300x400?text=No+Image';
};

  const getAuthorName = (author) => {
    if (!author) return 'Unknown Author';
    if (typeof author === 'object') {
      return `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Unknown Author';
    }
    return author;
  };

  const createSlug = (title) => {
    if (!title) return '';
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  if (loading && wishlist.length > 0) {
    return (
      <AccountLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Wishlist
          </h1>
          <p className="text-gray-600">
            {wishlist.length > 0
              ? `${wishlist.length} ${wishlist.length === 1 ? "item" : "items"} saved`
              : "No items in your wishlist yet"}
          </p>
        </div>

        {wishlist.length === 0 ? (
          /* Empty State */
          <div className="bg-cream-100 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={48} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start adding books you love to your wishlist. They'll be saved
              here for easy access.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors font-medium"
            >
              <Package size={20} />
              Browse Books
            </Link>
          </div>
        ) : (
          /* Wishlist List View */
          <div className="flex flex-col gap-4">
            {wishlist.map((product) => {
              // ─── 🟢 MNC PRICING & DATA LOGIC ───
              const fullProduct = productsData[product._id] || product;

              // 1. Base Prices
              const currentPriceUSD = fullProduct.price || 0;
              const currentPriceINR = fullProduct.inr_price || 0;
              const currentRealPrice = (fullProduct.real_price && fullProduct.real_price > 0) ? fullProduct.real_price : (fullProduct.price || 0);

              // 2. MNC Display Variables (Brain of Pricing)
              const displayPriceUI = formatPrice(currentPriceUSD, currentPriceINR, currentRealPrice);
              const hasDiscount = fullProduct.real_price > fullProduct.price;
              const displayOldPriceUI = hasDiscount ? formatPrice(fullProduct.real_price, null, fullProduct.real_price) : null;
              const discountPercent = hasDiscount ? Math.round(((fullProduct.real_price - fullProduct.price) / fullProduct.real_price) * 100) : 0;

              // 3. Status & Meta
              const rating = fullProduct.rating || 0;
              const ratingCount = fullProduct.rated_times || 0;
              const availability = fullProduct.availability || fullProduct.stock || 0;
              const slug = createSlug(fullProduct.title);
              const productUrl = `/books/${fullProduct.bagchee_id || fullProduct._id}/${slug}`;

              const cartItem = cart.find(item => item._id === fullProduct._id);
              const qty = cartItem ? cartItem.quantity : 0;
              const outOfStock = (availability <= 0);

              return (
                <div
                  key={product._id}
                  className="bg-cream-100 rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 p-4 sm:p-5 flex flex-col sm:flex-row gap-5 relative group"
                >
                  {/* Image Section */}
                  <Link
                    to={productUrl}
                    className="shrink-0 w-full sm:w-44 bg-cream-100 rounded-lg p-3 border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <div className="aspect-[3/4] relative w-32 sm:w-full max-w-[130px] mx-auto">
                      <img
                        src={getImageUrl(fullProduct)}
                        alt={fullProduct.title}
                        className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/300x400?text=No+Image"; }}
                      />
                    </div>
                  </Link>

                  {/* Details Content */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <Link to={productUrl} className="group/title">
                          <h3 className="font-bold text-gray-900 text-lg sm:text-xl line-clamp-2 mb-2 group-hover/title:text-primary transition-colors">
                            {fullProduct.title}
                          </h3>
                        </Link>

                        {fullProduct.author && (
                          <p className="text-sm font-medium text-gray-600 mb-3 line-clamp-1">
                            by <span className="text-gray-800">{getAuthorName(fullProduct.author)}</span>
                          </p>
                        )}

                        {rating > 0 && (
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={`${i < Math.floor(rating) ? "fill-orange-400 text-orange-400" : "fill-gray-100 text-gray-200"}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
                            <span className="text-sm text-gray-400">({ratingCount} reviews)</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-4 pb-4 border-b border-gray-100">
                          {fullProduct.binding && (
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 text-gray-400 flex-shrink-0"><BookOpen size={14} /></div>
                              <div className="min-w-0">
                                <p className="text-xs text-gray-500 font-medium">Format</p>
                                <p className="text-sm text-gray-800 font-medium truncate">{fullProduct.binding}</p>
                              </div>
                            </div>
                          )}
                          {fullProduct.language && (
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 text-gray-400 flex-shrink-0"><Globe size={14} /></div>
                              <div className="min-w-0">
                                <p className="text-xs text-gray-500 font-medium">Language</p>
                                <p className="text-sm text-gray-800 font-medium truncate">{fullProduct.language}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemove(product._id)}
                        disabled={removing === product._id}
                        className="hidden sm:flex items-center justify-center w-10 h-10 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all flex-shrink-0"
                        title="Remove from wishlist"
                      >
                        {removing === product._id ? <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={20} />}
                      </button>
                    </div>

                    {/* Price & Actions */}
                    <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="w-full sm:w-auto flex flex-col gap-2">
                        <div className="flex flex-wrap items-baseline gap-2.5">
                          <span className="text-2xl font-bold text-gray-900">{displayPriceUI}</span>
                          {hasDiscount && (
                            <>
                              <span className="text-base text-gray-400 line-through font-medium">{displayOldPriceUI}</span>
                              {discountPercent > 0 && <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100 w-fit">{discountPercent}% OFF</span>}
                            </>
                          )}
                        </div>
                        {availability && availability > 0 ? (
                          <span className="text-xs font-medium text-green-700 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>In Stock</span>
                        ) : (
                          <span className="text-xs font-medium text-red-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>Out of Stock</span>
                        )}
                      </div>

                      <div className="w-full sm:w-auto flex items-center gap-3">
                        <div className="sm:w-48 w-full">
                          {(() => {
                            const cartItem = cart.find(item => item._id === fullProduct._id);
                            const qty = cartItem ? cartItem.quantity : 0;
                            const outOfStock = (fullProduct.stock <= 0);
                            if (qty > 0) {
                              return (
                                <div className="flex items-center bg-primary text-white rounded-md overflow-hidden shadow-sm w-full justify-center">
                                  <button onClick={() => updateQuantity(fullProduct._id, 'dec')} className="px-3 py-2 hover:bg-primary-dark transition-colors flex items-center justify-center"><Minus size={16} /></button>
                                  <span className="px-2 font-bold min-w-[20px] text-center text-sm">{qty}</span>
                                  <button onClick={() => updateQuantity(fullProduct._id, 'inc')} disabled={qty >= (fullProduct.stock || 10)} className="px-3 py-2 hover:bg-primary-dark transition-colors flex items-center justify-center disabled:opacity-50"><Plus size={16} /></button>
                                </div>
                              );
                            }
                            return (
                              <button
                                onClick={() => {
                                  if (outOfStock) { toast.error("Product is out of stock"); return; }
                                  addToCart({ ...fullProduct, bagcheeId: fullProduct.bagchee_id || fullProduct._id, slug });
                                  toast.success("Added to Cart");
                                }}
                                disabled={outOfStock}
                                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors disabled:bg-gray-300 w-full justify-center"
                              >
                                <ShoppingCart size={18} />
                                <span>{outOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                              </button>
                            );
                          })()}
                        </div>
                        <button onClick={() => handleRemove(product._id)} disabled={removing === product._id} className="sm:hidden flex items-center justify-center w-12 h-12 border border-gray-200 text-gray-500 rounded-lg transition-colors">
                          {removing === product._id ? <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AccountLayout>
  );
};

export default Wishlist;