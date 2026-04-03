import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from '../../utils/axiosConfig';
import { LayoutGrid, List, ChevronDown, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

// Components
import SidebarFilter from '../../components/website/SidebarFilter';
import ProductCardGrid from '../../components/website/ProductCardGrid';
import ProductCardList from '../../components/website/ProductCardList';
import ProductModal from '../../components/website/ProductModal';

const ProductListing = ({ type }) => {
    const { slug } = useParams();
    const location = useLocation();

    // --- States ---
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalProducts, setTotalProducts] = useState(0);
    const [viewMode, setViewMode] = useState('grid');
    const [showMobileFilter, setShowMobileFilter] = useState(false);

    // Modal State
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Sidebar Data States
    const [allCategories, setAllCategories] = useState([]);
    const [allFormats, setAllFormats] = useState([]);
    const [allLanguages, setAllLanguages] = useState([]);

    const [authorsList, setAuthorsList] = useState([]);
    const [publishersList, setPublishersList] = useState([]);
    const [seriesList, setSeriesList] = useState([]);
    const [subcategoriesList, setSubcategoriesList] = useState([]); // child categories of current slug
    const [pageTitle, setPageTitle] = useState('category');

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Selected Filters
    const [filters, setFilters] = useState({
        categories: [],
        authors: [],    // 🟢 New
        publishers: [], // 🟢 New
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
    // 🟢 BuildCategoryTree ke upar ye paste karein
    const findCategoryObject = (categories, currentSlug) => {
        if (!categories || !currentSlug) return null;
        for (let cat of categories) {
            const title = cat.title || cat.categorytitle || "";
            // Clean match logic (Art & Nature -> art-and-nature)
            const cleanTitle = title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
            const cleanSlug = currentSlug.toLowerCase().replace(/[^a-z0-9]/g, '');

            if (cat.id === currentSlug || cleanTitle === cleanSlug || cat.slug === currentSlug) {
                return cat;
            }
            if (cat.children && cat.children.length > 0) {
                const foundChild = findCategoryObject(cat.children, currentSlug);
                if (foundChild) return foundChild;
            }
        }
        return null;
    };


    // --- Fetch sidebar data + products in parallel (no waterfall) ---
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                // Build product query params upfront
                const query = new URLSearchParams();
                const params = new URLSearchParams(location.search);
                const searchKeyword = params.get('keyword') || params.get('search');
                const tagParam = params.get('tag');
                const seriesParam = params.get('series');
                const publisherParam = params.get('publisher');
                const authorParam = params.get('author');

                query.append('page', currentPage);
                query.append('limit', 36);
                if (searchKeyword) query.append('keyword', searchKeyword);
                if (tagParam) query.append('tag', tagParam);
                if (seriesParam) query.append('series', seriesParam);
                if (publisherParam) query.append('publishers', publisherParam);
                if (authorParam) query.append('authors', authorParam);

                // Apply sidebar filters
                let categoryIds = [...filters.categories];
                if (filters.formats.length) query.append('formats', filters.formats.join(','));
                if (filters.authors) {
                    const authValue = Array.isArray(filters.authors) ? filters.authors.join(',') : filters.authors;
                    if (authValue) query.append('authors', authValue);
                }
                if (filters.publishers) {
                    const pubValue = Array.isArray(filters.publishers) ? filters.publishers.join(',') : filters.publishers;
                    if (pubValue) query.append('publishers', pubValue);
                }
                if (filters.series) {
                    const serValue = Array.isArray(filters.series) ? filters.series.join(',') : filters.series;
                    if (serValue) query.append('series', serValue);
                }
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

                // Fetch categories, filter options, and products in parallel
                const [catRes, optRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_URL}/category/fetch`),
                    axios.get(`${process.env.REACT_APP_API_URL}/product/filter-options`)
                ]);

                // Process categories and resolve slug to ID before product fetch
                let treeData = [];
                if (catRes.data.status) {
                    const flatCategories = catRes.data.data;
                    treeData = buildCategoryTree(flatCategories);
                    setAllCategories(treeData);

                    if (slug) {
                        const foundCat = flatCategories.find(
                            c => c.slug === slug || (c.slug && c.slug.endsWith('/' + slug))
                        );
                        if (foundCat) {
                            setPageTitle(foundCat.title || foundCat.categorytitle);
                            const children = flatCategories.filter(
                                c => (c.parentId || c.parentid) && String(c.parentId || c.parentid) === String(foundCat.id)
                            );
                            setSubcategoriesList(children);
                            if (!categoryIds.includes(foundCat.id)) categoryIds.push(foundCat.id);
                        } else {
                            setPageTitle(slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
                            setSubcategoriesList([]);
                        }
                    } else {
                        setPageTitle(type ? type.replace(/-/g, ' ') : 'category');
                        const rootCategories = flatCategories.filter(c => (!c.parentId && !c.parentid) || c.parentId === 0 || c.level === 0);
                        setSubcategoriesList(rootCategories);
                    }
                }

                if (optRes.data.status) {
                    const d = optRes.data.data;
                    setAllFormats(d.formats || []);
                    setAllLanguages(d.languages || []);
                    setAuthorsList(d.authors || []);
                    setPublishersList(d.publishers || []);
                    setSeriesList(d.series || []);

                    // Set page title for series/publisher/author filter from URL
                    if (seriesParam) {
                        const s = (d.series || []).find(s => String(s.id) === seriesParam);
                        if (s) setPageTitle(s.title);
                    }
                    if (publisherParam) {
                        const p = (d.publishers || []).find(p => String(p.id) === publisherParam);
                        if (p) setPageTitle(p.title);
                    }
                    if (authorParam) {
                        const a = (d.authors || []).find(a => String(a.id) === authorParam);
                        if (a) setPageTitle(a.fullName || `${a.firstName} ${a.lastName}`);
                    }
                }

                // Resolve /series/:slug and /publisher/:slug to IDs
                if (type === 'series' && slug && optRes.data.status) {
                    const allSeries = optRes.data.data.series || [];
                    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const match = !isNaN(slug)
                        ? allSeries.find(s => String(s.id) === slug)
                        : allSeries.find(s => s.title.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSlug);
                    if (match) {
                        query.append('series', match.id);
                        setPageTitle(match.title);
                    }
                }
                if (type === 'publisher' && slug && optRes.data.status) {
                    const allPubs = optRes.data.data.publishers || [];
                    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const match = !isNaN(slug)
                        ? allPubs.find(p => String(p.id) === slug)
                        : allPubs.find(p => p.title.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSlug);
                    if (match) {
                        query.append('publishers', match.id);
                        setPageTitle(match.title);
                    }
                }

                // Now fetch products with resolved category IDs
                if (categoryIds.length > 0) query.append('categories', categoryIds.join(','));
                const res = await axios.get(`${apiEndpoint}?${query.toString()}`);

                if (res.data.status) {
                    setProducts(res.data.data);
                    setTotalProducts(res.data.total);
                    setTotalPages(res.data.totalPages || Math.ceil(res.data.total / 36));
                }
            } catch (error) {
                console.error("Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [filters, type, slug, location.pathname, location.search, currentPage]);





    // --- Handlers ---
    const handleFilterChange = (key, value) => {
        setCurrentPage(1);
        if (key === 'clear') {
            setFilters({
                categories: [], authors: [], publishers: [], series: [], formats: [], price: '', sort: 'newest',
                isNewRelease: false, isBestseller: false, isRecommended: false, isSale: false
            });
            setPageTitle(type?.replace('-', ' ') || 'category');
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
            <Helmet>
                <title>{pageTitle ? `${pageTitle} — Bagchee` : 'Books — Bagchee'}</title>
                <meta name="description" content={`Shop ${pageTitle || 'books'} at Bagchee — India's favourite online bookstore. Best prices, free delivery.`} />
            </Helmet>
            {/* --- PAGE HEADER --- */}
            <div className="bg-white border-b border-cream-200 py-6 md:py-8 mb-6 shadow-sm">
                <div className="container mx-auto px-4">
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-primary uppercase tracking-slick">
                        {pageTitle}
                    </h1>
                    <p className="text-sm text-text-muted mt-2 font-montserrat tracking-wide">
                        Explore our exclusive collection
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 flex flex-col md:flex-row gap-8 relative">

                {/* --- SIDEBAR SECTION --- */}
                {/* 🟢 FIXED RESPONSIVENESS: Mobile par hide, md (tablet) par dikhega */}
                <div className="w-full md:w-[20%] shrink-0">
                    <SidebarFilter
                        filters={filters}
                        handleFilterChange={handleFilterChange}
                        categories={allCategories}
                        subcategories={subcategoriesList}
                        subcategoriesLabel={slug ? "Sub Categories" : "Categories"}
                        formats={allFormats}
                        languages={allLanguages}
                        authors={authorsList}
                        publishers={publishersList}
                        series={seriesList}
                        isSalePage={type === 'sale'}
                        // Important for drawer functionality
                        isOpen={showMobileFilter}
                        onClose={() => setShowMobileFilter(false)}
                    />
                </div>

                {/* --- RIGHT CONTENT --- */}
                <div className="flex-1">
                    {/* Top Toolbar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg border border-cream-200 shadow-sm mb-6 gap-4">
                        {/* Mobile Filter Toggle */}
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

                    {/* PRODUCT GRID / LIST */}
                    {loading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
                    ) : products.length > 0 ? (
                        <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5" : "flex flex-col gap-6"}>
                            {products.map(product => (
                                viewMode === 'grid'
                                    ? <ProductCardGrid key={product.id} data={product} onQuickView={openQuickView} />
                                    : <ProductCardList key={product.id} data={product} onQuickView={openQuickView} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-lg border border-cream-200">
                            <p className="text-lg font-bold text-text-muted font-display">No products found matching your selection.</p>
                            <button onClick={() => handleFilterChange('clear')} className="mt-4 text-primary hover:underline font-bold font-montserrat">Clear Filters</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick View Modal */}
            {isModalOpen && selectedProduct && (
                <ProductModal product={selectedProduct} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            )}
            {/* 🟢 PAGINATION BUTTONS */}

            {!loading && products.length > 0 && (
                <div className="flex justify-center items-center mt-20 mb-10 gap-3 font-montserrat">
                    {/* 1. FIRST PAGE BUTTON (Double Left Arrow) */}
                    <button
                        disabled={currentPage === 1}
                        onClick={() => { setCurrentPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                ${currentPage === 1
                                ? 'text-cream-200 border-cream-100 cursor-not-allowed'
                                : 'text-primary border-primary hover:bg-primary hover:text-white shadow-sm active:scale-95'
                            }`}
                        title="First Page"
                    >
                        <ChevronLeft size={18} strokeWidth={3} className="-mr-2" />
                        <ChevronLeft size={18} strokeWidth={3} />
                    </button>
                    {/* PREV BUTTON */}
                    <button
                        disabled={currentPage === 1}
                        onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className={`flex items-center gap-1 px-5 py-2.5 rounded-full border-2 font-bold text-[11px] uppercase tracking-widest transition-all
                ${currentPage === 1
                                ? 'text-cream-200 border-cream-100 cursor-not-allowed'
                                : 'text-primary border-primary hover:bg-primary hover:text-white shadow-md active:scale-95'
                            }`}
                    >
                        <ChevronLeft size={16} strokeWidth={3} /> PREV
                    </button>

                    {/* PAGE NUMBERS */}
                    <div className="flex items-center gap-2">
                        {[...Array(totalPages)].map((_, index) => {
                            const pageNum = index + 1;
                            if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className={`w-11 h-11 rounded-full font-display font-bold text-sm transition-all border-2
                                ${currentPage === pageNum
                                                ? 'bg-primary text-white border-primary shadow-lg scale-110 z-10'
                                                : 'bg-white text-text-main border-cream-200 hover:border-primary hover:text-primary'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            }
                            if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                return <span key={pageNum} className="text-cream-200 px-1 font-black">...</span>;
                            }
                            return null;
                        })}
                    </div>

                    {/* NEXT BUTTON */}
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className={`flex items-center gap-1 px-5 py-2.5 rounded-full border-2 font-bold text-[11px] uppercase tracking-widest transition-all
                ${currentPage === totalPages
                                ? 'text-cream-200 border-cream-100 cursor-not-allowed'
                                : 'text-primary border-primary hover:bg-primary hover:text-white shadow-md active:scale-95'
                            }`}
                    >
                        NEXT <ChevronRight size={16} strokeWidth={3} />
                    </button>

                    {/* 5. LAST PAGE BUTTON (Double Right Arrow) */}
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => { setCurrentPage(totalPages); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                ${currentPage === totalPages
                                ? 'text-cream-200 border-cream-100 cursor-not-allowed'
                                : 'text-primary border-primary hover:bg-primary hover:text-white shadow-sm active:scale-95'
                            }`}
                        title="Last Page"
                    >
                        <ChevronRight size={18} strokeWidth={3} />
                        <ChevronRight size={18} strokeWidth={3} className="-ml-2" />
                    </button>
                </div>
            )}
        </div>

    );
};

const buildCategoryTree = (categories) => {
    const map = {}; const tree = [];
    categories.forEach(c => map[c.id] = { ...c, children: [] });
    categories.forEach(c => {
        const pid = c.parentId || c.parentid;
        if (pid && map[pid]) map[pid].children.push(map[c.id]);
        else tree.push(map[c.id]);
    });
    return tree;
};

export default ProductListing;