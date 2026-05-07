import React, { useState, memo, useCallback } from 'react';
import axios from '../../../../utils/axiosConfig.js';
import { ArrowRight, Star, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; // 🟢 React Query Import
import ProductCardGrid from '../../../website/ProductCardGrid.jsx';
import ProductModal from '../../../website/ProductModal.jsx'; 

// 🟢 Skeleton Component: Fast perceived loading ke liye
const SectionSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                <div className="aspect-[2/3] bg-gray-200" />
                <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-2 bg-gray-200 rounded w-1/2" />
                </div>
            </div>
        ))}
    </div>
);

const BooksOfTheMonthSection = () => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const itemsPerPage = 6;

    // 🟢 React Query: Fetching Logic
    const { data: queryResponse, isLoading } = useQuery({
        queryKey: ['books-of-the-month-home'], // Unique cache key
        queryFn: async () => {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/books-of-the-month/active`);
            return res.data;
        },
        staleTime: 600000, // 10 minutes cache (Home page load speed badhane ke liye)
        gcTime: 3600000, // 1 hour memory storage
    });

    // Extract data safely from response
    const data = queryResponse?.status ? queryResponse.data : null;

    // 🟢 Modal Handlers (Memoized)
    const handleOpenModal = useCallback((product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedProduct(null), 300); // Reset after transition
    }, []);

    // If no data and not loading, hide section
    if (!isLoading && (!data || !data.products || data.products.length === 0)) return null;

    return (
        <section id='books-of-the-month' className="py-10 md:py-16 bg-cream-50 font-body">
            <div className="w-full px-4 md:px-4">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-10 gap-2 md:gap-4 border-b border-primary-200 pb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-accent text-text-main text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest font-montserrat shadow-sm">
                                Editor's Choice
                            </span>
                        </div>
                        <h2 className="text-1.5xl md:text-3xl font-display font-black text-text-main uppercase">
                            {data?.monthName || "THIS MONTH'S"} <span className="text-primary">SELECTION</span>
                        </h2>
                        <p className="text-text-muted text-xs md:text-sm mt-1 font-body italic">
                            "{data?.headline || "Handpicked stories that define this month's reading journey."}"
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
                <div className="min-h-[300px]">
                    {isLoading ? (
                        <SectionSkeleton />
                    ) : (() => {
                        const allProducts = data?.products || [];
                        const totalPages = Math.ceil(allProducts.length / itemsPerPage);
                        const pageProducts = allProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);
                        return (
                            <div className="relative">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className={`absolute top-1/2 -left-2 md:-left-5 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-cream-100 border border-cream-200 rounded-full flex items-center justify-center text-text-muted shadow-lg z-20 transition-all duration-300 ${page === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-primary hover:border-primary hover:scale-110'}`}
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 transition-all duration-500">
                                    {pageProducts.map((item) => (
                                        <div key={item.id} className="relative group/card transform transition-all duration-300 hover:-translate-y-1">
                                            <div className="absolute top-2 right-2 z-20 transform group-hover/card:scale-110 transition-transform">
                                                <div className="bg-accent p-1.5 rounded-full shadow-md">
                                                    <Star fill="#0B2F3A" size={12} className="text-text-main" />
                                                </div>
                                            </div>
                                            <ProductCardGrid
                                                data={item.product}
                                                onQuickView={handleOpenModal}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className={`absolute top-1/2 -right-2 md:-right-5 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-cream-100 border border-cream-200 rounded-full flex items-center justify-center text-text-muted shadow-lg z-20 transition-all duration-300 ${page >= totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:text-primary hover:border-primary hover:scale-110'}`}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* 🟢 Render Product Modal */}
            <ProductModal 
                product={selectedProduct} 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
            />
        </section>
    );
};

export default memo(BooksOfTheMonthSection);