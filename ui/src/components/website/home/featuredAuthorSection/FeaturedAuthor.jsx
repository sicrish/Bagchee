import React , { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ChevronRight } from 'lucide-react';


const FeaturedAuthors = () => {
  
  const [expandedId, setExpandedId] = useState(null);
  // 1. Data Fetching Logic
  const { data: authorsData, isLoading } = useQuery({
    queryKey: ['featured-authors'],
    queryFn: async () => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/top-authors/list?active=true`);
      return res.data?.data || [];
    },
    staleTime: 300000,
  });

  // 2. Image URL Helper
  const getFullUrl = (path) => {
    if (!path) return "https://placehold.co/200x200?text=No+Image";
    if (path.startsWith('http')) return path;
    const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:5000";
    return `${API_BASE}/${path.replace(/^\//, '')}`;
  };

  if (isLoading) return <div className="py-20 text-center text-gray-400 font-body">Loading Literary Legends...</div>;

  // Agar data nahi hai toh section hide rahega
  if (!authorsData || authorsData.length === 0) return null;

  return (
    <section className="bg-cream-50 py-16 px-4 sm:px-8 font-body">
      <div className="max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display text-text-main mb-3 tracking-tight">
            Featured Awarded Authors
          </h2>
          <p className="text-text-muted text-sm md:text-base tracking-wide uppercase font-montserrat">
            Curated selection of literary legends
          </p>
          <div className="w-16 h-1 bg-secondary mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Grid Layout - authors.map ko badal kar authorsData.map kiya */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {authorsData.slice(0, 3).map((item) => {
            // Backend data population references
            const author = item.authorId;
            const book = item.bookId;
            const fullName = `${author?.first_name || ''} ${author?.last_name || ''}`;

            return (
              <div key={item._id} className="group bg-cream-100 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-cream-200 relative overflow-hidden">

                {/* Top Content: Image + Basic Info */}
                <div className="flex items-start gap-5 mb-5 relative z-10">
                  {/* Author Profile Picture */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary p-0.5 bg-white">
                      <img
                        src={getFullUrl(author?.picture)}
                        alt={fullName}
                        className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => { e.target.src = "https://placehold.co/200x200?text=Author"; }}
                      />
                    </div>
                  </div>

                  {/* Author Details */}
                  <div className="flex flex-col gap-2 min-w-0">
                    <h3 className="text-lg font-bold text-text-main font-display leading-tight truncate uppercase" title={fullName}>
                      {fullName || "Unknown Author"}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-primary font-bold mb-1 font-montserrat uppercase tracking-wider">
                      {item.role || "Featured Legend"}
                    </p>

                    {/* Featured Book Thumbnail */}
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-14 bg-white rounded shadow-sm border border-cream-200 overflow-hidden shrink-0">
                        <img
                          src={getFullUrl(book?.default_image)}
                          alt="Featured Book"
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                          onError={(e) => { e.target.src = "https://placehold.co/100x150?text=Book"; }}
                        />
                      </div>
                      <span className="text-[10px] text-text-muted italic font-body">
                        & more...
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quote Section */}
                <div className="relative pt-4 border-t border-dashed border-cream-300 flex flex-col flex-grow">
                  <span className="absolute top-0 left-0 text-4xl text-cream-300 font-serif -translate-y-2 select-none">“</span>
                  <p className="text-text-main text-sm italic leading-relaxed pl-5 font-body line-clamp-3">
                    {item.quote}
                  </p>
                  {/* Read More / Less Toggle with Arrow */}
                  {item.quote && item.quote.length > 120 && (
                    <button
                      onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
                      className="mt-2 text-primary font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 hover:underline transition-all"
                    >
                      {expandedId === item._id ? 'Read Less' : 'Read More'}
                      <ChevronRight
                        size={12}
                        className={`transition-transform duration-300 ${expandedId === item._id ? '-rotate-90' : 'rotate-0'}`}
                      />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedAuthors;