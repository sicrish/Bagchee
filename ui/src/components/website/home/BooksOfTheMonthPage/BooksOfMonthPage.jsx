import React, { useState, useEffect, memo, useCallback } from 'react';
import axios from '../../../../utils/axiosConfig.js';
import ProductCardGrid from '../../ProductCardGrid.jsx';
import ProductModal from '../../ProductModal.jsx'; // 🟢 Modal Import
import { useQuery } from '@tanstack/react-query'; // 🟢 React Query Import
import { Loader2 } from 'lucide-react';

// 🟢 Skeleton Component: Layout flicker rokne ke liye
const GridSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item) => (
            <div key={item} className="bg-white rounded-lg p-2 animate-pulse shadow-sm border border-gray-100">
                <div className="aspect-[2/3] bg-gray-200 rounded-md mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
        ))}
    </div>
);

const BooksOfMonthPage = () => {
    // 🟢 Modal States
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 🟢 React Query: Fetching Logic
    // Isse data cache rahega aur back-navigation par instant loading hogi
    const { data: queryResponse, isLoading, isError } = useQuery({
        queryKey: ['books-of-the-month-page'], // Unique cache key
        queryFn: async () => {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/books-of-the-month/active`);
            return res.data;
        },
        staleTime: 600000, // 10 minutes cache (Data refresh background mein hoga)
        cacheTime: 3600000, // 1 hour memory storage
        refetchOnWindowFocus: false, // Window switch karne par faltu refetch nahi
    });

    // Extract data from response safely
    const data = queryResponse?.status ? queryResponse.data : null;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 🟢 Modal Handlers (Memoized to prevent re-renders)
    const handleOpenModal = useCallback((product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        // Timeout taaki animation smooth khatam ho jaye before clearing data
        setTimeout(() => setSelectedProduct(null), 300);
    }, []);

    // Loading State
    if (isLoading && !data) return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-cream-50">
            <Loader2 className="animate-spin text-primary w-10 h-10" />
            <p className="mt-4 text-primary font-bold animate-pulse uppercase text-xs tracking-widest">Loading Selection...</p>
        </div>
    );

    // Error or No Data State
    if (isError || (!isLoading && !data)) return null;

    return (
        <div className="bg-cream-50 min-h-screen pb-20 font-body">
            {/* Dedicated Header for Full Page */}
            <div className="bg-primary text-white py-12 md:py-12 mb-12 shadow-inner">
                <div className="max-w-[1400px] mx-auto px-4 text-center">
                    <span className="bg-accent text-text-main text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest font-montserrat">
                        Curated Collection
                    </span>
                    <h1 className="text-4xl font-display font-black uppercase mt-4">
                        {data.monthName} <span className="text-accent">Selection</span>
                    </h1>
                    <p className="mt-6 text-lg opacity-90 font-montserrat italic max-w-3xl mx-auto">
                        "{data.headline}"
                    </p>
                </div>
            </div>

            {/* Grid - 6 columns layout with Modal integration */}
            <div className="max-w-[1400px] mx-auto px-4">
                {isLoading ? (
                    <GridSkeleton />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8 transition-opacity duration-500 opacity-100">
                        {data.products.map((book) => (
                            <div 
                                key={book.id} 
                                className="transform transition-all duration-300 hover:-translate-y-1"
                            >
                                <ProductCardGrid 
                                    data={book} 
                                    onQuickView={handleOpenModal} // 🟢 Modal trigger passed here
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 🟢 Render Product Modal */}
            <ProductModal 
                product={selectedProduct} 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
            />
        </div>
    );
};

export default memo(BooksOfMonthPage);