import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Star, ShoppingCart, ChevronRight, SlidersHorizontal, X, Check, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import AddToCartButton from '../../components/website/common/AddToCartButton';
import ProductCardGrid from '../../components/website/ProductCardGrid';

const Sale = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // State Management
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [categories, setCategories] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    priceRange: 'all',
    discount: 'all',
    rating: 'all',
    categories: [],
    sortBy: 'discount-high'
  });

  // Collapsible filter sections
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    discount: true,
    rating: true,
    category: true,
    sort: true
  });

  // Fetch sale products
  useEffect(() => {
    fetchSaleProducts();
    fetchCategories();
  }, []);

  const fetchSaleProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/home-sale-products/frontend-list`
      );
      
      if (response.data.status) {
        const productsData = response.data.data.map(item => {
          const product = item.product;
          
          // Ensure categoryId is properly set
          let categoryId = product.categoryId;
          
          // If categoryId doesn't exist, try to get it from category object
          if (!categoryId && product.category) {
            if (typeof product.category === 'object' && product.category._id) {
              categoryId = product.category._id;
            } else if (typeof product.category === 'string') {
              categoryId = product.category;
            }
          }
          
          return {
            ...product,
            categoryId: categoryId, // Explicitly set categoryId
            saleOrder: item.order,
            isActive: item.isActive
          };
        });
        
        
        setProducts(productsData);
        setFilteredProducts(productsData);
      } else {
        toast.error('Failed to load sale products');
      }
    } catch (error) {
      console.error('Error fetching sale products:', error);
      toast.error('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/category/fetch`);
      if (response.data.status) {
        // Build hierarchical category tree like ProductListing
        setCategories(buildCategoryTree(response.data.data));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    let result = [...products];

    // Price filter
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      result = result.filter(p => p.price >= min && (max ? p.price <= max : true));
    }

    // Discount filter
    if (filters.discount !== 'all') {
      const minDiscount = parseInt(filters.discount);
      result = result.filter(p => (p.discount || 0) >= minDiscount);
    }

    // Rating filter
    if (filters.rating !== 'all') {
      const minRating = parseInt(filters.rating);
      result = result.filter(p => (p.rating || 0) >= minRating);
    }

    // Category filter - only show products that match selected categories
    if (filters.categories.length > 0) {
      result = result.filter(p => {
        // Get the product's category ID - try multiple fields
        let productCategoryId = p.categoryId;
        
        // Fallback to category object if categoryId doesn't exist
        if (!productCategoryId && p.category) {
          if (typeof p.category === 'object' && p.category._id) {
            productCategoryId = p.category._id;
          } else if (typeof p.category === 'string') {
            productCategoryId = p.category;
          }
        }
        
        if (!productCategoryId) return false;
        
        // Convert to string for comparison
        const categoryIdStr = typeof productCategoryId === 'object' 
          ? productCategoryId.toString() 
          : String(productCategoryId);
        
        // Check if product's category is in selected categories
        return filters.categories.some(selectedCat => String(selectedCat) === categoryIdStr);
      });
    }

    // Sorting
    switch (filters.sortBy) {
      case 'discount-high':
        result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      case 'discount-low':
        result.sort((a, b) => (a.discount || 0) - (b.discount || 0));
        break;
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }

    setFilteredProducts(result);
    
  }, [filters, products]);

  const handleFilterChange = (key, value) => {
    if (key === 'categories') {
      setFilters(prev => {
        const current = prev.categories;
        const newCategories = current.includes(value)
          ? current.filter(c => c !== value)
          : [...current, value];
        return { ...prev, categories: newCategories };
      });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const clearFilters = () => {
    setFilters({
      priceRange: 'all',
      discount: 'all',
      rating: 'all',
      categories: [],
      sortBy: filters.sortBy // Keep sort preference
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.priceRange !== 'all') count++;
    if (filters.discount !== 'all') count++;
    if (filters.rating !== 'all') count++;
    count += filters.categories.length;
    return count;
  };

  const getActiveFilterTags = () => {
    const tags = [];
    if (filters.priceRange !== 'all') {
      const priceLabels = {
        '0-500': 'Under ₹500',
        '500-1000': '₹500 - ₹1000',
        '1000-2000': '₹1000 - ₹2000',
        '2000-': 'Over ₹2000'
      };
      tags.push({ key: 'priceRange', label: priceLabels[filters.priceRange] });
    }
    if (filters.discount !== 'all') {
      tags.push({ key: 'discount', label: `${filters.discount}% Off or more` });
    }
    if (filters.rating !== 'all') {
      tags.push({ key: 'rating', label: `${filters.rating}★ & above` });
    }
    if (filters.categories.length > 0) {
      filters.categories.forEach(catId => {
        // Helper function to find category in hierarchical tree
        const findCategory = (cats, id) => {
          for (const cat of cats) {
            if (cat._id === id) return cat;
            if (cat.children && cat.children.length > 0) {
              const found = findCategory(cat.children, id);
              if (found) return found;
            }
          }
          return null;
        };
        const category = findCategory(categories, catId);
        const categoryName = category?.categorytitle || category?.title || 'Unknown';
        tags.push({ key: 'categories', label: categoryName, value: catId });
      });
    }
    return tags;
  };

  const removeFilterTag = (key, value) => {
    if (key === 'categories') {
      setFilters(prev => ({ ...prev, categories: prev.categories.filter(c => c !== value) }));
    } else {
      setFilters(prev => ({ ...prev, [key]: 'all' }));
    }
  };

  const sortOptions = [
    { value: 'discount-high', label: 'Discount: High to Low' },
    { value: 'discount-low', label: 'Discount: Low to High' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Customer Rating' },
    { value: 'newest', label: 'Newest First' }
  ];

  const getAuthorName = (author) => {
    if (!author) return 'Unknown';
    if (typeof author === 'object') {
      return `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Unknown';
    }
    return author;
  };

  const getProductUrl = (product) => {
    const slug = product.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `/books/${product.bagchee_id || product._id}/${slug}`;
  };

  // Filter Section Component
  const FilterSection = ({ title, sectionKey, children }) => (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-cream-100 transition-colors"
      >
        <span className="font-semibold text-sm text-gray-900">{title}</span>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expandedSections[sectionKey] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-3 space-y-1.5">
          {children}
        </div>
      </div>
    </div>
  );

  // Filter Option Component - Minimal & Clean
  const FilterOption = ({ type = 'checkbox', name, value, checked, onChange, label }) => (
    <label className="flex items-center gap-2.5 cursor-pointer group py-1 hover:text-primary transition-colors">
      <div className="relative flex-shrink-0">
        <input
          type={type}
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className={`w-4 h-4 border-2 border-gray-400 ${type === 'radio' ? 'rounded-full' : 'rounded'} peer-checked:border-primary peer-checked:bg-primary peer-checked:ring-2 peer-checked:ring-primary/20 transition-all duration-200 flex items-center justify-center`}>
          {type === 'checkbox' ? (
            checked && <Check className="w-3 h-3 text-white" />
          ) : (
            checked && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          )}
        </div>
      </div>
      <span className={`text-sm ${checked ? 'text-primary font-semibold' : 'text-gray-700 hover:text-primary'} transition-colors select-none`}>
        {label}
      </span>
    </label>
  );

  // Recursive Category Checkbox Component (like ProductListing)
  const CategoryCheckbox = ({ cat, level = 0 }) => {
    const isChecked = filters.categories.includes(cat._id);
    const hasChildren = cat.children && cat.children.length > 0;
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <div className={level > 0 ? 'ml-4 border-l-2 border-gray-200 pl-3' : ''}>
        <div className="flex items-center justify-between py-1">
          <FilterOption
            type="checkbox"
            name="categories"
            value={cat._id}
            checked={isChecked}
            onChange={() => handleFilterChange('categories', cat._id)}
            label={cat.categorytitle || cat.title}
          />
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-cream-100 rounded"
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {cat.children.map(child => (
              <CategoryCheckbox key={child._id} cat={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Desktop Filter Sidebar - Simple & Classic
  const FilterSidebar = () => (
    <div className="bg-cream-100 border border-gray-200 rounded-lg h-fit sticky top-4">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-gray-900">Filters</h3>
          {getActiveFilterCount() > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-primary hover:underline font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Sections */}
      <div>
        {/* Sort Section */}
        <FilterSection title="Sort By" sectionKey="sort">
          {sortOptions.map((option) => (
            <FilterOption
              key={option.value}
              type="checkbox"
              name="sortBy"
              value={option.value}
              checked={filters.sortBy === option.value}
              onChange={() => handleFilterChange('sortBy', option.value)}
              label={option.label}
            />
          ))}
        </FilterSection>

        {/* Category Section */}
        <FilterSection title="Category" sectionKey="category">
          {categories?.length > 0 ? (
            categories.map((cat) => (
              <CategoryCheckbox key={cat._id} cat={cat} />
            ))
          ) : (
            <p className="text-xs text-gray-500 italic">Loading...</p>
          )}
        </FilterSection>

        {/* Hidden sections - Price Range */}
        {/* <FilterSection title="Price Range" sectionKey="price">
          {[
            { label: 'All Prices', value: 'all' },
            { label: 'Under ₹500', value: '0-500' },
            { label: '₹500 - ₹1000', value: '500-1000' },
            { label: '₹1000 - ₹2000', value: '1000-2000' },
            { label: 'Over ₹2000', value: '2000-' }
          ].map(option => (
            <FilterOption
              key={option.value}
              name="priceRange"
              value={option.value}
              checked={filters.priceRange === option.value}
              onChange={(e) => handleFilterChange('priceRange', e.target.value)}
              label={option.label}
            />
          ))}
        </FilterSection> */}

        {/* Hidden sections - Discount */}
        {/* <FilterSection title="Discount" sectionKey="discount">
          {[
            { label: 'All Discounts', value: 'all' },
            { label: '10% or more', value: '10' },
            { label: '25% or more', value: '25' },
            { label: '50% or more', value: '50' },
            { label: '75% or more', value: '75' }
          ].map(option => (
            <FilterOption
              key={option.value}
              name="discount"
              value={option.value}
              checked={filters.discount === option.value}
              onChange={(e) => handleFilterChange('discount', e.target.value)}
              label={option.label}
            />
          ))}
        </FilterSection> */}

        {/* Hidden sections - Customer Rating */}
        {/* <FilterSection title="Customer Rating" sectionKey="rating">
          {[
            { label: 'All Ratings', value: 'all' },
            { label: '4★ & above', value: '4' },
            { label: '3★ & above', value: '3' },
            { label: '2★ & above', value: '2' },
            { label: '1★ & above', value: '1' }
          ].map(option => (
            <FilterOption
              key={option.value}
              name="rating"
              value={option.value}
              checked={filters.rating === option.value}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              label={option.label}
            />
          ))}
        </FilterSection> */}
      </div>
    </div>
  );

  // Mobile Filter Bottom Sheet
  const MobileFilterSheet = () => (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 lg:hidden ${
          showMobileFilters ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setShowMobileFilters(false)}
      />
      
      {/* Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-cream-100 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out z-50 lg:hidden ${
          showMobileFilters ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-cream-200 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-cream-100 z-10">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Filters</h3>
            {getActiveFilterCount() > 0 && (
              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowMobileFilters(false)}
            className="p-2 hover:bg-cream-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {/* Sort Section */}
          <FilterSection title="Sort By" sectionKey="sort">
            {sortOptions.map((option) => (
              <FilterOption
                key={option.value}
                type="checkbox"
                name="sortBy"
                value={option.value}
                checked={filters.sortBy === option.value}
                onChange={() => handleFilterChange('sortBy', option.value)}
                label={option.label}
              />
            ))}
          </FilterSection>

          {/* Category Section */}
          <FilterSection title="Category" sectionKey="category">
            {categories?.length > 0 ? (
              categories.map((cat) => (
                <CategoryCheckbox key={cat._id} cat={cat} />
              ))
            ) : (
              <p className="text-xs text-gray-500 italic">Loading...</p>
            )}
          </FilterSection>

          {/* Hidden sections - Price Range */}
          {/* <FilterSection title="Price Range" sectionKey="price">
            {[
              { label: 'All Prices', value: 'all' },
              { label: 'Under ₹500', value: '0-500' },
              { label: '₹500 - ₹1000', value: '500-1000' },
              { label: '₹1000 - ₹2000', value: '1000-2000' },
              { label: 'Over ₹2000', value: '2000-' }
            ].map(option => (
              <FilterOption
                key={option.value}
                name="priceRange"
                value={option.value}
                checked={filters.priceRange === option.value}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                label={option.label}
              />
            ))}
          </FilterSection> */}

          {/* Hidden sections - Discount */}
          {/* <FilterSection title="Discount" sectionKey="discount">
            {[
              { label: 'All Discounts', value: 'all' },
              { label: '10% or more', value: '10' },
              { label: '25% or more', value: '25' },
              { label: '50% or more', value: '50' },
              { label: '75% or more', value: '75' }
            ].map(option => (
              <FilterOption
                key={option.value}
                name="discount"
                value={option.value}
                checked={filters.discount === option.value}
                onChange={(e) => handleFilterChange('discount', e.target.value)}
                label={option.label}
              />
            ))}
          </FilterSection> */}

          {/* Hidden sections - Customer Rating */}
          {/* <FilterSection title="Customer Rating" sectionKey="rating">
            {[
              { label: 'All Ratings', value: 'all' },
              { label: '4★ & above', value: '4' },
              { label: '3★ & above', value: '3' },
              { label: '2★ & above', value: '2' },
              { label: '1★ & above', value: '1' }
            ].map(option => (
              <FilterOption
                key={option.value}
                name="rating"
                value={option.value}
                checked={filters.rating === option.value}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                label={option.label}
              />
            ))}
          </FilterSection> */}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-200 bg-cream-100 sticky bottom-0">
          <button
            onClick={clearFilters}
            className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-cream-100 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={() => setShowMobileFilters(false)}
            className="flex-1 py-3 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors"
          >
            Show {filteredProducts.length} Products
          </button>
        </div>
      </div>
    </>
  );

  // Custom Category Dropdown
  const CategoryDropdown = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const selectedCategory = categories.find(cat => filters.categories.includes(cat._id));
    
    // Flatten categories for dropdown
    const flattenCategories = (cats, level = 0) => {
      let flat = [];
      cats.forEach(cat => {
        flat.push({ ...cat, level });
        if (cat.children && cat.children.length > 0) {
          flat = flat.concat(flattenCategories(cat.children, level + 1));
        }
      });
      return flat;
    };
    
    const flatCategories = flattenCategories(categories);
    
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-primary transition-all font-medium text-gray-700 min-w-[200px] justify-between text-sm shadow-sm"
        >
          <span className="text-sm truncate">
            {selectedCategory ? (selectedCategory.categorytitle || selectedCategory.title) : 'All Categories'}
          </span>
          <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20 max-h-80 overflow-y-auto">
              <button
                onClick={() => {
                  handleFilterChange('categories', '');
                  setShowDropdown(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                  filters.categories.length === 0
                    ? 'bg-primary text-white font-medium'
                    : 'text-gray-700 hover:bg-cream-50'
                }`}
              >
                <span>All Categories</span>
                {filters.categories.length === 0 && (
                  <Check className="w-4 h-4" />
                )}
              </button>
              {flatCategories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => {
                    handleFilterChange('categories', cat._id);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                    filters.categories.includes(cat._id)
                      ? 'bg-primary text-white font-medium'
                      : 'text-gray-700 hover:bg-cream-50'
                  }`}
                  style={{ paddingLeft: `${16 + cat.level * 16}px` }}
                >
                  <span>{cat.categorytitle || cat.title}</span>
                  {filters.categories.includes(cat._id) && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // Custom Sort Dropdown - Compact
  // const SortDropdown = () => {
  //   const currentSort = sortOptions.find(opt => opt.value === filters.sortBy);
  //   
  //   return (
  //     <div className="relative">
  //       <button
  //         onClick={() => setShowSortDropdown(!showSortDropdown)}
  //         className="flex items-center gap-2 px-3 py-2 bg-cream-100 border-2 border-gray-300 rounded-lg hover:border-primary transition-all font-medium text-gray-700 min-w-[180px] justify-between text-sm"
  //       >
  //         <span className="text-sm truncate">{currentSort?.label}</span>
  //         <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} />
  //       </button>

  //       {/* Dropdown Menu */}
  //       {showSortDropdown && (
  //         <>
  //           <div
  //             className="fixed inset-0 z-10"
  //             onClick={() => setShowSortDropdown(false)}
  //           />
  //           <div className="absolute right-0 mt-1 w-56 bg-cream-100 border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20 animate-fadeIn">
  //             {sortOptions.map((option) => (
  //               <button
  //                 key={option.value}
  //                 onClick={() => {
  //                   handleFilterChange('sortBy', option.value);
  //                   setShowSortDropdown(false);
  //                 }}
  //                 className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between ${
  //                   filters.sortBy === option.value
  //                     ? 'bg-primary text-white font-medium'
  //                     : 'text-gray-700 hover:bg-cream-100'
  //                 }`}
  //               >
  //                 <span>{option.label}</span>
  //                 {filters.sortBy === option.value && (
  //                   <Check className="w-4 h-4" />
  //                 )}
  //               </button>
  //             ))}
  //           </div>
  //         </>
  //       )}
  //     </div>
  //   );
  // };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-text-muted font-medium">Loading amazing deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Breadcrumb - Compact */}
      <div className="bg-cream-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Books on Sale</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Desktop Sidebar - Compact */}
          {/* <aside className="hidden lg:block lg:w-56 flex-shrink-0">
            <FilterSidebar />
          </aside> */}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Header - Compact */}
            <div className="mb-4 text-center">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-1">
                Books on Sale
              </h1>
              <p className="text-sm text-gray-600">
                {products.length} books with up to 75% off
              </p>
            </div>

            {/* Category Dropdown */}
            <div className="flex justify-end mb-4">
              <CategoryDropdown />
            </div>

            {/* Active Filter Tags - Compact */}
            {getActiveFilterCount() > 0 && (
              <div className="bg-cream-100 border border-gray-200 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">Active Filters:</span>
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary hover:text-primary-hover font-medium"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getActiveFilterTags().map((tag) => (
                    <span
                      key={tag.key}
                      className="inline-flex items-center gap-1.5 bg-primary text-white px-2.5 py-1 rounded-full text-xs font-medium"
                    >
                      {tag.label}
                      <button
                        onClick={() => removeFilterTag(tag.key, tag.value)}
                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Results Count - Compact */}
            <div className="mb-3">
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-gray-900">{filteredProducts.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{products.length}</span> products
              </p>
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCardGrid key={product._id} data={product} />
                ))}
              </div>
            ) : (
              <div className="bg-cream-100 border border-gray-200 rounded-lg p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SlidersHorizontal className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your filters to find what you're looking for
                  </p>
                  <button
                    onClick={clearFilters}
                    className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-hover transition-colors font-medium"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {/* <MobileFilterSheet /> */}
    </div>
  );
};

// Helper function to build category tree (like ProductListing)
const buildCategoryTree = (categories) => {
  const map = {};
  const tree = [];
  categories.forEach((c) => (map[c._id] = { ...c, children: [] }));
  categories.forEach((c) => {
    if (c.parentid && map[c.parentid])
      map[c.parentid].children.push(map[c._id]);
    else tree.push(map[c._id]);
  });
  return tree;
};

export default Sale;
