import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, Search, Trash2, Calendar } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const BooksOfMonthForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const isEdit = Boolean(id); 

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  // Search States
  const [searchQuery, setSearchQuery] = useState(""); 
  const [searchResults, setSearchResults] = useState([]); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  const [isSearching, setIsSearching] = useState(false); 

  // Form State (As per your new Model & Controller)
  const [formData, setFormData] = useState({
    monthName: '', 
    headline: '',
    products: [], // Array of IDs
    expiryDate: '',
    isActive: 'yes'
  });

  // Selected Products Data (For displaying the list in UI)
  const [selectedProductsData, setSelectedProductsData] = useState([]);

  // --- 1. FETCH DATA (EDIT MODE) ---
  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const API_URL = process.env.REACT_APP_API_URL;
          // Controller Endpoint: getAllBooksOfMonthHistory se data aayega par hum specific fetch karenge
          const res = await axios.get(`${API_URL}/books-of-the-month/history`); 
          if (res.data.status) {
            const current = res.data.data.find(item => item._id === id);
            if(current) {
              setFormData({
                monthName: current.monthName || '',
                headline: current.headline || '',
                products: current.products.map(p => p._id),
                expiryDate: current.expiryDate ? new Date(current.expiryDate).toISOString().split('T')[0] : '',
                isActive: current.isActive ? 'yes' : 'no'
              });
              setSelectedProductsData(current.products); // populated products
            }
          }
        } catch (error) {
          toast.error("Failed to load details");
          navigate('/admin/books-of-the-month');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchData();
    }
  }, [id, isEdit, navigate]);

  // --- 2. SEARCH HANDLER (Inventory Search) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2 && isDropdownOpen) { 
        setIsSearching(true);
        try {
          const API_URL = process.env.REACT_APP_API_URL;
          // Reusing your existing search endpoint
          const res = await axios.get(`${API_URL}/home-new-noteworthy/search-inventory?q=${searchQuery}`);
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

  // --- 3. MULTI-SELECT HANDLERS ---
  const handleAddProduct = (product) => {
    if (formData.products.includes(product._id)) {
      return toast.error("Product already added!");
    }
    setFormData(prev => ({ ...prev, products: [...prev.products, product._id] }));
    setSelectedProductsData(prev => [...prev, product]);
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleRemoveProduct = (productId) => {
    setFormData(prev => ({ ...prev, products: prev.products.filter(id => id !== productId) }));
    setSelectedProductsData(prev => prev.filter(p => p._id !== productId));
  };

  // --- 4. SUBMIT HANDLER ---
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.monthName) return toast.error("Month Name is required!");
    if (formData.products.length === 0) return toast.error("Select at least one book!");
    if (!formData.expiryDate) return toast.error("Expiry Date is required!");

    setLoading(true);
    const toastId = toast.loading(isEdit ? "Updating..." : "Saving...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const payload = {
        id: isEdit ? id : null,
        ...formData,
        isActive: formData.isActive === 'yes'
      };

      // Controller Endpoint: saveBooksOfMonth
      const res = await axios.post(`${API_URL}/books-of-the-month/save`, payload);

      if (res.data.status) {
        toast.success(res.data.msg, { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/books-of-the-month');
        } else if (!isEdit) {
          setFormData({ monthName: '', headline: '', products: [], expiryDate: '', isActive: 'yes' });
          setSelectedProductsData([]);
          setSearchQuery(""); 
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Operation failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full border border-[#e6decd] rounded-[4px] px-3.5 py-2 text-[13px] outline-none transition-all duration-200 ease-in-out bg-[#fffdf5] focus:bg-white focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,141,218,0.15)] font-body`;

  if (initialLoading) return <div className="min-h-screen flex items-center justify-center bg-cream-50 text-primary"><Loader2 className="animate-spin" size={32} /></div>;

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          {isEdit ? "Edit Books of the Month" : "Add Books of the Month"}
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden" onClick={() => setIsDropdownOpen(false)}>
          <div className="bg-cream-100 px-6 py-3 border-b border-cream-200 flex justify-between items-center">
             <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">Selection Configuration</h2>
          </div>

          <div className="p-8 space-y-6">
            {/* Month Name */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-12 md:col-span-3 md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Month Name (Display)</label>
              <div className="col-span-12 md:col-span-9">
                <input type="text" name="monthName" value={formData.monthName} onChange={(e) => setFormData({...formData, monthName: e.target.value})} className={inputClass} placeholder="e.g. February 2026" />
              </div>
            </div>

            {/* Headline */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-12 md:col-span-3 md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Short Headline</label>
              <div className="col-span-12 md:col-span-9">
                <input type="text" name="headline" value={formData.headline} onChange={(e) => setFormData({...formData, headline: e.target.value})} className={inputClass} placeholder="e.g. Handpicked stories you'll love" />
              </div>
            </div>

            {/* Multi-Book Search */}
            <div className="grid grid-cols-12 gap-4 items-start border-b border-cream-50 pb-4 relative z-50">
              <label className="col-span-12 md:col-span-3 md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat mt-2">Search & Add Books</label>
              <div className="col-span-12 md:col-span-9 relative" onClick={(e) => e.stopPropagation()}>
                <div className="relative">
                    <input 
                      type="text" value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                      className={`${inputClass} pr-10`} placeholder="Search by Title, ID or ISBN..." autoComplete="off"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {isSearching ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}
                    </div>
                </div>

                {isDropdownOpen && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 max-h-60 overflow-y-auto z-50">
                        {searchResults.map((prod) => (
                            <div key={prod._id} onClick={() => handleAddProduct(prod)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold text-gray-800">{prod.title}</p>
                                    <p className="text-[10px] text-primary">ID: {prod.bagchee_id}</p>
                                </div>
                                <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">ADD</span>
                            </div>
                        ))}
                    </div>
                )}
              </div>
            </div>

            {/* Selected Books Preview */}
            <div className="grid grid-cols-12 gap-4 items-start border-b border-cream-50 pb-4">
              <label className="col-span-12 md:col-span-3 md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat mt-2">Selected Books ({formData.products.length})</label>
              <div className="col-span-12 md:col-span-9">
                {selectedProductsData.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedProductsData.map((book) => (
                            <div key={book._id} className="flex items-center justify-between p-2 bg-cream-50 border border-cream-200 rounded">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-10 bg-gray-200 rounded overflow-hidden">
                                        <img src={`${process.env.REACT_APP_API_URL}${book.default_image}`} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-xs font-bold text-text-main line-clamp-1 truncate w-40">{book.title}</p>
                                </div>
                                <button type="button" onClick={() => handleRemoveProduct(book._id)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-xs text-text-muted italic bg-cream-50/50 p-3 rounded border border-dashed border-cream-200">No books selected yet. Search above to add.</div>
                )}
              </div>
            </div>

            {/* Expiry Date */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-12 md:col-span-3 md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat flex items-center md:justify-end gap-2">
                <Calendar size={12}/> Auto-Expire Date
              </label>
              <div className="col-span-12 md:col-span-9">
                <input type="date" name="expiryDate" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} className={inputClass} />
                <p className="text-[10px] text-text-muted mt-1 italic">* This selection will automatically hide from the website after this date.</p>
              </div>
            </div>

            {/* Active Status */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-12 md:col-span-3 md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Set as Active</label>
              <div className="col-span-12 md:col-span-9">
                <select name="isActive" value={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.value})} className={inputClass}>
                  <option value="yes">Yes (Live on Website)</option>
                  <option value="no">No (Hidden/Draft)</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-8 border-t mt-4 font-montserrat">
              <button onClick={(e) => handleSubmit(e, 'stay')} disabled={loading} className="w-full md:w-auto bg-primary text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md flex items-center justify-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} {isEdit ? "Update" : "Save Selection"}
              </button>
              <button onClick={(e) => handleSubmit(e, 'back')} disabled={loading} className="w-full md:w-auto bg-text-main text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md flex items-center justify-center gap-2">
                <RotateCcw size={14}/> {isEdit ? "Update & Go Back" : "Save & Go Back"}
              </button>
              <button type="button" onClick={() => navigate('/admin/books-of-the-month')} className="w-full md:w-auto bg-white border border-cream-200 text-text-main px-8 py-2.5 rounded font-bold text-[10px] uppercase flex items-center justify-center gap-2">
                <X size={14} className="text-red-600" /> Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BooksOfMonthForm;