import React, { useState, useEffect, useRef, useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { createSafeHtml } from '../../utils/sanitize';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { normalizeProduct } from '../../utils/normalizeProduct';
import {
  Heart, Star, Share2, ChevronLeft, ChevronRight,
  Truck, RotateCcw, CheckCircle2, AlertTriangle, ChevronDown,
  ShoppingCart, Plus, Minus, BookOpen, Tag, Eye, X
  , PenLine, MessageSquare, List, Trophy, ThumbsUp, ShieldCheck, Search, Check, ArrowRight, Package, Clock, CalendarDays
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { CurrencyContext } from '../../context/CurrencyContext';

const BookDetail = () => {
  const { bagcheeId, slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart, updateQuantity, membershipAdded, setMembershipAdded } = useCart();

  const { formatPrice, currency } = useContext(CurrencyContext);

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // overview | details | professional_review | faq
  const [allCategories, setAllCategories] = useState([]); // for resolving product_categories IDs to names
  const [bestsellerThreshold, setBestsellerThreshold] = useState(1); // Default 1
  // 🟢 Preview Modal State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState('images'); // 'images' | 'sample' | 'content'

  const [fullscreenImage, setFullscreenImage] = useState(null);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ title: '', review: '', rating: 5 });
  const [reviews, setReviews] = useState([]); // Database se aaye reviews yahan rahenge  
  // 🟢 Top par state add karein
  const [socialShares, setSocialShares] = useState([]);

  const [settings, setSettings] = useState(null);



  // 🟢 Series Books State
  const [seriesBooks, setSeriesBooks] = useState([]);

  // 🟢 Also Bought State
  const [alsoBoughtBooks, setAlsoBoughtBooks] = useState([]);

  // 🟢 Full Author Data (picture + profile HTML + origin)
  const [authorData, setAuthorData] = useState([]);
  const [currentAuthorIndex, setCurrentAuthorIndex] = useState(0);

  const seriesCarouselRef = useRef(null);
  const alsoBoughtCarouselRef = useRef(null);

  const thumbnailRef = useRef(null);
  const relatedCarouselRef = useRef(null);

  const [newsEmail, setNewsEmail] = useState("");
  const [expandedAuthors, setExpandedAuthors] = useState({});

  // Walk up the category tree to find the root (level === 0) for a given categoryId
  const findRootCategoryId = (categoryId, categoryMap) => {
    if (!categoryId || !categoryMap) return null;
    const id = typeof categoryId === 'object' ? categoryId?._id : categoryId;
    let current = categoryMap[id] || categoryMap[String(id)];
    while (current && current.level > 0 && current.parentid) {
      current = categoryMap[current.parentid] || categoryMap[String(current.parentid)];
    }
    return current ? (current._id || id) : id;
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        // Fetch categories and book in parallel
        const [catRes, settingsRes, bookRes, socialRes] = await Promise.allSettled([
          axios.get(`${process.env.REACT_APP_API_URL}/category/fetch`),
          axios.get(`${process.env.REACT_APP_API_URL}/settings/public`),
          (async () => {
            try {
              return await axios.get(`${process.env.REACT_APP_API_URL}/product/fetch?bagchee_id=${bagcheeId}`);
            } catch {
              try {
                return await axios.get(`${process.env.REACT_APP_API_URL}/product/fetch?id=${bagcheeId}`);
              } catch {
                return await axios.get(`${process.env.REACT_APP_API_URL}/product/get/${bagcheeId}`);
              }
            }
          })(),
          axios.get(`${process.env.REACT_APP_API_URL}/socials/list?limit=100`)
        ]);


        // 🟢 👇 👇 Naya handler fetch call ke niche check settled block mein
        if (socialRes.status === 'fulfilled' && socialRes.value.data.status) {
          // Sirf Product page aur isShareActive wale filtered karke state mein save karein
          const activeSocials = socialRes.value.data.data.filter(s => s.showInProduct && s.isShareActive && s.isActive);
          setSocialShares(activeSocials);
        }

        if (settingsRes.status === 'fulfilled' && settingsRes.value.data.status) {
          const settingsData = settingsRes.value.data.data; // public returns object not array
          setSettings(settingsData);
          const threshold = settingsData?.bestSellerThreshold || settingsData?.bestseller_threshold;
          if (threshold) setBestsellerThreshold(threshold);
        }

        // Build category map
        let categoryMap = {};
        if (catRes.status === 'fulfilled' && catRes.value?.data?.status && Array.isArray(catRes.value.data.data)) {
          const cats = catRes.value.data.data;
          setAllCategories(cats);
          cats.forEach(c => { categoryMap[c._id] = c; categoryMap[String(c._id)] = c; });
        }

        if (bookRes.status !== 'fulfilled') {
          toast.error('Book not found');
          navigate(-1);
          return;
        }

        const response = bookRes.value;
        if (response.data.status && response.data.data) {
          const rawBookData = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
          const bookData = normalizeProduct(rawBookData);
          setBook(bookData);

          // Find root category ID by walking up the parentid chain
          const leafCategoryId = typeof bookData.categoryId === 'object'
            ? bookData.categoryId?._id
            : bookData.categoryId;

          const rootCategoryId = findRootCategoryId(leafCategoryId, categoryMap);

          if (rootCategoryId) {
            try {
              // Use `categories` param which matches both categoryId AND product_categories (broad match)
              const relatedResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/product/fetch?categories=${rootCategoryId}&sort=bestseller&limit=100`
              );
              if (relatedResponse.data.status && Array.isArray(relatedResponse.data.data)) {
                const pool = relatedResponse.data.data.filter(b => b._id !== bookData._id);
                const shuffled = pool.sort(() => Math.random() - 0.5);
                setRelatedBooks(shuffled.slice(0, 15));
              }
            } catch (error) {
            }
          }
        } else {
          toast.error('Book not found');
          navigate(-1);
        }
      } catch (error) {
        console.error('Error fetching book:', error);
        toast.error('Failed to load book details');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    if (bagcheeId) {
      fetchAll();
    }
  }, [bagcheeId, navigate]);






  useEffect(() => {
    if (!book) return;
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/reviews/list`);
        if (res.data.status && Array.isArray(res.data.data)) {
          // Sirf is book ke active reviews ko filter karke state mein daalna
          const filteredReviews = res.data.data.filter(r =>
            String(r.itemId?._id || r.itemId) === String(book._id) && r.isActive === true
          );
          setReviews(filteredReviews);
        }
      } catch (e) { console.error("Error fetching reviews", e); }
    };
    fetchReviews();
  }, [book]);


  // 🟢 STEP 2: Review Submit Handler (Backend Logic)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const authData = localStorage.getItem("auth");
    if (!authData) return toast.error("Please login to submit a review");

    const parsedAuth = JSON.parse(authData);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/reviews/save`, {
        item_id: book._id,
        category_id: book.categoryId?._id || book.categoryId,
        name: parsedAuth.userDetails.name,
        email: parsedAuth.userDetails.email,
        title: reviewData.title,
        review: reviewData.review,
        rating: reviewData.rating,
        isActive: false // Admin approval ke liye false rakha hai
      });

      if (res.data.status) {
        toast.success("Review submitted for approval!");
        setReviewData({ title: '', review: '', rating: 5 });
        setShowReviewForm(false);
      }
    } catch (error) {
      toast.error("Error submitting review");
    }
  };

  // 🟢 Secondary fetch: editorial series books, also-bought — runs after book is loaded
  useEffect(() => {
    if (!book) return;

    const fetchSecondaryData = async () => {


      // Series Books
      const seriesId = typeof book.series === 'object' ? book.series?._id : book.series;
      if (seriesId) {
        try {
          const seriesRes = await axios.get(
            `${process.env.REACT_APP_API_URL}/product/fetch?series=${seriesId}&limit=20`
          );
          if (seriesRes.data.status && Array.isArray(seriesRes.data.data)) {
            setSeriesBooks(seriesRes.data.data.filter(b => b._id !== book._id));
          }
        } catch {
          // silently fail
        }
      }

      // Also Bought — proxy: same publisher, bestsellers
      // Uses 'publishers' (plural) param as required by the product fetch controller
      try {
        const publisherId = typeof book.publisher === 'object' ? book.publisher?._id : book.publisher;
        if (publisherId) {
          const abRes = await axios.get(
            `${process.env.REACT_APP_API_URL}/product/fetch?publishers=${publisherId}&sort=bestseller&limit=20`
          );
          if (abRes.data.status && Array.isArray(abRes.data.data)) {
            setAlsoBoughtBooks(abRes.data.data.filter(b => b._id !== book._id).slice(0, 15));
          }
        }
      } catch {
        // silently fail
      }

      // 🟢 Full Author Data Fetch (Multiple Authors Support, Variable name: authorData)
      try {
        let authorIds = [];

        // 1. Agar book.authors array hai (multiple authors), toh sabki ID nikal lo
        if (Array.isArray(book.authors) && book.authors.length > 0) {
          authorIds = book.authors.map(a => {
            if (typeof a === 'object') {
              // Prisma join record: { author: { id, ... } }
              return a.author?.id || a.author?._id || a._id || a.id;
            }
            return a;
          }).filter(Boolean);
        }
        // 2. Agar array nahi hai, par single book.author hai (purana data), toh uski ID nikal lo
        else if (book.author) {
          const authorId = typeof book.author === 'object'
            ? (book.author.id || book.author._id)
            : book.author;
          if (authorId) authorIds = [authorId];
        }

        // 3. Agar IDs mil gayi hain, toh API call karo
        if (authorIds.length > 0) {
          // Ek saath sabhi authors ka data mangwane ke liye promises banayein
          const authorPromises = authorIds.map(id =>
            axios.get(`${process.env.REACT_APP_API_URL}/authors/get/${id}`)
          );

          // Sabka result aane ka wait karein
          const authorResponses = await Promise.allSettled(authorPromises);

          // Jo response success huye hain, unka data filter karke array bana lein
          const fetchedAuthors = authorResponses
            .filter(res => res.status === 'fulfilled' && res.value.data.status)
            .map(res => res.value.data.data);

          // Data ko state me save kar dein (Ab ye Array hoga)
          setAuthorData(fetchedAuthors);
        }
      } catch (error) {
        console.error("Error fetching author data:", error);
      }


    };

    fetchSecondaryData();
  }, [book]);

  const getAuthorName = (author) => {
    if (!author) return 'Unknown Author';
    if (typeof author === 'object') {
      const fullName = author.fullName || author.full_name || author.name;
      if (fullName) return fullName;
      return `${author.firstName || author.first_name || ''} ${author.lastName || author.last_name || ''}`.trim() || 'Unknown Author';
    }
    return author;
  };

  const createAuthorSlug = (author) => {
    if (!author) return '';
    const name = typeof author === 'object'
      ? (author.fullName || author.full_name || `${author.firstName || author.first_name || ''} ${author.lastName || author.last_name || ''}`.trim())
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

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsEmail) return toast.error("Please enter a valid email");

    const toastId = toast.loading("Subscribing...");
    try {
      // 🟢 Backend controller ke 'saveSubscriber' route par data bhej rahe hain
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/newsletter-subs/save`, {
        email: newsEmail,

        firstName: '', // Non-login user ke liye empty
        lastName: '',  // Non-login user ke liye empty
        categories: [] // Default khali array
      });

      if (res.data.status) {
        toast.success("Thank you! We will notify you about " + book.title, { id: toastId });
        setNewsEmail(""); // Input clear karein
      } else {
        toast.error(res.data.msg || "Subscription failed", { id: toastId });
      }
    } catch (error) {
      console.error("Newsletter Error:", error);
      const errorMsg = error.response?.data?.msg || "Something went wrong. Please try again.";
      toast.error(errorMsg, { id: toastId });
    }
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

  // const faqs = [
  //   {
  //     id: 1,
  //     question: "What is the delivery time for this book?",
  //     answer: "We typically deliver within 3-5 business days. For orders above ₹500, delivery is free."
  //   },
  //   {
  //     id: 2,
  //     question: "Is this book available in different formats?",
  //     answer: "Please check the specifications section for available formats. We offer various formats including paperback, hardcover, and digital editions where available."
  //   },
  //   {
  //     id: 3,
  //     question: "Can I return this book if I don't like it?",
  //     answer: "Yes! We have a 7-day return policy. You can return the book within 7 days of delivery if you're not satisfied."
  //   },
  //   {
  //     id: 4,
  //     question: "Is the book in good condition?",
  //     answer: "All our books are 100% genuine and in excellent condition. We ensure quality packaging to prevent any damage during shipping."
  //   },
  //   {
  //     id: 5,
  //     question: "Do you provide gift wrapping?",
  //     answer: "Yes, we offer complimentary gift wrapping on request. Please mention it in the order notes during checkout."
  //   },
  //   {
  //     id: 6,
  //     question: "What are the payment options available?",
  //     answer: "We accept all major credit/debit cards, UPI, net banking, and cash on delivery for eligible orders."
  //   }
  // ];

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

  // ─── Derived values ───
  const discount = book.discount || 0;
  const realPrice = book.realPrice ?? book.real_price ?? 0;
  const inrPrice = book.inrPrice ?? book.inr_price ?? 0;
  const hasDiscount = realPrice > 0 && realPrice < Number(book.price);
  const rating = book.rating || 0;

  // Stock logic: stock field is 'active'/'inactive', availability is quantity
  const isOutOfStock = book.stock === 'inactive' || book.availability === 0;
  const isLowStock = !isOutOfStock && book.availability > 0 && book.availability <= 5;
  const isUpcoming = book.upcoming === true;

  // ─── IMAGE URL LOGIC UPDATE ───
  // Backend URL ko env file se nikaalein taaki image paths complete ho sakein
  const BASE_URL = process.env.REACT_APP_API_URL || '';

  // Helper function taaki path ko URL mein convert kiya ja sake
  const getFullImageUrl = (path) => {
    if (!path) return null;
    // Agar path pehle se hi 'http' se shuru ho raha hai toh as-is rakhein, varna prefix lagayein
    return path.startsWith('http') ? path : `${BASE_URL}${path}`;
  };

  const allImages = [];

  // 1. Default Image check
  const defaultImage = book.defaultImage || book.default_image;
  if (defaultImage) {
    allImages.push(getFullImageUrl(defaultImage));
  }

  // 2. Sample Images check
  const sampleImages = book.sampleImages || book.sample_images || [];
  if (Array.isArray(sampleImages)) {
    sampleImages.forEach(imgObj => {
      if (imgObj?.image) allImages.push(getFullImageUrl(imgObj.image));
    });
  }

  // 3. TOC (Table of Contents) Images check
  const tocImages = book.tocImages || book.toc_images || [];
  if (Array.isArray(tocImages)) {
    tocImages.forEach(imgObj => {
      if (imgObj?.image) allImages.push(getFullImageUrl(imgObj.image));
    });
  }

  // Filter Boolean hatakar sirf unique aur valid URLs rakhein
  const uniqueImages = [...new Set(allImages.filter(Boolean))];

  // Lead category — API populates categoryId with 'categorytitle' and 'slug'
  const leadCategory = book.categoryId && typeof book.categoryId === 'object'
    ? { name: book.categoryId.categorytitle || book.categoryId.title || book.categoryId.name || '', slug: book.categoryId.slug || '' }
    : null;
  // Product categories — resolve ObjectIds via allCategories list, carry slug
  const productCategories = Array.isArray(book.productCategories || book.product_categories)
    ? (book.productCategories || book.product_categories).map(cat => {
      if (typeof cat === 'object' && cat !== null) {
        return { name: cat.categorytitle || cat.title || cat.name || '', slug: cat.slug || '' };
      }
      const found = allCategories.find(c => c._id === cat || c._id?.toString() === cat?.toString());
      return found ? { name: found.categorytitle || found.title || '', slug: found.slug || '' } : null;
    }).filter(Boolean).filter(c => c.name)
    : [];

  // Tags
  const tags = Array.isArray(book.productTags || book.product_tags) ? (book.productTags || book.product_tags).filter(Boolean) : [];

  // 🟢 Helper Function: HTML tags ko hatane ke liye
  const stripHtml = (htmlString) => {
    if (!htmlString) return "";
    return htmlString.replace(/<[^>]*>?/gm, '').trim();
  };

  const toggleAuthorBio = (authorId) => {
    setExpandedAuthors(prev => ({
      ...prev,
      [authorId]: !prev[authorId] // Agar true hai toh false, false hai toh true
    }));
  };



  const bookAuthorName = book.authors?.[0]?.author?.fullName
    || (book.author?.first_name ? `${book.author.first_name} ${book.author.last_name || ''}`.trim() : '')
    || book.author?.name || '';
  const bookDescription = book.synopsis
    ? book.synopsis.replace(/<[^>]+>/g, '').substring(0, 160)
    : `${book.title}${bookAuthorName ? ` by ${bookAuthorName}` : ''} — available on Bagchee.`;
  const bookImage = book.defaultImage || book.default_image || '';

  return (
    <div className="min-h-screen bg-cream">
      <Helmet>
        <title>{book.title}{bookAuthorName ? ` by ${bookAuthorName}` : ''} | Bagchee</title>
        <meta name="description" content={bookDescription} />
        <meta property="og:title" content={`${book.title} | Bagchee`} />
        <meta property="og:description" content={bookDescription} />
        {bookImage && <meta property="og:image" content={bookImage} />}
        <meta property="og:type" content="book" />
        {book.isbn13 && <meta property="books:isbn" content={book.isbn13} />}
      </Helmet>
      {/* Breadcrumb Navigation */}
      {/* <div className="bg-cream-100 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/sale" className="hover:text-primary transition-colors">Books</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 line-clamp-1">{book.title}</span>
          </div>
        </div>
      </div> */}

      <div className="mx-auto px-4 py-6">
        {/* ─── ROW 1: 3-column grid — Gallery | Book Info | Buy Box ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-8 items-start">
          {/* ══ COL 1: Image Gallery ══ */}
          <div className="lg:sticky lg:top-6 lg:self-start w-full max-w-[260px] sm:max-w-[300px] lg:max-w-none mx-auto">
            <div className="w-full">
              {/* Main Image Wrapper: Shadow aur Border image ke kinaro par rahegi */}
              <div className="w-fit mx-auto lg:mx-0 bg-white rounded-lg overflow-hidden border border-cream-200 shadow-md flex items-center justify-center group mb-2 p-2 sm:p-2">
                <img
                  src={uniqueImages[selectedImage] || "https://placehold.co/400x600?text=No+Image"}
                  alt={book.title}
                  className="max-w-full max-h-[300px] sm:max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Thumbnails Section */}
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
                {uniqueImages.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`w-14 h-16 flex-shrink-0 border-2 rounded overflow-hidden ${selectedImage === i ? 'border-primary' : 'border-cream-200'}`}>
                    <img src={img} className="w-full h-full object-contain p-0.5" alt="thumb" />
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setPreviewOpen(true)} className="mt-3 w-full py-2.5 border border-primary text-primary font-bold rounded uppercase text-[12px] flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all font-montserrat"><Eye size={16} /> Preview Book</button>


            {/* 🟢 DYNAMIC SHARE SECTION (White Box Style - Image 2) */}
            {socialShares.length > 0 && (
              <div className="mt-4 bg-white border border-gray-100 rounded p-6 shadow-sm animate-fadeIn">
                <div className="flex items-center justify-center gap-6">

                  {/* Dynamic Share Icons Loop */}
                  {socialShares.map((social) => (
                    <a
                      key={social._id}
                      // URL Replacement Logic: Backend mein format aisa hona chahiye: `...php?u=[url]&t=[title]`
                      href={social.link
                        .replace('[url]', encodeURIComponent(window.location.href))
                        .replace('[title]', encodeURIComponent(book.title))
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group transition-transform duration-300 hover:scale-110 active:scale-95 flex-shrink-0"
                      title={social.title}
                    >
                      {/* Dynamic Image from Backend with Grayscale effect */}
                      <img
                        src={getFullImageUrl(social.icon_image)}
                        alt={social.title}
                        className="w-5 h-5 object-contain grayscale opacity-60 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105"
                      />
                    </a>
                  ))}

                  {/* Gray vertical separator like Image 2 */}
                  <div className="w-[1px] h-6 bg-gray-100" />

                  {/* Primary Color Share2 Icon Call-to-action */}
                  <div className="relative group">
                    <button
                      onClick={handleShare}
                      className="p-1 rounded-full text-primary transition-transform group-hover:scale-110 group-active:scale-95"
                    >
                      <Share2 size={20} className="font-bold" />
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* ══ COL 2: Book Title / Author / Rating ══ */}
          <div className="min-w-0 flex flex-col h-full">
            <div className="bg-cream-100 border border-gray-200 rounded p-5">
              {/* 🟢 BADGES CONTAINER */}
              <div className="flex flex-wrap gap-2 mb-4 shrink-0">

                {/* 1. BESTSELLER logic (Aapke backend se match karta hua) */}
                {(book.soldCount >= bestsellerThreshold || book.isFeatured) && (
                  <div className="inline-flex items-center gap-1.5 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full font-montserrat uppercase tracking-wide shadow-sm">
                    <Trophy className="w-3 h-3" />
                    Bestseller
                  </div>
                )}

                {/* 2. Recommended */}
                {/* {book.isRecommended === true && (
                  <div className="inline-flex items-center gap-1.5 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full font-montserrat uppercase tracking-wide shadow-sm">
                    <ThumbsUp className="w-3 h-3 fill-white" />
                    Recommended
                  </div>
                )} */}

                {/* 3. Exclusive */}
                {book.isExclusive === true && (
                  <div className="inline-flex items-center gap-1.5 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full font-montserrat uppercase tracking-wide shadow-sm">
                    <ShieldCheck className="w-3 h-3" />
                    Exclusive
                  </div>
                )}


              </div>

              {/* Title */}
              <h1 className="text-xl lg:text-3xl font-display font-bold text-gray-900 mb-1 leading-snug">
                {book.title}
              </h1>

              {/* Edition if available */}
              {/* {book.edition && (
                <p className="text-sm text-gray-500 mb-1">{book.edition}</p>
              )} */}

              {/* Author */}
              <p className="text-base text-gray-700 mb-2">
                by{" "}
                <Link
                  to={`/author/${createAuthorSlug(book.author)}`}
                  className="text-primary hover:underline font-medium"
                >
                  {getAuthorName(book.author)}
                </Link>
              </p>

              {/* 🟢 Series Display */}
              {book.series && (
                <p className="text-sm text-gray-500 mb-3">
                  Series:{" "}
                  <span className="font-medium text-primary">
                    {typeof book.series === 'object' ? book.series.title : book.series}
                    {book.series_number ? ` #${book.series_number}` : ''}
                  </span>
                </p>
              )}

              {/* 🟢 STEP: Top Dynamic Rating Section using Reviews Array */}
              <div className="flex items-center gap-4 mt-4 pb-3 border-b border-gray-100">
                {((reviews && reviews.length > 0) || (book?.rated_times > 0)) ? (
                  <>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => {
                        // Average Rating Calculation: reviews array se average nikalna
                        const calculatedAvg = reviews.length > 0
                          ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length)
                          : (book?.rating || 0);

                        return (
                          <Star
                            key={i}
                            size={16}
                            className={`w-4 h-4 ${i < Math.floor(calculatedAvg) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-sm text-gray-600 font-montserrat font-medium">
                      {/* Average Rating (toFixed use kiya hai taaki decimal sahi dikhe) */}
                      {reviews.length > 0
                        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
                        : (book?.rating || 0).toFixed(1)}
                      {" "}
                      ({reviews.length > 0 ? reviews.length : (book?.rated_times || 0)} ratings)
                    </span>
                  </>
                ) : ""

                }

                {/* Write a Review Button (Scroll trigger ke sath) */}
                <button
                  onClick={() => {
                    setShowReviewForm(true);
                    document.getElementById('reviews-section').scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="ml-auto text-xs font-bold text-primary hover:underline flex items-center gap-1.5 font-montserrat tracking-wide"
                >
                  <PenLine size={14} /> Write a Review
                </button>
              </div>


              {/* 🟢 BADGES CONTAINER */}
              <div className="flex flex-wrap gap-2 mb-4">



                {/* 4. Specs (Binding & Pages) - Minimal look */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {/* Binding Pill */}
                  {book.binding && (
                    <span className="inline-flex items-center bg-gray-100 text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-full border border-gray-200 uppercase tracking-widest font-montserrat">
                      {book.binding}
                    </span>
                  )}

                  {/* Pages Pill */}
                  {(book.pages || book.total_pages) && (
                    <span className="inline-flex items-center bg-gray-100 text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-full border border-gray-200 uppercase tracking-widest font-montserrat">
                      {(() => {
                        const rawPages = book.pages || book.total_pages;
                        // String me convert karke pehla number dhoondhna
                        const match = String(rawPages).match(/\d+/);
                        // Agar number mila to wo dikhao, warna jo data hai waisa hi dikha do
                        return match ? match[0] : rawPages;
                      })()} Pages
                    </span>
                  )}

                  {/* 🟢 Publication Date Pill (Naya Addition) */}
                  {book.pub_date && (
                    <span className="inline-flex items-center bg-gray-100 text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-full border border-gray-200 uppercase tracking-widest font-montserrat">
                      {new Date(book.pub_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              {/* 🟢 SYNOPSIS: Bagchee Theme Integrated */}
              <div className="mt-6 animate-fadeIn flex flex-col flex-grow relative overflow-hidden">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 font-montserrat">
                  Synopsis
                </h3>
                <div className="relative">
                  <div
                    className={`text-text-main text-sm leading-relaxed font-body transition-all duration-300 overflow-hidden ${!expandedFAQ ? 'max-h-[140px] md:max-h-[180px] xl:max-h-[220px]' : 'max-h-[1000px]'}`}
                    dangerouslySetInnerHTML={createSafeHtml(book.synopsis || "No description available.")}
                  />

                  {/* Read More / Less: Bagchee Premium Style */}
                  {book.synopsis && book.synopsis.replace(/<[^>]*>?/gm, '').length > 300 && (
                    <button
                      onClick={() => setExpandedFAQ(!expandedFAQ)}
                      className="mt-2 text-primary font-bold text-xs uppercase tracking-widest font-montserrat hover:text-primary-dark transition-all flex items-center gap-1"
                    >
                      {expandedFAQ ? (
                        <>Show Less <ChevronDown className="w-3 h-3 rotate-180" /></>
                      ) : (
                        <>Read More <ChevronDown className="w-3 h-3" /></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>



          {/* ══ COL 3: Buy Box ══ */}
          {/* ══ COL 3: Dynamic Buy Box / Newsletter (MNC Standard Fix) ══ */}
          <div className="lg:sticky lg:top-6 lg:self-start">

            {/* 🟢 Step 1: Membership Promo Box (Image 1 Style) - Only for Global Currencies */}
            {/* 🟢 Step 1: Premium Promo Box (Ab ye real checkbox hai) */}
            {currency !== 'INR' && !isOutOfStock && !isUpcoming && (
              <MembershipPromoBox
                formatPrice={formatPrice}
                isChecked={membershipAdded}
                onToggle={() => setMembershipAdded(!membershipAdded)}
              />
            )}
            <div className="bg-cream-100 border border-gray-200 rounded p-4 space-y-4 shadow-sm">

              {/* 1. Condition: INR select ho YA Out of Stock ho toh Newsletter dikhao */}
              {(currency === 'INR' || isOutOfStock) ? (
                <NewsletterBox
                  email={newsEmail}
                  setEmail={setNewsEmail}
                  onSubmit={handleNewsletterSubmit}
                  bookTitle={book.title}
                  message={isOutOfStock
                    ? "This item is currently out of stock. Leave your email to be notified when it's back!"
                    : "Direct purchase in INR is coming soon. Subscribe to get notified."
                  }
                />
              ) : (
                /* 2. Global Currencies (USD/EUR) aur In-Stock ke liye Buying Options */
                <>
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {/* Final Display Price (Membership Added ? 10% Off : Normal) */}
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(book.price, inrPrice, membershipAdded ? (realPrice * 0.9) : realPrice)}
                      </span>

                      {/* MRP Display (Strikethrough) */}
                      {Number(book.price) > realPrice && realPrice > 0 && (
                        <>
                          <span className="text-base text-gray-400 line-through">
                            {formatPrice(book.price, inrPrice, book.price)}
                          </span>
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">
                            {Math.round(((book.price - realPrice) / book.price) * 100)}% OFF
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stock Status Badge */}
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                    {isLowStock ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{isLowStock ? `Only ${book.availability} left — order soon!` : 'In Stock'}</span>
                  </div>

                  {/* Delivery Info (Sirf tab jab upcoming na ho) */}
                  {!isUpcoming && (
                    <div className="bg-blue-50 border border-blue-100 rounded p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-xs text-gray-700 leading-tight">
                          FREE delivery worldwide over $60
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-xs text-gray-700">Ships in {book.shipDays || book.ship_days || 1}-{book.deliverDays || book.deliver_days || 10} days from New Delhi</p>
                      </div>
                    </div>
                  )}

                  {/* 3. Action Section: Upcoming vs Normal Selling */}
                  {isUpcoming ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => toast.success("We'll notify you on release!")}
                        className="w-full py-3 bg-accent text-white font-bold font-montserrat uppercase text-sm rounded hover:bg-yellow-500 transition-colors shadow-md active:scale-95"
                      >
                        Pre-Order Request
                      </button>
                      {book.upcoming_date && (
                        <p className="text-[11px] text-center text-gray-500 font-medium">
                          Release Date: {new Date(book.upcoming_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">


                      {/* Cart & Buy Buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            addToCart(book)
                            toast.success("Added to Cart Successfully!")
                          }}
                          className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold uppercase text-sm rounded shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <ShoppingCart size={16} /> Add to Cart
                        </button>
                        <button
                          onClick={() => { addToCart(book); navigate("/checkout"); }}
                          className="w-full py-3 bg-accent hover:bg-yellow-500 text-white font-bold uppercase text-sm rounded shadow-md transition-all active:scale-95"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Footer: Wishlist & Share (Sabhi ke liye common) */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={handleWishlist}
                  className={`flex-1 py-2 px-3 rounded text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border ${isWishlisted ? "bg-red-50 text-red-500 border-red-200" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}
                >
                  <Heart size={14} className={isWishlisted ? "fill-current" : ""} />
                  {isWishlisted ? "Saved" : "Wishlist"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 py-2 px-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded text-[11px] font-bold uppercase tracking-wider text-gray-600 transition-all flex items-center justify-center gap-1.5"
                >
                  <Share2 size={14} /> Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── ROW 2: Tabs — full width ─── */}
        {/* ─── ROW 2: Book Overview & Tabs Section ─── */}
        <div className="mt-8">
          {/* Main Heading from Image */}
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-4 tracking-tight">
            Book Overview
          </h2>



          {/* Stylish Tabs Container */}
          <div className="bg-cream-100 border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Tab Bar */}
            <div className="bg-gray-50/80 border-b border-gray-200">
              <div className="flex gap-0 overflow-x-auto scrollbar-hide">
                {[
                  {
                    key: "details",
                    label: "Product Details",
                    show: true // Hamesha dikhega
                  },
                  {
                    key: "toc",
                    label: "Table of Contents",
                    show: tocImages.length > 0
                  },
                  {
                    key: "professional_review",
                    label: "Professional Review",
                    show: (book.criticsNote || book.critics_note) && (book.criticsNote || book.critics_note).trim() !== ""
                  },
                ]
                  .filter((tab) => tab.show) // Sirf data wale tabs ko render karega
                  .map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        if (tab.key === "toc") {
                          // 🟢 Agar TOC par click ho, toh modal kholo aur content tab dikhao
                          setPreviewTab('content');
                          setPreviewOpen(true);
                        } else {
                          // Baki tabs ke liye normal behavior
                          setActiveTab(tab.key);
                        }
                      }}
                      className={`px-8 py-4 text-xs font-bold font-montserrat uppercase tracking-widest border-b-2 transition-all ${activeTab === tab.key
                        ? "border-primary text-primary bg-white"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
              </div>
            </div>

            {/* Tab Content Area */}
            <div className="p-8 bg-white">
              {/* Tab: Product Details (Edition Details) */}
              {activeTab === "details" && (
                <div className="animate-fadeIn max-w-2xl">
                  {/* 🟢 List Layout: Ek ke niche ek (Single Column) */}
                  <div className="space-y-4">
                    {[
                      {
                        label: "Series",
                        value: book.series
                          ? typeof book.series === 'object' ? book.series.title : book.series
                          : null,
                      },
                      // 🟢 Series Number Logic
                      { label: "Series Number", value: book.series_number ? `#${book.series_number}` : null },
                      { label: "Format", value: book.binding },
                      { label: "Language", value: getDisplayValue(book.language) },
                      { label: "ISBN", value: book.isbn10 ? book.isbn10 : book.isbn13 },
                      { label: "Release Date", value: book.pub_date },
                      { label: "Publisher", value: getDisplayValue(book.publisher) },
                      { label: "Length", value: book.total_pages || book.pages ? `${book.total_pages || book.pages} Pages` : null },
                      { label: "Weight", value: book.weight },
                    ]
                      .filter((row) => row.value)
                      .map((row) => (
                        <div key={row.label} className="flex items-start text-sm border-b border-gray-50 pb-3 last:border-0">
                          {/* Label and Value side by side but in a vertical list flow */}
                          <span className="text-gray-500 font-medium w-40 shrink-0">{row.label}:</span>
                          <span className="text-gray-900 font-semibold">{row.value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Tab: Professional Review */}
              {activeTab === "professional_review" && (
                <div className="animate-fadeIn">
                  {(book.criticsNote || book.critics_note) ? (
                    <div
                      className="rich-content text-sm text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={createSafeHtml(book.criticsNote || book.critics_note)}
                    />
                  ) : (
                    <p className="text-gray-400 text-sm italic py-4">No reviews available.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🟢 Binding Display Box — below tabs, above ROW 3 */}
        {/* {Array.isArray(book.product_formats) && book.product_formats.length > 0 && (
          <div className="mt-4 bg-cream-100 border border-gray-200 rounded p-4">
            <h3 className="font-bold text-text-main text-xs uppercase tracking-widest mb-3 pb-2 border-b border-gray-100">Format / Binding</h3>
            <div className="flex flex-wrap gap-2">
              {book.product_formats.map((fmt, idx) => (
                <span key={idx} className="px-4 py-1.5 border-2 border-primary/30 text-primary text-sm font-bold rounded-full bg-primary/5 font-montserrat">
                  {typeof fmt === 'object' ? (fmt.title || fmt.name || '') : fmt}
                </span>
              ))}
            </div>
          </div>
        )} */}

        {/* ─── ROW 3: Related Subjects + Tags ─── */}
        {(() => {
          // 1. Check kar rahe hain ki data exist karta hai ya nahi
          const hasSubjects = leadCategory || productCategories.length > 0;
          const hasTags = tags.length > 0;

          // Agar dono hi nahi hain toh section render hi nahi hoga
          if (!hasSubjects && !hasTags) return null;

          return (
            <div className={`mt-4 grid grid-cols-1 ${hasSubjects && hasTags ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-4 items-start`}>

              {/* Related Subjects Box: Tabhi dikhega jab data hoga */}
              {hasSubjects && (
                <div className="bg-cream-100 border border-gray-200 rounded p-5">
                  <h3 className="font-bold text-text-main text-xs uppercase tracking-widest mb-3 pb-2 border-b border-gray-100">
                    Related Subjects
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {leadCategory && (
                      <Link
                        to={leadCategory.slug ? `/books/${leadCategory.slug}` : `/sale?category=${encodeURIComponent(leadCategory.name)}`}
                        className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full hover:bg-primary hover:text-white transition-colors"
                      >
                        {leadCategory.name}
                      </Link>
                    )}
                    {productCategories.map((cat, idx) => (
                      <Link
                        key={idx}
                        to={cat.slug ? `/books/${cat.slug}` : `/sale?category=${encodeURIComponent(cat.name)}`}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full hover:bg-gray-200 transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags Box: Hamesha dikhega agar data hai, aur Related Subjects na hone par Related Subjects ki jagah le lega */}
              {hasTags && (
                <div className="bg-cream-100 border border-gray-200 rounded p-5">
                  <h3 className="font-bold text-text-main text-xs uppercase tracking-widest mb-3 pb-2 border-b border-gray-100 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, idx) => (
                      <Link
                        key={idx}
                        to={`/sale?tag=${encodeURIComponent(tag)}`}
                        className="px-2.5 py-1 border border-gray-200 text-gray-600 text-xs rounded-full hover:border-primary hover:text-primary transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ─── ROW 4: You May Also Like ─── */}
        {/* ─── ROW 4: You May Also Like ─── */}
        {relatedBooks.length > 0 && (
          <div className="mt-8 bg-cream-100 border border-gray-200 rounded p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-display font-bold text-gray-900">
                You May Also Like
              </h2>
              {relatedBooks.length > 4 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollRelatedBooks("left")}
                    className="p-1.5 bg-cream-100 hover:bg-cream-200 rounded transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollRelatedBooks("right")}
                    className="p-1.5 bg-cream-100 hover:bg-cream-200 rounded transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div
              ref={relatedCarouselRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-3"
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
                    className="flex-shrink-0 w-40 bg-cream-50 border border-gray-200 rounded overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-white relative">
                      <img
                        /* 🟢 FIXED: Added getFullImageUrl for Related Books */
                        src={getFullImageUrl(relatedBook.default_image) || "https://via.placeholder.com/300x400?text=No+Image"}
                        alt={relatedBook.title}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                      />
                      {hasRelatedDiscount && (
                        <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm z-10 font-montserrat">
                          {relatedDiscount}% OFF
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-bold text-gray-900">
                        {/* 🟢 FIXED: Using formatPrice for Currency Support */}
                        {formatPrice(relatedBook.price)}
                      </p>
                      {hasRelatedDiscount && (
                        <span className="text-xs text-gray-400 line-through block">
                          {formatPrice(relatedBook.real_price)}
                        </span>
                      )}
                      {relatedBook.weight && (
                        <p className="text-[10px] text-gray-500 mt-1">{relatedBook.weight}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 🟢 Preview Modal */}
      {/* 🟢 Preview Modal */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all duration-300"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* ─── MODAL HEADER ─── */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-xl text-text-main leading-none">Book Preview</h3>
                <p className="text-[10px] text-gray-400 font-montserrat uppercase tracking-[0.2em]">{book.title}</p>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-all active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* ─── PREMIUM TAB BAR (Dynamic Logic) ─── */}
            <div className="flex px-8 bg-gray-50/50 border-b border-gray-100">
              {[
                { key: 'images', label: 'Images', show: true }, // Images hamesha dikhengi
                {
                  key: 'sample',
                  label: 'Sample Pages',
                  show: sampleImages.length > 0
                },
                {
                  key: 'content',
                  label: 'Table of Contents',
                  show: tocImages.length > 0
                },
              ]
                .filter(tab => tab.show) // Sirf wahi dikhao jiska data available hai
                .map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setPreviewTab(tab.key)}
                    className={`px-6 py-4 text-[11px] font-bold font-montserrat uppercase tracking-widest border-b-2 transition-all duration-300 
              ${previewTab === tab.key ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                  >
                    {tab.label}
                  </button>
                ))}
            </div>

            {/* ─── CONTENT AREA ─── */}
            <div className="overflow-y-auto flex-1 p-8 bg-white custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {(() => {
                  // 1. Data Selection Logic
                  const dataList = previewTab === 'content'
                    ? tocImages
                    : (previewTab === 'images'
                      ? [defaultImage, ...(book.relatedImages || book.related_images || []).map(i => i.image || i)]
                      : sampleImages.map(i => i?.image || i)
                    ).filter(Boolean);

                  if (dataList.length === 0) return <EmptyState message={`No ${previewTab} available`} />;

                  return dataList.map((img, idx) => {
                    const imgSrc = previewTab === 'content' ? img.image : (img.image || img);

                    return (
                      <div
                        key={idx}
                        className="relative group overflow-hidden aspect-[3/4] cursor-pointer rounded-xl border border-gray-100 shadow-sm"
                        onClick={() => setFullscreenImage(getFullImageUrl(imgSrc))}
                      >
                        <div className="w-full h-full p-2 sm:p-4 lg:p-6 flex items-center justify-center">
                          <img
                            src={getFullImageUrl(imgSrc)}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.1]"
                          />
                        </div>

                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center">
                          <div className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-2 scale-75 group-hover:scale-100 transition-transform">
                            <Eye className="text-white w-6 h-6" />
                          </div>
                          <span className="text-white text-[10px] font-bold uppercase tracking-widest drop-shadow-md font-montserrat">View Full Image</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 3. FULLSCREEN LIGHTBOX (Scroll & Fix Logic) */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex flex-col animate-in fade-in duration-300"
          onClick={() => setFullscreenImage(null)}
        >
          {/* Header: Isko alag rakha hai taaki X button fix rahe aur scrollbar niche rahe */}
          <div className="flex justify-end p-2 z-[210]">
            <button
              className="text-white/50 hover:text-white transition-all hover:rotate-90 duration-300 outline-none"
              onClick={() => setFullscreenImage(null)}
            >
              <X size={40} strokeWidth={2} />
            </button>
          </div>

          {/* Scrollable Container: Sirf isme scrollbar aayega */}
          <div
            className="flex-1 overflow-auto custom-scrollbar flex items-center justify-center p-2 md:p-2"
            onClick={() => setFullscreenImage(null)} // Background click to close
          >
            <img
              src={fullscreenImage}
              className="max-w-[95%] max-h-[75vh] w-auto  h-auto shadow-2xl transition-all duration-500 animate-in zoom-in-95 cursor-default object-contain"
              alt="Fullscreen Preview"
              style={{
                // Isse image apni natural quality maintain karegi
                minWidth: '40%',
                display: 'block'
              }}
              onClick={(e) => e.stopPropagation()} // Image click par band nahi hoga
            />
          </div>

          {/* Custom Scrollbar Styling taaki ganda na dikhe */}
          <style dangerouslySetInnerHTML={{
            __html: `
      .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #008DDA; border-radius: 10px; }
    `}} />
        </div>
      )}



      {/* 🟢 Series Books Section */}
      {seriesBooks.length > 0 && (
        <div className="max-w-380 mx-auto px-4 mt-8">
          <div className="bg-cream-100 border border-gray-200 rounded p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900">
                  More in the Series
                </h2>
                {book.series && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {typeof book.series === 'object' ? book.series.title : book.series}
                  </p>
                )}
              </div>
              {seriesBooks.length > 4 && (
                <div className="flex gap-2">
                  <button onClick={() => seriesCarouselRef.current?.scrollBy({ left: -300, behavior: 'smooth' })} className="p-1.5 bg-cream-100 hover:bg-cream-200 rounded transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => seriesCarouselRef.current?.scrollBy({ left: 300, behavior: 'smooth' })} className="p-1.5 bg-cream-100 hover:bg-cream-200 rounded transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div ref={seriesCarouselRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-3">
              {seriesBooks.map(sb => {
                const sbSlug = sb.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                return (
                  <Link key={sb._id} to={`/books/${sb.bagchee_id || sb._id}/${sbSlug}`} className="flex-shrink-0 w-40 bg-cream-50 border border-gray-200 rounded overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="aspect-[3/4] overflow-hidden bg-white">
                      <img
                        /* 🟢 FIXED: getFullImageUrl function added here */
                        src={getFullImageUrl(sb.default_image) || 'https://via.placeholder.com/300x400?text=No+Image'}
                        alt={sb.title}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-800 line-clamp-2 mb-1">{sb.title}</p>
                      {sb.series_number && <p className="text-[10px] text-gray-500">#{sb.series_number}</p>}
                      {/* 🟢 FIXED: Using formatPrice for proper currency display */}
                      <p className="text-sm font-bold text-primary">{formatPrice(sb.price)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}



      {/* ─── CUSTOMER REVIEWS SECTION (Full Width Aligned) ─── */}
      <div id="reviews-section" className="max-w-380 mx-auto px-4 mt-12 pb-10">
        <div className="bg-cream-100 border border-gray-200 rounded p-6 shadow-sm">

          {/* Header Area */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 border-b border-gray-200 pb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-text-main uppercase tracking-tight">
                Customer Reviews
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex text-accent">
                  {/* 🟢 Logic: Agar reviews hain to unka average nikaalna, warna book model ka purana rating */}
                  {[...Array(5)].map((_, i) => {
                    const avgRating = reviews.length > 0
                      ? Math.round(reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length)
                      : Math.floor(book?.rating || 0);

                    return (
                      <Star
                        key={i}
                        size={16}
                        fill={i < avgRating ? "currentColor" : "none"}
                      />
                    );
                  })}
                </div>
                <span className="text-sm text-gray-500 font-montserrat font-semibold">
                  {/* 🟢 Logic: Database se aaye huye active reviews ki total ginti dikhana */}
                  {reviews.length > 0 ? reviews.length : (book?.rated_times || 0)} Reviews
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-primary text-white px-8 py-3 rounded shadow-md hover:bg-primary-dark transition-all font-montserrat font-bold text-xs uppercase tracking-widest flex items-center gap-2 active:scale-95"
            >
              {showReviewForm ? <X size={16} /> : <PenLine size={16} />}
              {showReviewForm ? "Cancel" : "Write a Review"}
            </button>
          </div>

          {/* 🟢 Stylish Review Form Dropdown (Badi Width ke saath) */}
          {showReviewForm && (
            <div className="bg-white border-2 border-primary/10 rounded-xl p-6 md:p-10 mb-10 shadow-lg animate-fadeIn">
              <h4 className="font-display font-bold text-xl mb-6 text-text-main flex items-center gap-2">
                <MessageSquare className="text-primary" size={20} /> Share your thoughts
              </h4>
              <form onSubmit={handleReviewSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Rating Side */}
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                    <label className="block text-[11px] font-bold uppercase text-gray-400 mb-3 tracking-widest font-montserrat">
                      Your Rating
                    </label>
                    <div className="flex gap-2 text-accent">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <Star
                          key={num}
                          size={36}
                          className="cursor-pointer hover:scale-110 transition-transform"
                          fill={num <= reviewData.rating ? "currentColor" : "none"}
                          onClick={() => setReviewData({ ...reviewData, rating: num })}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Title Side */}
                  <div className="flex flex-col justify-end">
                    <label className="block text-[11px] font-bold uppercase text-gray-400 mb-2 tracking-widest font-montserrat">
                      Review Title
                    </label>
                    <input
                      type="text"
                      placeholder="Summarize your experience..."
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm font-montserrat transition-all"
                      value={reviewData.title}
                      onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
                    />
                  </div>
                </div>

                {/* Comment Area */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-2 tracking-widest font-montserrat">
                    Detailed Review
                  </label>
                  <textarea
                    placeholder="Tell us what you liked or disliked about this book..."
                    rows="5"
                    required
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm font-montserrat transition-all"
                    value={reviewData.review}
                    onChange={(e) => setReviewData({ ...reviewData, review: e.target.value })}
                  ></textarea>
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="w-full md:w-auto bg-text-main text-white px-12 py-4 rounded-lg font-bold text-xs uppercase tracking-slick hover:bg-black transition-all shadow-xl active:scale-95">
                    Post My Review
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews List Area */}
          <div className="space-y-6 mt-10">
            {reviews.length > 0 ? (
              reviews.map((rev, idx) => (
                <div key={rev._id || idx} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm animate-fadeIn">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-text-main font-montserrat">{rev.name}</p>
                      <div className="flex text-accent mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < rev.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {rev.title && <p className="font-bold text-sm text-text-main mb-2 uppercase tracking-wide">{rev.title}</p>}
                  <p className="text-gray-600 text-sm leading-relaxed italic">"{rev.review}"</p>
                </div>
              ))
            ) : (
              /* Agar koi review nahi hai toh ye dikhega */
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <MessageSquare size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-600 font-bold font-display text-lg">No reviews yet</p>
                <p className="text-gray-400 text-sm italic mt-1 font-montserrat">Be the first to share your thoughts about this book!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🟢 About the Author Section */}
      {/* 🟢 About the Author(s) Section - Professional MNC Layout */}
      {/* 🟢 About the Author(s) Section - With Read More Logic */}
      {authorData && authorData.length > 0 && (
        <div className="max-w-380 mx-auto px-4 mt-8">
          <div className="bg-cream-100 border border-gray-200 rounded p-6 shadow-sm">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight uppercase">
                About the Author{authorData.length > 1 ? 's' : ''}
              </h2>

              {authorData.length > 2 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentAuthorIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentAuthorIndex === 0}
                    className="p-2 bg-white border border-gray-200 hover:border-primary hover:text-primary rounded-full disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentAuthorIndex(prev => Math.min(authorData.length - 2, prev + 1))}
                    disabled={currentAuthorIndex >= authorData.length - 2}
                    className="p-2 bg-white border border-gray-200 hover:border-primary hover:text-primary rounded-full disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Authors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {(authorData || []).slice(currentAuthorIndex, currentAuthorIndex + 2).map((author, index) => {
                const authorId = author._id || `idx-${index}`;
                const isExpanded = expandedAuthors[authorId];
                const plainTextProfile = stripHtml(author.profile || book.aboutAuthorText || "");
                const isLongBio = plainTextProfile.length > 200;

                // 🟢 Step 1: Author ka slug generate karein (Jo AuthorDetail route se match kare)
                const authorSlug = createAuthorSlug(author);
                // console.log("Redirecting to:", authorSlug);

                return (
                  <div key={authorId} className="flex flex-col sm:flex-row gap-5 items-start animate-fadeIn bg-white/40 p-4 rounded-xl border border-white/60 hover:shadow-md transition-all duration-300">

                    {/* 🟢 Step 2: Image ko link banayein */}
                    <Link to={`/author/${authorSlug}`} className="shrink-0 group">
                      {/* onClick={() => console.log("Link clicked, target URL: /author/" + authorSlug)} */}
                      <div className="relative">
                        <img
                          src={author.picture ? getFullImageUrl(author.picture) : "https://via.placeholder.com/150?text=Author"}
                          alt={getAuthorName(author)}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-contain border-4 border-white shadow-md bg-gray-50 group-hover:border-primary/20 transition-all"
                          onError={e => { e.target.src = "https://via.placeholder.com/150?text=Author"; }}
                        />
                        {/* Hover overlay icon */}
                        <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Search size={20} className="text-primary" />
                        </div>
                      </div>
                    </Link>

                    {/* Author Details */}
                    <div className="flex-1 min-w-0 pt-2">
                      {/* 🟢 Step 3: Name ko link banayein */}
                      <Link to={`/author/${authorSlug}`} className="group/name">
                        <h3 className="text-xl font-bold text-gray-900 font-montserrat leading-tight group-hover/name:text-primary transition-colors">
                          {getAuthorName(author)}
                        </h3>
                      </Link>

                      {author.origin && (
                        <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-widest bg-primary/5 inline-block px-2 py-0.5 rounded">
                          {author.origin}
                        </p>
                      )}

                      <div className="mt-3 relative">
                        {plainTextProfile ? (
                          <>
                            <p className={`text-gray-700 text-sm leading-relaxed font-body transition-all duration-300 ${!isExpanded ? 'line-clamp-4' : ''}`}>
                              {plainTextProfile}
                            </p>

                            <div className="flex flex-col items-start gap-1 mt-2">
                              {isLongBio && (
                                <button
                                  onClick={() => toggleAuthorBio(authorId)}
                                  className="mt-2 text-primary font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 hover:text-primary-dark"
                                >
                                  {isExpanded ? (
                                    <>Show Less <ChevronDown className="w-3 h-3 rotate-180" /></>
                                  ) : (
                                    <>Read More <ChevronDown className="w-3 h-3" /></>
                                  )}
                                </button>
                              )}
                              {/* 🟢 View Profile Button (Redirect karne ke liye) */}
                              <Link
                                to={`/author/${authorSlug}`}
                                className="text-gray-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 hover:text-primary transition-colors mt-1"
                              >
                                view more books
                              </Link>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-start gap-3">
                            <p className="text-gray-400 text-sm italic font-body"></p>
                            <Link
                              to={`/author/${authorSlug}`}
                              className="text-primary font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 hover:underline"
                            >
                              view more books
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* 🟢 Others Also Bought Section */}
      {alsoBoughtBooks.length > 0 && (
        <div className="max-w-380 mx-auto px-4 mt-8 mb-8">
          <div className="bg-cream-100 border border-gray-200 rounded p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-display font-bold text-gray-900">Others Also Bought</h2>
              {alsoBoughtBooks.length > 4 && (
                <div className="flex gap-2">
                  <button onClick={() => alsoBoughtCarouselRef.current?.scrollBy({ left: -300, behavior: 'smooth' })} className="p-1.5 bg-cream-100 hover:bg-cream-200 rounded transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => alsoBoughtCarouselRef.current?.scrollBy({ left: 300, behavior: 'smooth' })} className="p-1.5 bg-cream-100 hover:bg-cream-200 rounded transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div ref={alsoBoughtCarouselRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-3">
              {alsoBoughtBooks.map(ab => {
                const abSlug = ab.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                const abHasDiscount = ab.real_price && ab.real_price > ab.price;
                const abDiscount = abHasDiscount ? Math.round(((ab.real_price - ab.price) / ab.real_price) * 100) : 0;
                return (
                  <Link key={ab._id} to={`/books/${ab.bagchee_id || ab._id}/${abSlug}`} className="flex-shrink-0 w-40 bg-cream-50 border border-gray-200 rounded overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="aspect-[3/4] overflow-hidden bg-white relative">
                      <img
                        /* 🟢 FIXED: getFullImageUrl added here */
                        src={getFullImageUrl(ab.default_image) || 'https://via.placeholder.com/300x400?text=No+Image'}
                        alt={ab.title}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                      />
                      {abHasDiscount && (
                        <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm z-10 font-montserrat">{abDiscount}% OFF</span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-800 line-clamp-2 mb-1">{ab.title}</p>
                      {/* 🟢 FIXED: Using formatPrice for proper currency display */}
                      <p className="text-sm font-bold text-primary">{formatPrice(ab.price)}</p>
                      {abHasDiscount && <span className="text-[10px] text-gray-400 line-through">{formatPrice(ab.real_price)}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Scrollbar hide */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        /* Rich HTML content from editor */
        .rich-content { font-size: 0.875rem; line-height: 1.75; color: #374151; }
        .rich-content h1, .rich-content h2, .rich-content h3,
        .rich-content h4, .rich-content h5, .rich-content h6 {
          font-weight: 700; color: #111827; margin-top: 1.25em; margin-bottom: 0.5em; line-height: 1.3;
        }
        .rich-content h1 { font-size: 1.5rem; }
        .rich-content h2 { font-size: 1.25rem; }
        .rich-content h3 { font-size: 1.1rem; }
        .rich-content p { margin-bottom: 0.875em; }
        .rich-content ul, .rich-content ol { padding-left: 1.5rem; margin-bottom: 0.875em; }
        .rich-content ul { list-style-type: disc; }
        .rich-content ol { list-style-type: decimal; }
        .rich-content li { margin-bottom: 0.25em; }
        .rich-content strong, .rich-content b { font-weight: 700; color: #111827; }
        .rich-content em, .rich-content i { font-style: italic; }
        .rich-content a { color: #008DDA; text-decoration: underline; }
        .rich-content a:hover { color: #006090; }
        .rich-content blockquote {
          border-left: 4px solid #008DDA; padding-left: 1rem;
          margin: 1em 0; color: #6b7280; font-style: italic;
        }
        .rich-content img { max-width: 100%; height: auto; border-radius: 0.375rem; margin: 0.75em 0; }
        .rich-content table { width: 100%; border-collapse: collapse; margin-bottom: 1em; font-size: 0.85rem; }
        .rich-content th, .rich-content td { border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; text-align: left; }
        .rich-content th { background: #f9fafb; font-weight: 600; }
        .rich-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.25em 0; }
        .rich-content pre { background: #f3f4f6; padding: 1rem; border-radius: 0.375rem; overflow-x: auto; font-size: 0.8rem; }
        .rich-content code { background: #f3f4f6; padding: 0.1em 0.35em; border-radius: 0.25rem; font-size: 0.82em; }
        .rich-content pre code { background: none; padding: 0; }
      `}</style>
    </div>

  );
};
// Helper for Empty States
const EmptyState = ({ message }) => (
  <div className="col-span-full py-32 text-center flex flex-col items-center justify-center">
    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
      <AlertTriangle className="text-gray-200 w-8 h-8" />
    </div>
    <p className="text-gray-400 font-montserrat italic text-sm tracking-wide">{message}</p>
  </div>
);

const NewsletterBox = ({ email, setEmail, onSubmit, message, bookTitle }) => (
  <div className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-xl p-6 animate-fadeIn">
    <div className="flex flex-col items-center text-center">
      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <MessageSquare className="text-primary w-6 h-6" />
      </div>
      <h3 className="font-display font-bold text-lg text-text-main mb-2">Get Notified</h3>
      <p className="text-xs text-gray-500 mb-6 font-body leading-relaxed">
        {message}
        <br />
        <span className="text-primary font-bold">Regarding: {bookTitle}</span>
      </p>
      <form onSubmit={onSubmit} className="w-full space-y-3">
        <input
          type="email"
          required
          placeholder="yourname@email.com"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-primary outline-none text-sm font-montserrat transition-all"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95">
          Notify Me
        </button>
      </form>
    </div>
  </div>
);
const MembershipPromoBox = ({ formatPrice, isChecked, onToggle, settingsData }) => {
  const usdCost = settingsData?.membership_cost || 35;
  return (
    <label className="bg-gray-50 border border-gray-100 rounded p-4 mb-4 flex items-start gap-3 shadow-sm cursor-pointer group hover:border-primary/30 transition-all block">
      <div className="relative flex items-center mt-1">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onToggle}
          className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-white checked:bg-primary checked:border-primary transition-all"
        />
        <Check size={14} strokeWidth={4} className="absolute text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-[14px] font-bold text-gray-900 leading-tight">Save 10% extra with Bagchee Membership</h4>

        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[12px] text-gray-500 font-medium">
            {formatPrice(usdCost, settingsData?.membership_cart_price || 2500, usdCost)}/year |{" "} <Link to="/membership" onClick={(e) => e.stopPropagation()} className="text-primary hover:underline">Learn More</Link>
          </span>
        </div>
      </div>
    </label>
  );
}
export default BookDetail;
