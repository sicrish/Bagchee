import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { ChevronRight, MapPin, BookOpen, Star, Award } from 'lucide-react';
import ProductCardGrid from '../../components/website/ProductCardGrid';

const AuthorDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [author, setAuthor] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        setLoading(true);
        
        // Fetch all authors and find by slug
        const authorsRes = await axios.get(`${process.env.REACT_APP_API_URL}/authors/list`);
        
        if (!authorsRes.data || !authorsRes.data.data) {
          navigate('/');
          return;
        }

        const foundAuthor = authorsRes.data.data.find(a => {
          const authorSlug = createSlug(`${a.first_name} ${a.last_name}`);
          return authorSlug === slug;
        });

        if (!foundAuthor) {
          navigate('/');
          return;
        }

        setAuthor(foundAuthor);

        // Fetch all books and filter by this author on client side
        // Since API doesn't support author parameter, we fetch all and filter
        try {
          const booksRes = await axios.get(
            `${process.env.REACT_APP_API_URL}/product/fetch`
          );
          
          // Filter books by author ID
          const allBooks = booksRes.data.data || [];
          const authorBooks = allBooks.filter(book => {
            // Check if book.author matches (could be ObjectId or populated object)
            if (typeof book.author === 'object' && book.author !== null) {
              return book.author._id === foundAuthor._id;
            }
            return book.author === foundAuthor._id;
          });
          
          setBooks(authorBooks);
        } catch (bookError) {
          console.error('Error fetching books:', bookError);
          // Still show author page even if books fetch fails
          setBooks([]);
        }
        
      } catch (error) {
        console.error('Error fetching author data:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorData();
  }, [slug, navigate]);

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

  if (!author) return null;

  const stats = calculateStats();
  const authorImageUrl = author.picture 
    ? `${author.picture}`
    : 'https://via.placeholder.com/400x400?text=Author';

  return (
    <div className="min-h-screen bg-cream">
      {/* Breadcrumb */}
      <div className="bg-cream-100 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/publishers-authors" className="hover:text-primary transition-colors">Authors</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">
              {author.first_name} {author.last_name}
            </span>
          </div>
        </div>
      </div>

      {/* Author Header Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-cream-100 rounded-xl border border-cream-200 p-6 md:p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Author Image */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="aspect-square rounded-xl overflow-hidden shadow-md">
                <img
                  src={authorImageUrl}
                  alt={`${author.first_name} ${author.last_name}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { 
                    e.target.src = 'https://via.placeholder.com/400x400?text=Author' 
                  }}
                />
              </div>
            </div>

            {/* Author Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                {author.first_name} {author.last_name}
              </h1>
              
              {/* Origin */}
              {author.origin && (
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="text-lg">{author.origin}</span>
                </div>
              )}

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {/* Total Books */}
                <div className="bg-white rounded-lg border border-cream-200 p-4 text-center shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold text-gray-900">{books.length}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Books Available</p>
                </div>

                {/* Average Rating */}
                <div className="bg-white rounded-lg border border-cream-200 p-4 text-center shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-2xl font-bold text-gray-900">{stats.avgRating}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Average Rating</p>
                </div>

                {/* Total Reviews */}
                <div className="bg-white rounded-lg border border-cream-200 p-4 text-center shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold text-gray-900">{stats.totalReviews}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Total Reviews</p>
                </div>
              </div>

              {/* Biography */}
              {author.profile && (
                <div className="bg-white rounded-lg border border-cream-200 p-6 shadow-sm">
                  <h2 className="text-xl font-display font-semibold text-gray-900 mb-3">
                    About the Author
                  </h2>
                  <div 
                    className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: author.profile }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Books by Author Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900">
              Books by {author.first_name} {author.last_name}
            </h2>
            <div className="text-sm text-gray-600">
              {books.length} {books.length === 1 ? 'Book' : 'Books'} Found
            </div>
          </div>
          
          {books.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {books.map(book => (
                <ProductCardGrid key={book._id} data={book} />
              ))}
            </div>
          ) : (
            <div className="bg-cream-100 rounded-xl border border-cream-200 p-12 text-center shadow-sm">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">
                No Books Available
              </h3>
              <p className="text-gray-600">
                Books by {author.first_name} {author.last_name} are currently not available.
              </p>
              <Link 
                to="/books" 
                className="inline-block mt-6 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors font-medium"
              >
                Browse All Books
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthorDetail;
