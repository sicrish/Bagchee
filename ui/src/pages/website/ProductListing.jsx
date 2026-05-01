import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { normalizeProducts } from '../../utils/normalizeProduct';
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
    const [baseTitleRef, setBaseTitleRef] = useState('category'); // original title before filters
    const [flatCats, setFlatCats] = useState([]);

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
            const title = cat.categorytitle || cat.title || "";
            // Clean match logic (Art & Nature -> art-and-nature)
            const cleanTitle = title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
            const cleanSlug = currentSlug.toLowerCase().replace(/[^a-z0-9]/g, '');

            if ((cat.id || cat._id) === currentSlug || cleanTitle === cleanSlug || cat.slug === currentSlug) {
                return cat;
            }
            if (cat.children && cat.children.length > 0) {
                const foundChild = findCategoryObject(cat.children, currentSlug);
                if (foundChild) return foundChild;
            }
        }
        return null;
    };


    // --- 1. Fetch Sidebar Options ---
    useEffect(() => {
        const fetchSidebarData = async () => {
            try {
                const [catRes, optRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_URL}/category/fetch`),
                    axios.get(`${process.env.REACT_APP_API_URL}/product/filter-options`)
                ]);

                if (catRes.data.status) {
                    const flatCategories = catRes.data.data; // flat array, all categories
                    const treeData = buildCategoryTree(flatCategories);
                    setAllCategories(treeData);
                    setFlatCats(flatCategories);

                    if (slug) {
                        // Find current category by slug from flat list
                        const foundCat = flatCategories.find(
                            c => c.slug === slug || c.slug.endsWith('/' + slug)
                        );
                        if (foundCat) {
                            const title = foundCat.categorytitle || foundCat.title;
                            setPageTitle(title);
                            setBaseTitleRef(title);
                            const foundCatId = foundCat.id || foundCat._id;
                            // Filter all categories whose parentId matches this category's id
                            const children = flatCategories.filter(
                                c => {
                                    const parentId = c.parentId || c.parentid;
                                    return parentId && String(parentId) === String(foundCatId);
                                }
                            );
                            setSubcategoriesList(children);
                        } else {
                            const fallback = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            setPageTitle(fallback);
                            setBaseTitleRef(fallback);
                            setSubcategoriesList([]);
                        }
                    } else {
                        const searchParams = new URLSearchParams(window.location.search);
                        const kw = searchParams.get('keyword');
                        if (type === 'search' && kw) {
                            const t = `Results for "${kw}"`;
                            setPageTitle(t);
                            setBaseTitleRef(t);
                            setSubcategoriesList([]);
                        } else {
                            const t = type ? type.replace(/-/g, ' ') : 'category';
                            setPageTitle(t);
                            setBaseTitleRef(t);
                            // No slug = special page (recommended/bestsellers etc.) — show root categories
                            const rootCategories = flatCategories.filter(c => !(c.parentId || c.parentid) || c.level === 0);
                            setSubcategoriesList(rootCategories);
                        }
                    }
                }

                if (optRes.data.status) {
                    const d = optRes.data.data;
                    setAllFormats(d.formats || []);
                    setAllLanguages(d.languages || []);
                    setAuthorsList(d.authors || []);
                    setPublishersList(d.publishers || []);
                    setSeriesList(d.series || []);
                }

            } catch (err) {
                console.error("Sidebar Error:", err);
            }
        };
        fetchSidebarData();
    }, [slug, type, location.search]);

    // --- 2. Fetch Products ---
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const query = new URLSearchParams();

                // 🟢 NAYA LOGIC: URL se search parameter read karna
                const params = new URLSearchParams(location.search);
                const searchKeyword = params.get('keyword');

                query.append('page', currentPage);
                query.append('limit', 36);

                // 🟢 SEARCH LOGIC: Agar URL me search query hai, toh use 'keyword' bana kar API ko bhejo
                if (searchKeyword) {
                    query.append('keyword', searchKeyword);
                }

                // 🟢 STEP 1: Pehle sidebar ke manually checked IDs lo
                let categoryIds = [...filters.categories];

                // 🟢 STEP 2: Agar URL mein slug hai, toh flat list se category ID nikaalo
                if (slug && allCategories.length > 0) {
                    const foundCat = findCategoryObject(allCategories, slug);
                    const foundCatId = foundCat && (foundCat.id || foundCat._id);
                    if (foundCat && foundCatId && !categoryIds.includes(foundCatId)) {
                        categoryIds.push(foundCatId);
                    }
                }

                // 🟢 STEP 3: Common filters for all API calls
                if (categoryIds.length > 0) {
                    query.append('categories', categoryIds.join(','));
                }
                if (filters.formats.length) query.append('formats', filters.formats.join(','));

                if (filters.authors) {
                    const authValue = Array.isArray(filters.authors)
                        ? filters.authors.join(',')
                        : filters.authors;
                    if (authValue) query.append('authors', authValue);
                }

                if (filters.publishers) {
                    const pubValue = Array.isArray(filters.publishers)
                        ? filters.publishers.join(',')
                        : filters.publishers;
                    if (pubValue) query.append('publishers', pubValue);
                }

                if (filters.series) {
                    const serValue = Array.isArray(filters.series)
                        ? filters.series.join(',')
                        : filters.series;
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

                if (filters.isNewRelease) query.append('isNewRelease', 'true');
                if (filters.isBestseller) query.append('isBestseller', 'true');
                if (filters.isRecommended) query.append('isRecommended', 'true');
                if (filters.isSale) query.append('isSale', 'true');

                // 🟢 STEP 4: Determine which API endpoint to use based on type
                let apiEndpoint = `${process.env.REACT_APP_API_URL}/product/fetch`;

                if (type === 'new-arrivals') {
                    apiEndpoint = `${process.env.REACT_APP_API_URL}/product/new-arrivals`;
                } else if (type === 'bestsellers') {
                    apiEndpoint = `${process.env.REACT_APP_API_URL}/product/best-sellers`;
                } else if (type === 'recommended') {
                    apiEndpoint = `${process.env.REACT_APP_API_URL}/product/recommended`;
                } else if (type === 'sale') {
                    apiEndpoint = `${process.env.REACT_APP_API_URL}/product/sale-products`;
                }

                const res = await axios.get(`${apiEndpoint}?${query.toString()}`);

                if (res.data.status) {
                    setProducts(normalizeProducts(res.data.data));
                    setTotalProducts(res.data.total);
                    setTotalPages(res.data.totalPages || Math.ceil(res.data.total / 36));
                }
            } catch (error) {
                console.error("Product Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        // 🟢 Trick: Tabhi fetch karo jab categories load ho chuki hon
        if (allCategories.length > 0 || !slug) {
            fetchProducts();
        }
    }, [filters, type, slug, allCategories, location.pathname, location.search, currentPage]);





    // --- Handlers ---
    const handleFilterChange = (key, value) => {
        setCurrentPage(1);
        if (key === 'clear') {
            setFilters({
                categories: [], authors: [], publishers: [], series: [], formats: [], price: '', sort: 'newest',
                isNewRelease: false, isBestseller: false, isRecommended: false, isSale: false
            });
            setPageTitle(baseTitleRef);
            return;
        }
        setFilters(prev => {
            if (['categories', 'formats', 'authors', 'publishers', 'series'].includes(key)) {
                const list = prev[key];
                const newList = list.includes(value) ? list.filter(i => i !== value) : [...list, value];

                if (key === 'categories') {
                    if (newList.length === 1) {
                        const cat = flatCats.find(c => String(c.id || c._id) === String(newList[0]));
                        if (cat) setPageTitle(cat.categorytitle || cat.title || baseTitleRef);
                    } else if (newList.length === 0) {
                        setPageTitle(baseTitleRef);
                    }
                }

                return { ...prev, [key]: newList };
            }
            return { ...prev, [key]: value };
        });
    };

    const openQuickView = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-cream-50 font-body text-text-main pb-10 overflow-x-hidden">
            {/* --- PAGE HEADER --- */}
            {/* --- PAGE HEADER --- */}
            {type === 'sale' ? (
           <div className="relative overflow-hidden bg-gradient-to-br from-[#ACE2E1]/40 via-cream-100/50 to-cream-100 py-2 md:py-2 font-montserrat border-b border-gray-200 mb-2">
    
    {/* --- BACKGROUND VIBE (Fresh & Deep) --- */}
    <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-white/60 rounded-full blur-[100px] z-0"></div>
    <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[500px] h-[500px] bg-primary-50/80 rounded-full blur-[80px] z-0"></div>
    
    {/* Subtle Dot Pattern for Texture */}
    <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#008DDA 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-20">

        {/* LEFT COMPOSITION: The "Visual Magnet" (Replacing the book with bold overlapping geometric shapes) */}
        <div className="w-full md:w-1/2 relative flex justify-center md:justify-start items-center min-h-[200px]">
            
            {/* Base Backdrop Circle (Teal/Primary tone) */}
            <div className="absolute w-36 h-36 md:w-48 md:h-48 bg-primary/10 backdrop-blur-md rounded-full shadow-2xl transform translate-y-4 -translate-x-4 border border-white/40"></div>

            {/* Accent Yellow Circle */}
            <div className="absolute w-20 h-20 md:w-28 md:h-28 bg-accent rounded-full shadow-lg transform translate-x-20 md:translate-x-32 -translate-y-16 animate-pulse" style={{ animationDuration: '4s' }}></div>

            {/* Floating Dots */}
            <div className="absolute top-0 left-12 w-10 h-10 bg-red-600 rounded-full shadow-md"></div>
            <div className="absolute bottom-4 right-16 md:right-32 w-6 h-6 bg-primary rounded-full shadow-sm"></div>

            {/* THE "SHOP NOW" HERO CIRCLE (Tilted, interactive, mimicking the red badge from your image) */}
            <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 bg-red-600 rounded-full shadow-2xl flex items-center justify-center transform -rotate-12 hover:rotate-0 hover:scale-105 transition-all duration-500 cursor-pointer group border-4 border-white">
                {/* Dashed inner border that rotates on hover */}
                <div className="absolute inset-2 border-[3px] border-dashed border-white/40 rounded-full group-hover:rotate-180 transition-transform duration-1000 ease-in-out"></div>
                <h2 className="text-white font-display font-black text-3xl md:text-4xl leading-[0.9] text-center drop-shadow-lg tracking-slick">
                    <span className="text-accent">sale!</span>
                </h2>
            </div>

        </div>

        {/* RIGHT CONTENT: The Typography & Messaging */}
        <div className="w-full md:w-1/2 text-center md:text-left space-y-6 md:space-y-8 animate-fadeInRight">
            
            {/* Headings */}
            <div className="space-y-1">
                <h1 className="text-5xl lg:text-7xl font-display font-black text-text-main tracking-tight uppercase leading-none">
                    Sale <span className="text-red-600">Today!</span>
                </h1>
                <h2 className="text-3xl lg:text-5xl font-display font-bold text-primary tracking-tighter uppercase relative inline-block">
                    Up to 80% Off
                    {/* Decorative underline */}
                    <div className="absolute -bottom-2 left-0 w-full h-2 bg-accent/40 rounded-full transform -skew-x-12"></div>
                </h2>
            </div>

            {/* Paragraph */}
            <p className="text-base md:text-lg text-text-muted font-body leading-relaxed max-w-lg mx-auto md:mx-0">
                Welcome to our Sale Shop! We have the very best deals <span className="font-bold text-text-main">Bagchee</span> has to offer with superb discounts</p>

            {/* Secondary CTA (Clean & Corporate) */}
            {/* <div className="pt-2 flex justify-center md:justify-start">
                <button className="cursor-default group flex items-center gap-3 bg-text-main hover:bg-primary text-white font-montserrat font-bold py-3 md:py-4 px-8 rounded-full shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <span className="tracking-widest uppercase text-sm">Explore All Deals</span>
                    <svg className="w-5 h-5 group-hover:translate-y-1.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </button>
            </div> */}

        </div>

    </div>
</div>
            ) : (
                // ⚪ NORMAL CATEGORY BANNER
                <div className="bg-white border-b border-cream-200 py-6 md:py-8 mb-6 shadow-sm">
                    <div className="w-full mx-auto px-4 md:px-8">
                        <h1 className="text-2xl md:text-3xl font-display font-bold text-primary uppercase tracking-slick">
                            {pageTitle}
                        </h1>
                        <p className="text-sm text-text-muted mt-2 font-montserrat tracking-wide">
                            Explore our exclusive collection
                        </p>
                    </div>
                </div>
            )}

            <div className="w-full mx-auto px-4 md:px-2 flex flex-col md:flex-row gap-6 relative">

                {/* --- SIDEBAR SECTION --- */}
                {/* 🟢 FIXED RESPONSIVENESS: Mobile par hide, md (tablet) par dikhega */}
                <div className="w-full md:w-[17%] shrink-0">
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
            </div>

            {/* Quick View Modal */}
            {isModalOpen && selectedProduct && (
                <ProductModal product={selectedProduct} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            )}
            {/* 🟢 PAGINATION BUTTONS */}

            {!loading && products.length > 0 && (
                <div className="flex flex-wrap px-4 justify-center items-center mt-20 mb-10 gap-3 font-montserrat">
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
    categories.forEach(c => {
        const id = c.id || c._id;
        map[id] = { ...c, children: [] };
    });
    categories.forEach(c => {
        const id = c.id || c._id;
        const parentId = c.parentId || c.parentid;
        if (parentId && map[parentId]) map[parentId].children.push(map[id]);
        else tree.push(map[id]);
    });
    return tree;
};

export default ProductListing;
