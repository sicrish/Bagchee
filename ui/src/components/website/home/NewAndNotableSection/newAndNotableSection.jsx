import React, { useState, memo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ProductCardGrid from '../../ProductCardGrid.jsx';
import ProductModal from '../../ProductModal.jsx';
import { useGeo } from '../../../../context/GeoContext.jsx';

const ProductSkeleton = () => (
    <div className="bg-cream-100 rounded-lg overflow-hidden animate-pulse border border-gray-100">
        <div className="aspect-[3/4] bg-gray-200" />
        <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-2 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3 mt-3" />
        </div>
    </div>
);

const NewAndNotable = () => {
    const [page, setPage] = useState(1);
    const itemsPerPage = 6;
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { isIndia } = useGeo();

    const { data: queryData, isLoading, isPlaceholderData } = useQuery({
        queryKey: ['new-and-notable', page],
        queryFn: async () => {
            const API_URL = process.env.REACT_APP_API_URL;
            const res = await axios.get(`${API_URL}/home-new-noteworthy/frontend-list?page=${page}&limit=${itemsPerPage}`);
            return res.data;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 300000,
    });

    const products = queryData?.data || [];
    const visibleProducts = isIndia ? products.filter(b => { const book = b.product || b; return (book.inrPrice ?? book.inr_price ?? 0) > 0; }) : products;
    const sectionTitle = queryData?.sectionTitle || "NEW & NOTABLE";
    const sectionTagline = queryData?.sectionTagline || "";
    const totalPages = Math.ceil((queryData?.total || 0) / itemsPerPage);

    const handleNext = () => { if (page < totalPages) setPage(prev => prev + 1); };
    const handlePrev = () => { if (page > 1) setPage(prev => prev - 1); };

    if (!isLoading && visibleProducts.length === 0) return null;

    return (
        <section className="py-10 md:py-16 bg-cream-50 font-body">
            <div className="w-full px-4 md:px-4 group/section">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-10 gap-2 md:gap-4 border-b border-primary-200 pb-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-display text-text-main tracking-tight uppercase">
                            {sectionTitle}
                        </h2>
                        {sectionTagline && (
                            <p className="text-text-muted text-xs md:text-sm mt-1 font-body italic">
                                "{sectionTagline}"
                            </p>
                        )}
                    </div>
                    <Link to="/new-arrivals" className="flex items-center gap-2 text-xs md:text-sm uppercase tracking-wider text-text-main hover:text-primary transition-colors self-end md:self-auto font-montserrat">
                        See All <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="relative">
                    <button
                        onClick={handlePrev}
                        disabled={page === 1}
                        className={`absolute top-1/2 -left-2 md:-left-5 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-cream-100 border border-cream-200 rounded-full flex items-center justify-center text-text-muted shadow-lg z-20 transition-all duration-300 ${page === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-primary hover:border-primary hover:scale-110'}`}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 min-h-[350px] transition-opacity duration-200 ${isPlaceholderData ? 'opacity-50' : 'opacity-100'}`}>
                        {isLoading ? (
                            Array(itemsPerPage).fill(0).map((_, i) => <ProductSkeleton key={i} />)
                        ) : (
                            visibleProducts.map((item) => {
                                const book = item.product || item;
                                const bookId = book.id || book._id;
                                if (!bookId) return null;
                                return (
                                    <ProductCardGrid
                                        key={bookId}
                                        data={book}
                                        onQuickView={(product) => { setSelectedProduct(product); setIsModalOpen(true); }}
                                    />
                                );
                            })
                        )}
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={page >= totalPages}
                        className={`absolute top-1/2 -right-2 md:-right-5 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-cream-100 border border-cream-200 rounded-full flex items-center justify-center text-text-muted shadow-lg z-20 transition-all duration-300 ${page >= totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:text-primary hover:border-primary hover:scale-110'}`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <ProductModal
                product={selectedProduct}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </section>
    );
};

export default memo(NewAndNotable);
