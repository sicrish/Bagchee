import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2,Search } from 'lucide-react';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const AddReviews = () => {
  const navigate = useNavigate();
  const editor = useRef(null);
  const [loading, setLoading] = useState(false);

  // Dropdown Data States
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]); // 🟢 Products list ke liye state

  // Search States (Add inside component)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState({
    category_id: '',
    item_id: '', // Ab ye dropdown se fill hoga
    email: '',
    name: '',
    title: '',
    rating: '',
    status: 'inactive', // Default based on image radio button selection
  });

  const [reviewContent, setReviewContent] = useState('');

  // 1. Fetch Categories AND Products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;

        // 🟢 Parallel Fetching: Categories aur Products dono ek sath mangwa rahe hain
        const [catRes, prodRes] = await Promise.all([
          axios.get(`${API_URL}/category/fetch`),
          axios.get(`${API_URL}/product/fetch`) // Adjust endpoint if needed
        ]);

        if (catRes.data.status) setCategories(catRes.data.data);
        if (prodRes.data.status) setProducts(prodRes.data.data);

      } catch (error) {
        console.error("Data fetch error", error);
        toast.error("Failed to load dropdown data");
      }
    };
    fetchData();
  }, []);



  // 🟢 2. SEARCH HANDLER (Debounced Search)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2 && isDropdownOpen) {
        setIsSearching(true);
        try {
          const API_URL = process.env.REACT_APP_API_URL;
          // HomeSale wala inventory search endpoint use kar rahe hain
          const res = await axios.get(`${API_URL}/home-sale-products/search-inventory?q=${searchQuery}`);
          if (res.data.status) {
            setSearchResults(res.data.data);
          }
        } catch (error) {
          console.error("Search Error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isDropdownOpen]);

  // 🟢 3. SELECT PRODUCT HANDLER
  const handleSelectProduct = (product) => {
    setFormData({ ...formData, item_id: product._id }); // Backend ke liye ID
    setSearchQuery(`${product.bagchee_id} - ${product.title}`); // UI ke liye text
    setIsDropdownOpen(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.item_id) return toast.error("Please select a Product (Item)!"); // Updated Validation
    if (!formData.name) return toast.error("Name is required!");

    setLoading(true);
    const toastId = toast.loading("Saving review...");

    try {
      const payload = { ...formData, review: reviewContent };

      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/reviews/save`, payload);

      if (res.data.status) {
        toast.success("Review added successfully! ⭐", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/reviews');
        } else {
          // Reset form
          setFormData({
            category_id: '', item_id: '', email: '', name: '',
            title: '', rating: '', status: 'inactive'
          });
          setReviewContent('');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to save", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Jodit Config
  const config = useMemo(() => ({
    readonly: false,
    height: 300,
    theme: "default",
    placeholder: '',
    toolbar: true,
    buttons: [
      'source', '|', 'save', 'print', 'preview', '|', 'cut', 'copy', 'paste', '|',
      'bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', '|',
      'ul', 'ol', '|', 'outdent', 'indent', '|', 'font', 'fontsize', 'brush', '|',
      'image', 'table', 'link', '|', 'align', 'undo', 'redo', '|', 'hr', 'eraser', 'fullsize'
    ],
  }), []);

  // Reusable Classes
  const inputClass = "w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20 font-body";
  const labelClass = "col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">

      {/* 🔵 Header Bar */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Add Reviews
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">

          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200">
            <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">
              Review Information
            </h2>
          </div>

          <div className="p-8 space-y-6">

            {/* Category ID Dropdown */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Category</label>
              <div className="col-span-9">
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className={`${inputClass} w-1/3 text-gray-600`}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.categorytitle}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 🟢 ITEM ID (Dropdown - Select Product) */}
            <div className="grid grid-cols-12 gap-4 items-center relative z-50">
              <label className={labelClass}>Product (Item)*</label>
              <div className="col-span-9 relative" onClick={(e) => e.stopPropagation()}>
                <div className="relative">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                      setFormData(prev => ({...prev, item_id: ''})); 
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className={`${inputClass} pr-10`} 
                    placeholder="Search by Title, ID or ISBN..." 
                    autoComplete="off"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {isSearching ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}
                  </div>
                </div>

                {/* Suggestions List */}
                {isDropdownOpen && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 max-h-60 overflow-y-auto z-[100]">
                    {searchResults.map((prod) => (
                      <div key={prod._id} onClick={() => handleSelectProduct(prod)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 flex flex-col">
                        <p className="text-xs font-bold text-gray-800">{prod.title}</p>
                        <div className="text-[10px] text-gray-500 flex gap-x-2">
                            <span>ID: <strong className="text-primary">{prod.bagchee_id}</strong></span>
                            {prod.isbn13 && <span>| ISBN: {prod.isbn13}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {isDropdownOpen && searchQuery.length > 2 && !isSearching && searchResults.length === 0 && (
                   <div className="absolute top-full left-0 w-full bg-white border p-3 text-xs text-gray-500 text-center shadow-lg">No products found</div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Email</label>
              <div className="col-span-9">
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="Reviewer email" />
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Name</label>
              <div className="col-span-9">
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder="Reviewer Name" />
              </div>
            </div>

            {/* Title */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}> Title</label>
              <div className="col-span-9">
                <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="e.g. Great Book!" />
              </div>
            </div>

            {/* Review (Jodit Editor) */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className={labelClass}>Review</label>
              <div className="col-span-9 border border-gray-300 rounded overflow-hidden shadow-sm">
                <JoditEditor
                  ref={editor}
                  value={reviewContent}
                  config={config}
                  onBlur={newContent => setReviewContent(newContent)}
                />
              </div>
            </div>

            {/* Rating */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Rating</label>
              <div className="col-span-9">
                <select
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                  className={`${inputClass} w-1/4 text-gray-600`}
                >
                  <option value="">Select Rating</option>
                  <option value="5">5 ★★★★★ (Excellent)</option>
                  <option value="4">4 ★★★★☆ (Good)</option>
                  <option value="3">3 ★★★☆☆ (Average)</option>
                  <option value="2">2 ★★☆☆☆ (Poor)</option>
                  <option value="1">1 ★☆☆☆☆ (Terrible)</option>
                </select>
              </div>
            </div>

            {/* Active (Radio Buttons) */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className={labelClass}>Active</label>
              <div className="col-span-9 pt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="active"
                    name="status"
                    value="active"
                    checked={formData.status === 'active'}
                    onChange={handleChange}
                    className="accent-primary"
                  />
                  <label htmlFor="active" className="text-sm cursor-pointer">active</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="inactive"
                    name="status"
                    value="inactive"
                    checked={formData.status === 'inactive'}
                    onChange={handleChange}
                    className="accent-primary"
                  />
                  <label htmlFor="inactive" className="text-sm cursor-pointer">inactive</label>
                </div>
              </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="flex justify-center items-center gap-3 pt-8 border-t mt-10 font-montserrat">

              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'stay')}
                disabled={loading}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} className="text-green-600" />}
                <span className="font-bold">Save</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'back')}
                disabled={loading}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                <RotateCcw size={16} className="text-primary" />
                <span className="font-bold">Save and go back to list</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/reviews')}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                <X size={16} className="text-red-600" />
                <span className="font-bold">Cancel</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReviews;