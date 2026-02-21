import React, { useState, useEffect } from 'react';
import axios from '../../../../utils/axiosConfig.js';
import { ArrowRight, Star, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCardGrid from '../../../website/ProductCardGrid.jsx';

const BooksOfTheMonthSection = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooksOfMonth = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/books-of-the-month/active`);
                if (res.data.status) {
                    setData(res.data.data);
                }
            } catch (err) {
                console.error("Error fetching Books of the Month:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBooksOfMonth();
    }, []);

    if (loading) return (
        <div className="py-16 bg-cream-50 flex justify-center items-center">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
        </div>
    );

    if (!data || !data.products || data.products.length === 0) return null;

    return (
        <section id='books-of-the-month' className="py-10 md:py-16 bg-cream-50 font-body">
            {/* 🟢 CHANGE: max-w-[1400px] added to match RecommendedSection exactly */}
            <div className="max-w-[1400px] mx-auto px-4">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-10 gap-2 md:gap-4 border-b border-primary-200 pb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-accent text-text-main text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest font-montserrat shadow-sm">
                                Editor's Choice
                            </span>
                        </div>
                        <h2 className="text-1.5xl md:text-3xl font-display font-black text-text-main  uppercase">
                            {data.monthName} <span className="text-primary">SELECTION</span>
                        </h2>
                        <p className="text-text-muted text-xs md:text-sm mt-1 font-body italic">
                            "{data.headline || "Handpicked stories that define this month's reading journey."}"
                        </p>
                    </div>
                    
                    <Link 
                        to="/books-of-the-month" 
                        className="flex items-center gap-2 text-xs md:text-sm uppercase tracking-wider text-text-main hover:text-primary transition-colors self-end md:self-auto font-montserrat"
                    >
                        See All <ArrowRight size={16} />
                    </Link>
                </div>

                {/* --- BOOKS GRID --- */}
                {/* 🟢 CHANGE: gap-4 md:gap-6 and same responsive columns to match RecommendedSection */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                    {data.products.slice(0, 6).map((book) => (
                        <div key={book._id} className="relative group/card">
                            {/* Special Badge */}
                            <div className="absolute top-2 right-2 z-20 transform group-hover/card:scale-110 transition-transform">
                                <div className="bg-accent p-1.5 rounded-full shadow-md">
                                    <Star fill="#0B2F3A" size={12} className="text-text-main" />
                                </div>
                            </div>
                            
                            {/* Product Card */}
                            <ProductCardGrid data={book} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BooksOfTheMonthSection;