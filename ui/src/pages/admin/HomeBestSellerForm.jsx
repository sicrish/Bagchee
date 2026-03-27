import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, Search } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const HomeBestSellerForm = () => {
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

  const [formData, setFormData] = useState({
    productId: '', 
    isActive: 'yes',
    order: ''
  });

  // --- 1. FETCH DATA (EDIT MODE) ---
  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const API_URL = process.env.REACT_APP_API_URL;
          // 🟢 Changed Endpoint
          const res = await axios.get(`${API_URL}/home-best-seller/get/${id}`);
          if (res.data.status) {
            const data = res.data.data;
            setFormData({
              productId: data.productId || '',
              isActive: data.isActive ? 'yes' : 'no',
              order: data.order || ''
            });
            // Search box me ID dikhane ke liye
            setSearchQuery(data.productId || '');
          }
        } catch (error) {
          console.error("Fetch Error:", error);
          toast.error("Failed to load details");
          navigate('/admin/home-best-seller');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchData();
    }
  }, [id, isEdit, navigate]);

  // --- 2. SEARCH HANDLER ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2 && isDropdownOpen) { 
        setIsSearching(true);
        try {
          const API_URL = process.env.REACT_APP_API_URL;
          
          // ⚠️ Make sure this route exists in your backend router
          // Usually we use the same search controller logic for all sections
          // Agar alag route nahi banaya hai to '/product/search' use kar sakte hain
          // Filhal pattern maintain karte hue:
          const res = await axios.get(`${API_URL}/home-best-seller/search-inventory?q=${searchQuery}`);
          
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

  // --- 3. SELECT PRODUCT ---
  const handleSelectProduct = (product) => {
    setFormData({ ...formData, productId: product.bagcheeId });
    setSearchQuery(`${product.bagcheeId} - ${product.title}`); 
    setIsDropdownOpen(false); 
  };

  // --- 4. SUBMIT HANDLER ---
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.productId) return toast.error("Product ID is required!");
    if (!formData.order) return toast.error("Order is required!");

    setLoading(true);
    const toastId = toast.loading(isEdit ? "Updating..." : "Saving...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const payload = {
        ...formData,
        isActive: formData.isActive === 'yes'
      };

      let res;
      if (isEdit) {
        // 🟢 Changed Endpoint
        res = await axios.patch(`${API_URL}/home-best-seller/update/${id}`, payload);
      } else {
        // 🟢 Changed Endpoint
        res = await axios.post(`${API_URL}/home-best-seller/save`, payload);
      }

      if (res.data.status) {
        toast.success(isEdit ? "Updated successfully!" : "Added successfully!", { id: toastId });
        
        if (actionType === 'back') {
          navigate('/admin/home-best-seller');
        } else if (!isEdit) {
          // Reset form for next entry
          setFormData({ productId: '', isActive: 'yes', order: '' });
          setSearchQuery(""); 
        }
      }
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error(error.response?.data?.msg || "Operation failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputClass = `w-full border border-[#e6decd] rounded-[4px] px-3.5 py-2 text-[13px] outline-none transition-all duration-200 ease-in-out bg-[#fffdf5] focus:bg-white focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,141,218,0.15)] font-body`;

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 text-primary">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Bar */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          {isEdit ? "Edit Best Seller Product" : "Add Best Seller Product"}
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden" onClick={() => setIsDropdownOpen(false)}>
          
          <div className="bg-cream-100 px-6 py-3 border-b border-cream-200 flex justify-between items-center">
             <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">
               Product Information
             </h2>
          </div>

          <div className="p-8 space-y-6">
            
            {/* 🟢 Field: Product Id (Searchable) */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4 relative z-50">
              <label className="col-span-12 md:col-span-3 md:text-right text-left text-[11px] font-bold text-text-muted uppercase font-montserrat">
                Product Id / Title / ISBN
              </label>
              <div className="col-span-12 md:col-span-9 relative" onClick={(e) => e.stopPropagation()}>
                
                {/* Search Input */}
                <div className="relative">
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                          if(isEdit) setFormData(prev => ({...prev, productId: ''})); 
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className={`${inputClass} pr-10`} 
                      placeholder="Enter Product ID, Title, ISBN-10 or ISBN-13..." 
                      autoComplete="off"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {isSearching ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}
                    </div>
                </div>

                {/* Dropdown Suggestions */}
                {isDropdownOpen && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 max-h-60 overflow-y-auto z-50">
                        {searchResults.map((prod) => (
                            <div 
                                key={prod.id} 
                                onClick={() => handleSelectProduct(prod)}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 flex flex-col justify-center"
                            >
                                <p className="text-xs font-bold text-gray-800 line-clamp-1">{prod.title}</p>
                                
                                <div className="text-[10px] text-gray-500 flex flex-wrap gap-x-2">
                                    <span>ID: <strong className="text-primary">{prod.bagcheeId}</strong></span>
                                    {prod.isbn13 && <span>| ISBN-13: {prod.isbn13}</span>}
                                    {prod.isbn10 && <span>| ISBN-10: {prod.isbn10}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* No Results Message */}
                {isDropdownOpen && searchQuery.length > 2 && !isSearching && searchResults.length === 0 && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 p-3 text-xs text-gray-500 text-center z-50">
                        No products found matching "{searchQuery}"
                    </div>
                )}
              </div>
            </div>

            {/* Field: Active */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-12 md:col-span-3 md:text-right text-left text-[11px] font-bold text-text-muted uppercase font-montserrat">
                Active
              </label>
              <div className="col-span-12 md:col-span-9">
                <select 
                  name="isActive" 
                  value={formData.isActive} 
                  onChange={handleChange} 
                  className={`${inputClass} appearance-none cursor-pointer`}
                >
                  <option value="" disabled>Select Active</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            {/* Field: Order */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-12 md:col-span-3 md:text-right text-left text-[11px] font-bold text-text-muted uppercase font-montserrat">
                Order
              </label>
              <div className="col-span-12 md:col-span-9">
                <input 
                  type="number"
                  name="order" 
                  value={formData.order} 
                  onChange={handleChange} 
                  className={inputClass} 
                  placeholder="Enter display order (e.g. 1)" 
                />
              </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-8 border-t mt-4 font-montserrat">
              
              <button 
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={loading} 
                className="w-full md:w-auto bg-primary text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} 
                {isEdit ? "Update" : "Save"}
              </button>
              
              <button 
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={loading} 
                className="w-full md:w-auto bg-text-main text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={14}/> 
                {isEdit ? "Update & Go Back" : "Save & Go Back"}
              </button>

              <button 
                type="button" 
                // 🟢 Changed Navigation Back
                onClick={() => navigate('/admin/home-best-seller')} 
                className="w-full md:w-auto bg-white border border-cream-200 text-text-main px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-sm hover:bg-cream-50 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <X size={14} className="text-red-600" /> Cancel
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default HomeBestSellerForm;