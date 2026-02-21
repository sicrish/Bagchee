import React from 'react';

const FeaturedAuthors = () => {
  const authors = [
    {
      id: 1,
      name: "Ruskin Bond",
      image: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?q=80&w=200&h=200&auto=format&fit=crop", 
      books: [
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=300&h=450&auto=format&fit=crop",
      ],
      role: "Padma Bhushan Awardee",
      quote: "“And when all the wars are over, a butterfly will still be beautiful.”",
    },
    {
      id: 2,
      name: "J.K. Rowling",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&h=200&auto=format&fit=crop",
      books: [
        "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=300&h=450&auto=format&fit=crop",
      ],
      role: "British Book Award Winner",
      quote: "“It is our choices, Harry, that show what we truly are, far more than our abilities.”",
    },
    {
      id: 3,
      name: "Arundhati Roy",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&h=200&auto=format&fit=crop",
      books: [
        "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=300&h=450&auto=format&fit=crop",
      ],
      role: "Booker Prize Winner",
      quote: "“To love. To be loved. To never forget your own insignificance.”",
    }
  ];

  return (
    // 1. CHANGE: Default text ko 'font-body' (Roboto) set kiya
    <section className="bg-cream-50 py-16 px-4 sm:px-8 font-body">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Heading */}
        <div className="text-center mb-12">
          
          {/* 2. CHANGE: Main Heading -> 'font-display' (Outfit) */}
          <h2 className="text-3xl md:text-4xl font-display  text-text-main mb-3 tracking-tight">
            Featured Awarded Authors
          </h2>
          
          {/* 3. CHANGE: Subheading -> 'font-montserrat' (Clean UI look) */}
          <p className="text-text-muted text-sm md:text-base tracking-wide uppercase font-montserrat">
            Curated selection of literary legends
          </p>
          
          <div className="w-16 h-1 bg-secondary mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {authors.map((author) => (
            <div 
              key={author.id} 
              className="group bg-cream-100 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-cream-200"
            >
              {/* Top Row: Image + Details */}
              <div className="flex items-start gap-5 mb-5">
                
                {/* Author Image */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary p-0.5">
                     <img 
                      src={author.image} 
                      alt={author.name} 
                      className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>

                {/* Right Side: Name & Role */}
                <div className="flex flex-col gap-2">
                  <div>
                    {/* 4. CHANGE: Author Name -> 'font-display' (Bold Outfit) */}
                    <h3 className="text-lg font-bold text-text-main font-display leading-tight">
                      {author.name}
                    </h3>
                    
                    {/* 5. CHANGE: Role/Label -> 'font-montserrat' */}
                    <p className="text-xs text-primary font-medium mb-2 font-montserrat">
                      {author.role}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                      <img 
                        src={author.books[0]} 
                        alt="Featured Book" 
                        className="w-10 h-14 object-cover rounded shadow-sm hover:-translate-y-1 transition-transform border border-cream-200"
                      />
                      <span className="text-[10px] text-text-muted italic font-body">
                        & more...
                      </span>
                  </div>
                </div>
              </div>

              {/* Bottom: Quote */}
              <div className="relative pt-4 border-t border-dashed border-cream-200">
                <span className="absolute top-0 left-0 text-4xl text-cream-200 font-serif -translate-y-2">“</span>
                
                {/* 6. CHANGE: Quote -> 'font-body' (Roboto) italic for readability */}
                <p className="text-text-main text-sm italic leading-relaxed pl-4 font-body line-clamp-3">
                  {author.quote}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedAuthors;