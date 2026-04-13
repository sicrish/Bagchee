import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { createSafeHtml } from '../../utils/sanitize';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { ChevronRight, MapPin, BookOpen, Star, Award, ArrowRight,ChevronLeft } from 'lucide-react';
import ProductCardGrid from '../../components/website/ProductCardGrid';

const AuthorDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [author, setAuthor] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  // Helper function to create slug from name
  const createSlug = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  //  const createAuthorSlug = (author) => {
  //   if (!author) return '';
  //   const name = typeof author === 'object'
  //     ? `${author.first_name || ''} ${author.last_name || ''}`.trim()
  //     : author;
  //   return name
  //     .toLowerCase()
  //     .trim()
  //     .replace(/[^a-z0-9\s-]/g, '')
  //     .replace(/\s+/g, '-')
  //     .replace(/-+/g, '-');
  // };

  const BASE_URL = process.env.REACT_APP_API_URL;


  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        setLoading(true);

        // Use the dedicated by-slug endpoint — returns camelCase fields from Prisma
        const authorRes = await axios.get(`${process.env.REACT_APP_API_URL}/authors/by-slug/${slug}`);

        if (!authorRes.data.status || !authorRes.data.data) {
          return;
        }

        const foundAuthor = authorRes.data.data;
        setAuthor(foundAuthor);

        try {
          const booksRes = await axios.get(
            `${process.env.REACT_APP_API_URL}/product/fetch?authors=${foundAuthor.id}&limit=20&page=${currentPage}`
          );
          if (booksRes.data.status) {
            setBooks(booksRes.data.data || []);
            // 🟢 Ye do lines add karein taaki buttons dikhen
            setTotalPages(booksRes.data.totalPages || Math.ceil(booksRes.data.total / 20));
            setTotalBooks(booksRes.data.total || 0);
          }
        } catch (bookError) {
          console.error('Error fetching books:', bookError);
          setBooks([]);
        }

      } catch (error) {
        console.error('Error fetching author data:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchAuthorData();
  }, [slug, navigate,currentPage]);

  // Calculate statistics
  const calculateStats = () => {
    if (books.length === 0) return { avgRating: 0, totalReviews: 0 };

    const totalRating = books.reduce((sum, book) => sum + (Number(book.rating) || 0), 0);
    const totalReviews = books.reduce((sum, book) => sum + (Number(book.rated_times) || 0), 0);
    const avgRating = books.length > 0 ? (totalRating / books.length).toFixed(1) : 0;

    return { avgRating, totalReviews };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }


  const getFullImageUrl = (path) => {
    if (!path) return null;
    // Agar path pehle se hi 'http' se shuru ho raha hai toh as-is rakhein, varna prefix lagayein
    return path.startsWith('http') ? path : `${BASE_URL}${path}`;
  };

  if (!author) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center font-body">
        <div className="text-center px-6">
          <h2 className="text-2xl font-bold text-text-main mb-2">Author Not Found</h2>
          <p className="text-text-muted mb-6">We couldn't find the author you're looking for.</p>
          <Link to="/" className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors font-montserrat font-bold text-sm uppercase">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  const authorImageUrl = author.picture
    ? getFullImageUrl(author.picture)
    : 'https://via.placeholder.com/400x400?text=Author';

  const authorFullName = `${author.firstName || ''} ${author.lastName || ''}`.trim();
  const authorBio = author.biography ? author.biography.replace(/<[^>]+>/g, '').substring(0, 160) : `Books and biography of ${authorFullName} on Bagchee.`;

  return (
    <div className="min-h-screen bg-cream-100 font-body">
      <Helmet>
        <title>{authorFullName} — Author | Bagchee</title>
        <meta name="description" content={authorBio} />
        <meta property="og:title" content={`${authorFullName} — Author | Bagchee`} />
        <meta property="og:description" content={authorBio} />
        {authorImageUrl && <meta property="og:image" content={authorImageUrl} />}
      </Helmet>
      {/* 🟢 BREADCRUMB - Minimalist Style */}
      <div className="border-b border-cream-200 bg-white/50 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted font-montserrat">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight size={12} className="opacity-50" />

            <span className="text-text-main">{author.firstName} {author.lastName}</span>
          </div>
        </div>
      </div>

      {/* 🟢 AUTHOR INTRO SECTION - Image 1 Style */}
      <div className="container mx-auto px-6 py-12 lg:py-20">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-12 lg:gap-20 max-w-7xl mx-auto">

          {/* Author Image Wrapper */}
          <div className="relative flex-shrink-0 animate-fadeInLeft">
            <div className="w-56 h-56 lg:w-72 lg:h-72 rounded-full overflow-hidden border-[10px] border-white shadow-2xl relative z-10">
              <img
                src={authorImageUrl}
                alt={`${author.firstName} ${author.lastName}`}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=Author' }}
              />
            </div>
            {/* Decorative background circle */}
            <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl -z-0 animate-pulse"></div>
          </div>

          {/* Author info & Bio */}
          <div className="flex-1 space-y-6 animate-fadeInRight text-center md:text-left">
            <div className="space-y-2">
              {author.origin && (
                <span className="inline-flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-2">
                  <MapPin size={12} /> {author.origin}
                </span>
              )}
              <h1 className="text-4xl lg:text-7xl font-display font-black text-text-main leading-none tracking-tightest">
                {author.firstName} {author.lastName}
              </h1>
              <div className="h-1.5 w-24 bg-primary rounded-full mt-4 mx-auto md:mx-0"></div>
            </div>

            {author.profile && (
              <div className="relative max-w-3xl">
                <div
                  className="text-text-muted text-lg lg:text-xl leading-relaxed font-body italic opacity-90 first-letter:text-5xl first-letter:font-display first-letter:mr-3 first-letter:float-left first-letter:text-primary"
                  dangerouslySetInnerHTML={createSafeHtml(author.profile)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🟢 BOOKS LIST SECTION - Professional 5-Column Grid */}
      <div className="bg-white py-16 lg:py-24 border-t border-cream-200">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-3xl lg:text-5xl font-display font-black text-text-main tracking-tight">
                Collection by {author.firstName}
              </h2>

            </div>


          </div>

          {books.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 lg:gap-10">
              {books.map(book => (
                <div key={book.id || book._id} className="transition-transform duration-500 hover:-translate-y-2">
                  <ProductCardGrid data={book} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-cream-50 rounded-[3rem] border-2 border-dashed border-cream-200 p-20 text-center">
              <BookOpen className="w-16 h-16 text-cream-200 mx-auto mb-4" />
              <h3 className="text-2xl font-display font-bold text-text-main">No Books Listed Yet</h3>

            </div>
          )}
        </div>
        {/* ... grid khatam hone ke baad ... */}

        {/* 🟢 PAGINATION BUTTONS SECTION */}
        {!loading && books.length > 0 && totalPages > 1 && (
          <div className="flex justify-center items-center mt-20 mb-10 gap-3 font-montserrat">
            {/* FIRST PAGE */}
            <button
              disabled={currentPage === 1}
              onClick={() => { setCurrentPage(1); window.scrollTo({ top: 500, behavior: 'smooth' }); }}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
            ${currentPage === 1 ? 'text-cream-200 border-cream-100 cursor-not-allowed' : 'text-primary border-primary hover:bg-primary hover:text-white shadow-sm active:scale-95'}`}
            >
              <ChevronLeft size={18} strokeWidth={3} className="-mr-2" />
              <ChevronLeft size={18} strokeWidth={3} />
            </button>

            {/* PREV */}
            <button
              disabled={currentPage === 1}
              onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 500, behavior: 'smooth' }); }}
              className={`flex items-center gap-1 px-5 py-2.5 rounded-full border-2 font-bold text-[11px] uppercase tracking-widest transition-all
            ${currentPage === 1 ? 'text-cream-200 border-cream-100 cursor-not-allowed' : 'text-primary border-primary hover:bg-primary hover:text-white shadow-md active:scale-95'}`}
            >
              <ChevronLeft size={16} strokeWidth={3} /> PREV
            </button>

            {/* PAGE NUMBERS (Smart logic to show dots) */}
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <button
                      key={index}
                      onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 500, behavior: 'smooth' }); }}
                      className={`w-11 h-11 rounded-full font-display font-bold text-sm transition-all border-2
                            ${currentPage === pageNum ? 'bg-primary text-white border-primary shadow-lg scale-110 z-10' : 'bg-white text-text-main border-cream-200 hover:border-primary hover:text-primary'}`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={index} className="text-cream-200 px-1 font-black">...</span>;
                }
                return null;
              })}
            </div>

            {/* NEXT */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 500, behavior: 'smooth' }); }}
              className={`flex items-center gap-1 px-5 py-2.5 rounded-full border-2 font-bold text-[11px] uppercase tracking-widest transition-all
            ${currentPage === totalPages ? 'text-cream-200 border-cream-100 cursor-not-allowed' : 'text-primary border-primary hover:bg-primary hover:text-white shadow-md active:scale-95'}`}
            >
              NEXT <ChevronRight size={16} strokeWidth={3} />
            </button>

            {/* LAST PAGE */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => { setCurrentPage(totalPages); window.scrollTo({ top: 500, behavior: 'smooth' }); }}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
            ${currentPage === totalPages ? 'text-cream-200 border-cream-100 cursor-not-allowed' : 'text-primary border-primary hover:bg-primary hover:text-white shadow-sm active:scale-95'}`}
            >
              <ChevronRight size={18} strokeWidth={3} />
              <ChevronRight size={18} strokeWidth={3} className="-ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorDetail;
