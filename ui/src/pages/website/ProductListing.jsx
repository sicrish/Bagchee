'use client';

import React, { useState, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { LayoutGrid, List, ChevronDown, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query'; // 🟢 React Query

// Components
import SidebarFilter from '../../components/website/SidebarFilter';
import ProductCardGrid from '../../components/website/ProductCardGrid';
import ProductCardList from '../../components/website/ProductCardList';
import ProductModal from '../../components/website/ProductModal';

const ProductListing = ({ type }) => {
    const { slug } = useParams();
    const location = useLocation();

    // --- Layout & Modal States ---
    const [viewMode, setViewMode] = useState('grid');
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Pagination State ---
    const [currentPage, setCurrentPage] = useState(1);

    // --- Selected Filters State ---
    const [filters, setFilters] = useState({
        categories: [],
        authors: [],
        publishers: [],
        series: [],
        formats: [],
        price: '',
        sort: 'newest',
        rating: '',
        daysOld: '',
        isNewRelease: type === 'new-arrivals',
        isBestseller: type === 'bestsellers',
        isRecommended: type === 'recommended',
        isSale: type === 'sale'
    });

    // 🟢 Helper: Build Category Tree
    const buildCategoryTree = (categories) => {
        const map = {}; const tree = [];
        categories.forEach(c => map[c._id] = { ...c, children: [] });
        categories.forEach(c => {
            if (c.parentid && map[c.parentid]) map[c.parentid].children.push(map[c._id]);
            else tree.push(map[c._id]);
        });
        return tree;
    };

    // 🟢 Helper: Find Category Object
    const findCategoryObject = (categories, currentSlug) => {
        if (!categories || !currentSlug) return null;
        for (let cat of categories) {
            const title = cat.categorytitle || cat.title || "";
            const cleanTitle = title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
            const cleanSlug = currentSlug.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cat._id === currentSlug || cleanTitle === cleanSlug || cat.slug === currentSlug) return cat;
            if (cat.children && cat.children.length > 0) {
                const foundChild = findCategoryObject(cat.children, currentSlug);
                if (foundChild) return foundChild;
            }
        }
        return null;
    };

    // 🟢 1. FETCH SIDEBAR DATA (useQuery)
    const { data: sidebarData } = useQuery({
        queryKey: ['sidebar-options', slug, type],
        queryFn: async () => {
            const [catRes, optRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_API_URL}/category/fetch`),
                axios.get(`${process.env.REACT_APP_API_URL}/product/filter-options`)
            ]);

            let result = {
                allCategories: [],
                subcategoriesList: [],
                pageTitle: type ? type.replace(/-/g, ' ') : 'category',
                options: {}
            };

            if (catRes.data.status) {
                const flatCategories = catRes.data.data;
                result.allCategories = buildCategoryTree(flatCategories);

                if (slug) {
                    const foundCat = flatCategories.find(c => c.slug === slug);
                    if (foundCat) {
                        result.pageTitle = foundCat.categorytitle || foundCat.title;
                        result.subcategoriesList = flatCategories.filter(c => c.parentid && String(c.parentid) === String(foundCat._id));
                    } else {
                        result.pageTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    }
                } else {
                    result.subcategoriesList = flatCategories.filter(c => !c.parentid || c.level === 0);
                }
            }

            if (optRes.data.status) {
                result.options = optRes.data.data;
            }

            return result;
        },
        staleTime: 1000 * 60 * 30, // 30 mins cache
    });

    // 🟢 2. FETCH PRODUCTS (useQuery with Filters)
    const { data: productData, isLoading: loading, isPlaceholderData } = useQuery({
        queryKey: ['products-listing', filters, type, slug, currentPage],
        queryFn: async () => {
            const query = new URLSearchParams();
            query.append('page', currentPage);
            query.append('limit', 36);

            let categoryIds = [...filters.categories];
            if (slug && sidebarData?.allCategories) {
                const foundCat = findCategoryObject(sidebarData.allCategories, slug);
                if (foundCat && !categoryIds.includes(foundCat._id)) categoryIds.push(foundCat._id);
            }

            if (categoryIds.length > 0) query.append('categories', categoryIds.join(','));
            if (filters.formats.length) query.append('formats', filters.formats.join(','));
            if (filters.authors.length) query.append('authors', filters.authors.join(','));
            if (filters.publishers.length) query.append('publishers', filters.publishers.join(','));
            if (filters.series.length) query.append('series', filters.series.join(','));
            if (filters.price) {
                const [min, max] = filters.price.split('-');
                query.append('minPrice', min);
                query.append('maxPrice', max);
            }
            query.append('sort', filters.sort);
            if (filters.rating) query.append('rating', filters.rating);
            if (filters.daysOld) query.append('daysOld', filters.daysOld);

            let apiEndpoint = `${process.env.REACT_APP_API_URL}/product/fetch`;
            if (type === 'new-arrivals') apiEndpoint = `${process.env.REACT_APP_API_URL}/product/new-arrivals`;
            else if (type === 'bestsellers') apiEndpoint = `${process.env.REACT_APP_API_URL}/product/best-sellers`;
            else if (type === 'recommended') apiEndpoint = `${process.env.REACT_APP_API_URL}/product/recommended`;
            else if (type === 'sale') apiEndpoint = `${process.env.REACT_APP_API_URL}/product/sale-products`;

            const res = await axios.get(`${apiEndpoint}?${query.toString()}`);
            return res.data;
        },
        placeholderData: (previousData) => previousData, // 🟢 UI jump nahi karega loading ke time
        enabled: !!sidebarData || !slug, // Categories aane ka wait karein
    });

    const products = productData?.data || [];
    const totalProducts = productData?.total || 0;
    const totalPages = productData?.totalPages || 1;

    // --- Handlers ---
    const handleFilterChange = (key, value) => {
        setCurrentPage(1);
        if (key === 'clear') {
            setFilters({
                categories: [], authors: [], publishers: [], series: [], formats: [], price: '', sort: 'newest',
                isNewRelease: false, isBestseller: false, isRecommended: false, isSale: false
            });
            return;
        }
        setFilters(prev => {
            if (['categories', 'formats', 'authors', 'publishers', 'series'].includes(key)) {
                const list = prev[key];
                return { ...prev, [key]: list.includes(value) ? list.filter(i => i !== value) : [...list, value] };
            }
            return { ...prev, [key]: value };
        });
    };

    const openQuickView = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-cream-50 font-body text-text-main pb-10">
            {/* Header */}
            <div className="bg-white border-b border-cream-200 py-6 md:py-8 mb-6 shadow-sm">
                <div className="container mx-auto px-4">
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-primary uppercase tracking-slick">
                        {sidebarData?.pageTitle || 'Loading...'}
                    </h1>
                    <p className="text-sm text-text-muted mt-2 font-montserrat tracking-wide">Explore our exclusive collection</p>
                </div>
            </div>

            <div className="container mx-auto px-4 flex flex-col md:flex-row gap-8 relative">
                {/* Sidebar Filter */}
                <div className="w-full md:w-[20%] shrink-0">
                    <SidebarFilter
                        filters={filters}
                        handleFilterChange={handleFilterChange}
                        categories={sidebarData?.allCategories || []}
                        subcategories={sidebarData?.subcategoriesList || []}
                        subcategoriesLabel={slug ? "Sub Categories" : "Categories"}
                        formats={sidebarData?.options?.formats || []}
                        languages={sidebarData?.options?.languages || []}
                        authors={sidebarData?.options?.authors || []}
                        publishers={sidebarData?.options?.publishers || []}
                        series={sidebarData?.options?.series || []}
                        isSalePage={type === 'sale'}
                        isOpen={showMobileFilter}
                        onClose={() => setShowMobileFilter(false)}
                    />
                </div>

                {/* Right Content */}
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg border border-cream-200 shadow-sm mb-6 gap-4">
                        <button onClick={() => setShowMobileFilter(true)} className="md:hidden flex items-center gap-2 text-sm font-bold text-primary border border-primary px-4 py-2 rounded-md w-full sm:w-auto justify-center font-montserrat">
                            <SlidersHorizontal size={16} /> Filters
                        </button>

                        <div className="text-sm font-montserrat font-semibold text-text-muted">
                            Showing <span className="text-primary font-bold">{products.length}</span> of <span className="text-primary font-bold">{totalProducts}</span> results
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex items-center gap-2 bg-cream-50 p-1 rounded-md border border-cream-200">
                                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-primary'}`}>
                                    <LayoutGrid size={18} />
                                </button>
                                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-primary'}`}>
                                    <List size={18} />
                                </button>
                            </div>

                            {type !== 'sale' && (
                                <div className="relative group">
                                    <select value={filters.sort} onChange={(e) => handleFilterChange('sort', e.target.value)} className="appearance-none bg-primary text-white pl-4 pr-10 py-2 rounded-md text-sm font-bold cursor-pointer focus:outline-none hover:bg-primary-hover transition-colors font-montserrat tracking-wide">
                                        <option value="newest">Newest</option>
                                        <option value="bestseller">Bestselling</option>
                                        <option value="price_low">Price (low to high)</option>
                                        <option value="price_high">Price (high to low)</option>
                                        <option value="rating">Highly Rated</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Loader or Products */}
                    {loading && !isPlaceholderData ? (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
                    ) : (
                        <div className={`transition-opacity duration-300 ${isPlaceholderData ? 'opacity-50' : 'opacity-100'}`}>
                            {products.length > 0 ? (
                                <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5" : "flex flex-col gap-6"}>
                                    {products.map(product => (
                                        viewMode === 'grid'
                                            ? <ProductCardGrid key={product._id} data={product} onQuickView={openQuickView} />
                                            : <ProductCardList key={product._id} data={product} onQuickView={openQuickView} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white rounded-lg border border-cream-200">
                                    <p className="text-lg font-bold text-text-muted font-display">No products found matching your selection.</p>
                                    <button onClick={() => handleFilterChange('clear')} className="mt-4 text-primary hover:underline font-bold font-montserrat">Clear Filters</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination Buttons */}
                    {!loading && products.length > 0 && (
                        <div className="flex justify-center items-center mt-20 mb-10 gap-3 font-montserrat">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className={`flex items-center gap-1 px-5 py-2.5 rounded-full border-2 font-bold text-[11px] uppercase tracking-widest transition-all ${currentPage === 1 ? 'text-cream-200 border-cream-100 cursor-not-allowed' : 'text-primary border-primary hover:bg-primary hover:text-white shadow-md active:scale-95'}`}
                            >
                                <ChevronLeft size={16} strokeWidth={3} /> PREV
                            </button>

                            <div className="flex items-center gap-2">
                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNum = index + 1;
                                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                className={`w-11 h-11 rounded-full font-display font-bold text-sm transition-all border-2 ${currentPage === pageNum ? 'bg-primary text-white border-primary shadow-lg scale-110 z-10' : 'bg-white text-text-main border-cream-200 hover:border-primary hover:text-primary'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    }
                                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) return <span key={pageNum} className="text-cream-200 px-1 font-black">...</span>;
                                    return null;
                                })}
                            </div>

                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className={`flex items-center gap-1 px-5 py-2.5 rounded-full border-2 font-bold text-[11px] uppercase tracking-widest transition-all ${currentPage === totalPages ? 'text-cream-200 border-cream-100 cursor-not-allowed' : 'text-primary border-primary hover:bg-primary hover:text-white shadow-md active:scale-95'}`}
                            >
                                NEXT <ChevronRight size={16} strokeWidth={3} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && selectedProduct && (
                <ProductModal product={selectedProduct} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
};

export default ProductListing;