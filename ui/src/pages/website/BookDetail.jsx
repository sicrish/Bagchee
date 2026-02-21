import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import {
  Heart, Star, Share2, ChevronLeft, ChevronRight,
  Truck, RotateCcw, CheckCircle2, AlertTriangle, ChevronDown,
  ShoppingCart, Plus, Minus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';

const BookDetail = () => {
  const { bagcheeId, slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart, updateQuantity } = useCart();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  
  const thumbnailRef = useRef(null);
  const relatedCarouselRef = useRef(null);

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        setLoading(true);
        let response;
        
        try {
          response = await axios.get(`${process.env.REACT_APP_API_URL}/product/fetch?bagchee_id=${bagcheeId}`);
        } catch (error) {
          try {
            response = await axios.get(`${process.env.REACT_APP_API_URL}/product/fetch?id=${bagcheeId}`);
          } catch (error2) {
            response = await axios.get(`${process.env.REACT_APP_API_URL}/product/get/${bagcheeId}`);
          }
        }

        if (response.data.status && response.data.data) {
          const bookData = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
          setBook(bookData);

          if (bookData.author) {
            try {
              const authorId = typeof bookData.author === 'object' ? bookData.author._id : bookData.author;
              const relatedResponse = await axios.get(`${process.env.REACT_APP_API_URL}/product/fetch?author=${authorId}&limit=12`);
              if (relatedResponse.data.status) {
                setRelatedBooks(relatedResponse.data.data.filter(b => b._id !== bookData._id).slice(0, 10));
              }
            } catch (error) {
              console.log('Could not fetch related books:', error);
            }
          }
        } else {
          toast.error('Book not found');
          navigate('/sale');
        }
      } catch (error) {
        console.error('Error fetching book:', error);
        toast.error('Failed to load book details');
        navigate('/sale');
      } finally {
        setLoading(false);
      }
    };

    if (bagcheeId) {
      fetchBookDetails();
    }
  }, [bagcheeId, navigate]);

  const getAuthorName = (author) => {
    if (!author) return 'Unknown Author';
    if (typeof author === 'object') {
      return `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Unknown Author';
    }
    return author;
  };

  const createAuthorSlug = (author) => {
    if (!author) return '';
    const name = typeof author === 'object' 
      ? `${author.first_name || ''} ${author.last_name || ''}`.trim()
      : author;
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const getDisplayValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.title) return value.title;
    if (typeof value === 'object' && value.name) return value.name;
    return '';
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleShare = () => {
    navigator.share?.({
      title: book?.title,
      text: `Check out "${book?.title}" by ${getAuthorName(book?.author)}`,
      url: window.location.href
    }) || navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success('Link copied to clipboard');
    });
  };

  const scrollThumbnails = (direction) => {
    if (thumbnailRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      thumbnailRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRelatedBooks = (direction) => {
    if (relatedCarouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      relatedCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Mock data for sections (using hardcoded data)
  const reviews = {
    average: book?.rating || 4.5,
    total: book?.rated_times || 5,
    breakdown: [
      { stars: 5, count: 3, percentage: 60 },
      { stars: 4, count: 1, percentage: 20 },
      { stars: 3, count: 1, percentage: 20 },
      { stars: 2, count: 0, percentage: 0 },
      { stars: 1, count: 0, percentage: 0 },
    ],
    comments: [
      {
        id: 1,
        author: "Rajesh Kumar",
        rating: 5,
        date: "2 days ago",
        comment: "Excellent book! The quality is amazing and the content is very insightful.",
        verified: true
      },
      {
        id: 2,
        author: "Priya Sharma",
        rating: 4,
        date: "1 week ago",
        comment: "Good book, fast delivery. Highly recommended!",
        verified: true
      },
      {
        id: 3,
        author: "Amit Patel",
        rating: 5,
        date: "2 weeks ago",
        comment: "Best purchase! The book exceeded my expectations.",
        verified: false
      }
    ]
  };

  const faqs = [
    {
      id: 1,
      question: "What is the delivery time for this book?",
      answer: "We typically deliver within 3-5 business days. For orders above ₹500, delivery is free."
    },
    {
      id: 2,
      question: "Is this book available in different formats?",
      answer: "Please check the specifications section for available formats. We offer various formats including paperback, hardcover, and digital editions where available."
    },
    {
      id: 3,
      question: "Can I return this book if I don't like it?",
      answer: "Yes! We have a 7-day return policy. You can return the book within 7 days of delivery if you're not satisfied."
    },
    {
      id: 4,
      question: "Is the book in good condition?",
      answer: "All our books are 100% genuine and in excellent condition. We ensure quality packaging to prevent any damage during shipping."
    },
    {
      id: 5,
      question: "Do you provide gift wrapping?",
      answer: "Yes, we offer complimentary gift wrapping on request. Please mention it in the order notes during checkout."
    },
    {
      id: 6,
      question: "What are the payment options available?",
      answer: "We accept all major credit/debit cards, UPI, net banking, and cash on delivery for eligible orders."
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Book Not Found</h2>
          <p className="text-gray-600 mb-4">The book you're looking for doesn't exist.</p>
          <Link to="/sale" className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors">
            Back to Sale
          </Link>
        </div>
      </div>
    );
  }

  const discount = book.discount || 0;
  const hasDiscount = book.real_price && book.real_price > book.price;
  const rating = book.rating || 0;
  const isLowStock = book.stock > 0 && book.stock <= 5;
  const isOutOfStock = book.stock === 0 || book.availability === 'Out of Stock';

  // Collect ALL images: default_image, sample_images, toc_images
  const allImages = [];
  
  // Add default image first
  if (book.default_image) {
    allImages.push(book.default_image);
  }
  // Add sample images
  if (book.sample_images && Array.isArray(book.sample_images)) {
    book.sample_images.forEach(imgObj => {
      if (imgObj.image) {
        allImages.push(imgObj.image);
      }
    });
  }
  
  // Add toc images
  if (book.toc_images && Array.isArray(book.toc_images)) {
    book.toc_images.forEach(imgObj => {
      if (imgObj.image) {
        allImages.push(imgObj.image);
      }
    });
  }

  // Filter out any duplicates or empty values
  const uniqueImages = [...new Set(allImages.filter(Boolean))];

  return (
    <div className="min-h-screen bg-cream">
      {/* Breadcrumb Navigation */}
      <div className="bg-cream-100 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/sale" className="hover:text-primary transition-colors">
              Books
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 line-clamp-1">{book.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image Gallery */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="bg-cream-100 rounded-lg border p-6">
              {/* Main Image with Navigation */}
              <div className="relative mb-4 group">
                <div className="aspect-[6/5] bg-cream-100 border rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={
                      uniqueImages[selectedImage] ||
                      "https://via.placeholder.com/600x800?text=No+Image"
                    }
                    alt={book.title}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Navigation Arrows */}
                {uniqueImages.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setSelectedImage((prev) =>
                          prev === 0 ? uniqueImages.length - 1 : prev - 1,
                        )
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImage((prev) =>
                          prev === uniqueImages.length - 1 ? 0 : prev + 1,
                        )
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {uniqueImages.length > 1 && (
                <div className="relative">
                  <div className="flex items-center gap-2">
                    {uniqueImages.length > 5 && (
                      <button
                        onClick={() => scrollThumbnails("left")}
                        className="flex-shrink-0 p-1.5 bg-cream-100 hover:bg-cream-200 rounded"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}

                    <div
                      ref={thumbnailRef}
                      className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
                    >
                      {uniqueImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-20 h-24 rounded border-2 overflow-hidden transition-all ${
                            selectedImage === index
                              ? "border-primary"
                              : "border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          <img
                            src={image}
                            alt={`View ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>

                    {uniqueImages.length > 5 && (
                      <button
                        onClick={() => scrollThumbnails("right")}
                        className="flex-shrink-0 p-1.5 bg-cream-100 hover:bg-cream-200 rounded"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div>
            <div className="bg-cream-100 rounded-lg border p-6">
              {/* Title */}
              <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
                {book.title}
              </h1>

              {/* Author */}
              <p className="text-lg text-gray-700 mb-4">
                by{" "}
                <Link
                  to={`/author/${createAuthorSlug(book.author)}`}
                  className="text-primary hover:underline font-medium"
                >
                  {getAuthorName(book.author)}
                </Link>
              </p>

              {/* Rating */}
              <div className="flex items-center gap-3 pb-4 mb-4 border-b">
                {rating > 0 ? (
                  <>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {rating.toFixed(1)} ({book.rated_times || 0} ratings)
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-gray-500">No ratings yet</span>
                )}
              </div>

              {/* Price Section */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    ₹{book.price?.toLocaleString("en-IN")}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ₹{book.real_price?.toLocaleString("en-IN")}
                      </span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                {hasDiscount && (
                  <p className="text-sm text-green-700 font-medium">
                    You save ₹
                    {(book.real_price - book.price)?.toLocaleString("en-IN")}
                  </p>
                )}
              </div>

              {/* Stock Status */}
              {isOutOfStock ? (
                <div className="flex items-center gap-2 text-red-600 font-semibold mb-6 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Currently Out of Stock</span>
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-2 text-orange-600 font-semibold mb-6 bg-orange-50 px-4 py-3 rounded-lg border border-orange-200">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Only {book.stock} left in stock - order soon!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600 font-semibold mb-6">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>In Stock</span>
                </div>
              )}

              {/* Delivery Info */}
              {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <Truck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 mb-1">FREE Delivery on orders above ₹500</p>
                    <p className="text-sm text-gray-600">Delivered by 3-5 business days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RotateCcw className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 mb-1">7 Days Return Policy</p>
                    <p className="text-sm text-gray-600">Easy returns & exchanges</p>
                  </div>
                </div>
              </div> */}

              {/* Wishlist & Share Buttons */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={handleWishlist}
                  className={`flex-1 py-2 px-3 md:px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base whitespace-nowrap ${
                    isWishlisted
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 flex-shrink-0 ${isWishlisted ? "fill-current" : ""}`}
                  />
                  <span className="hidden sm:inline">{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 py-2 px-3 md:px-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-gray-700 transition-all flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base whitespace-nowrap"
                >
                  <Share2 className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                {(() => {
                  const cartItem = cart.find(item => item._id === book._id);
                  const qty = cartItem ? cartItem.quantity : 0;
                  if (qty > 0) {
                    return (
                      <div className="flex items-center bg-primary text-white rounded-md overflow-hidden shadow-sm w-full justify-center">
                        <button
                          onClick={() => updateQuantity(book._id, 'dec')}
                          className="px-3 py-2 hover:bg-primary-dark transition-colors flex items-center justify-center"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-2 font-bold min-w-[20px] text-center text-sm">{qty}</span>
                        <button
                          onClick={() => updateQuantity(book._id, 'inc')}
                          disabled={qty >= (book.stock || 10)}
                          className="px-3 py-2 hover:bg-primary-dark transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    );
                  }
                  return (
                    <button
                      onClick={() => {
                        if (isOutOfStock) { toast.error("Product is out of stock"); return; }
                        const productWithLink = {
                          ...book,
                          bagcheeId: book.bagchee_id || book._id,
                          slug: book.title ? book.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'book'
                        };
                        addToCart(productWithLink);
                        toast.success("Added to Cart");
                      }}
                      disabled={isOutOfStock}
                      className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed w-full justify-center text-base font-semibold"
                    >
                      <ShoppingCart size={18} />
                      <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                    </button>
                  );
                })()}

                {!isOutOfStock && (
                  <button
                    onClick={() => {
                      addToCart(book);
                      navigate("/checkout");
                    }}
                    className="w-full py-2 px-6 rounded-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-all"
                  >
                    BUY NOW
                  </button>
                )}
              </div>

              {/* Product Details */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4">Product Details</h3>
                <div className="space-y-3 text-sm">
                  {book.isbn13 && (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                      <span className="text-gray-600 font-medium min-w-fit">ISBN-13:</span>
                      <span className="text-gray-900 font-medium break-words">
                        {book.isbn13}
                      </span>
                    </div>
                  )}
                  {book.publisher && (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                      <span className="text-gray-600 font-medium min-w-fit">Publisher:</span>
                      <span className="text-gray-900 font-medium break-words">
                        {getDisplayValue(book.publisher)}
                      </span>
                    </div>
                  )}
                  {book.language && (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                      <span className="text-gray-600 font-medium min-w-fit">Language:</span>
                      <span className="text-gray-900 font-medium break-words">
                        {getDisplayValue(book.language)}
                      </span>
                    </div>
                  )}
                  {book.pages && (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                      <span className="text-gray-600 font-medium min-w-fit">Pages:</span>
                      <span className="text-gray-900 font-medium break-words">
                        {book.pages}
                      </span>
                    </div>
                  )}
                  {book.product_formats && book.product_formats.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                      <span className="text-gray-600 font-medium min-w-fit">Format:</span>
                      <span className="text-gray-900 font-medium break-words">
                        {Array.isArray(book.product_formats) 
                          ? book.product_formats.map(fmt => typeof fmt === 'string' ? fmt : fmt.title || fmt.name || 'Unknown').join(", ")
                          : getDisplayValue(book.product_formats)
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Synopsis */}
            {book.synopsis && (
              <div className="bg-cream-100 rounded-lg border p-6 mt-6">
                <h3 className="font-bold text-lg mb-3">About This Book</h3>
                <p className="text-gray-700 leading-relaxed">{book.synopsis}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className=" mt-8 bg-cream-100 rounded-lg border p-6">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
            Customer Reviews
          </h2>

          {/* Rating Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b">
            {/* Average Rating */}
            <div className="text-center md:text-left">
              <div className="text-2xl md:text-3xl lg:text-5xl font-bold text-gray-900 mb-2">
                {reviews.average.toFixed(1)} out of 5
              </div>
              <div className="flex justify-center md:justify-start mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(reviews.average)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600">
                Based on {reviews.total} reviews
              </p>
            </div>

            {/* Rating Breakdown */}
            <div className="md:col-span-2">
              {reviews.breakdown.map((item) => (
                <div key={item.stars} className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm text-gray-600">{item.stars}</span>
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Review Comments */}
          <div className="space-y-6">
            {reviews.comments.map((review) => (
              <div key={review.id} className="pb-6 border-b last:border-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {review.author}
                      </span>
                      {review.verified && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {review.date}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Specifications Section */}
        <div className="mt-8 bg-cream-100 rounded-lg border p-6">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
            Specifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {book.isbn13 && (
              <div>
                <p className="text-sm text-gray-600 mb-1">ISBN-13</p>
                <p className="font-medium text-gray-900">{book.isbn13}</p>
              </div>
            )}
            {book.pages && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Pages</p>
                <p className="font-medium text-gray-900">{book.pages}</p>
              </div>
            )}
            {book.language && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Language</p>
                <p className="font-medium text-gray-900">{getDisplayValue(book.language)}</p>
              </div>
            )}
            {book.publisher && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Publisher</p>
                <p className="font-medium text-gray-900">{getDisplayValue(book.publisher)}</p>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-cream-100 rounded-lg border p-6">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)
                  }
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="font-medium text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${
                      expandedFAQ === faq.id ? "transform rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedFAQ === faq.id && (
                  <div className="px-4 pb-4 text-gray-700 border-t bg-gray-50">
                    <p className="pt-3">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* You May Also Like Section */}
        {relatedBooks.length > 0 && (
          <div className="mt-8 bg-cream-100 rounded-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-gray-900">
                You May Also Like
              </h2>
              {relatedBooks.length > 4 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollRelatedBooks("left")}
                    className="p-2 bg-cream-100 hover:bg-cream-200 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => scrollRelatedBooks("right")}
                    className="p-2 bg-cream-100 hover:bg-cream-200 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div
              ref={relatedCarouselRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            >
              {relatedBooks.map((relatedBook) => {
                const relatedSlug = relatedBook.title
                  ?.toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "");
                const hasRelatedDiscount =
                  relatedBook.real_price &&
                  relatedBook.real_price > relatedBook.price;
                const relatedDiscount = hasRelatedDiscount
                  ? Math.round(
                      ((relatedBook.real_price - relatedBook.price) /
                        relatedBook.real_price) *
                        100,
                    )
                  : 0;

                return (
                  <Link
                    key={relatedBook._id}
                    to={`/books/${relatedBook.bagchee_id || relatedBook._id}/${relatedSlug}`}
                    className="flex-shrink-0 w-48 bg-cream-100 border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-cream-100">
                      <img
                        src={
                          relatedBook.default_image ||
                          "https://via.placeholder.com/300x400?text=No+Image"
                        }
                        alt={relatedBook.title}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 mb-2 text-gray-900 group-hover:text-primary transition-colors">
                        {relatedBook.title}
                      </h3>
                      <div className="flex items-center gap-1 mb-2">
                        {relatedBook.rating > 0 && (
                          <>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < Math.floor(relatedBook.rating)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">
                              ({relatedBook.rated_times || 0})
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-gray-900">
                          ₹{relatedBook.price?.toLocaleString("en-IN")}
                        </p>
                        {hasRelatedDiscount && (
                          <span className="text-xs text-gray-500 line-through">
                            ₹{relatedBook.real_price?.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      {hasRelatedDiscount && (
                        <span className="text-xs font-semibold text-green-600">
                          {relatedDiscount}% OFF
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Hide scrollbar for carousel */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default BookDetail;
