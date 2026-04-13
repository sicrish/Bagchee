import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, Search } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // 🟢 Optimized Engine

const HomeNewNoteworthyForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const isEdit = Boolean(id); 
  const queryClient = useQueryClient();
  const dropdownRef = useRef(null);

  // States
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [debouncedSearch, setDebouncedSearch] = useState(""); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 

  const [formData, setFormData] = useState({
    productId: '', 
    isActive: 'yes',
    order: ''
  });

  // 🟢 1. SMART DEBOUNCING: API Limit bachane ke liye
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500); // 500ms wait karega typing rukne ka
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 🟢 2. CLICK OUTSIDE: Dropdown band karne ke liye
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🚀 OPTIMIZATION 1: Fetch Existing Data (Edit Mode)
  const { data: existingData, isLoading: initialLoading } = useQuery({
    queryKey: ['noteworthyDetails', id],
    queryFn: async () => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/home-new-noteworthy/get/${id}`);
      return res.data.status ? res.data.data : null;
    },
    enabled: isEdit,
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  // 🟢 Data pre-fill logic
  useEffect(() => {
    if (isEdit && existingData && !isDataInitialized) {
      setFormData({
        productId: existingData.productId || '',
        isActive: existingData.isActive ? 'yes' : 'no',
        order: existingData.order || ''
      });
      setSearchQuery(existingData.productId || '');
      setIsDataInitialized(true);
    }
  }, [isEdit, existingData, isDataInitialized]);

  // 🚀 OPTIMIZATION 2: LIVE SEARCH WITH SERVER CACHING
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['productSearch', debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch.length < 3) return [];
      const API_URL = process.env.REACT_APP_API_URL;
      // Note: Backend endpoint matches your search requirement
      const res = await axios.get(`${API_URL}/home-new-noteworthy/search-inventory?q=${debouncedSearch}`);
      return res.data.status ? res.data.data : [];
    },
    enabled: debouncedSearch.length >= 3 && isDropdownOpen, // Sirf dropdown open hone par call hoga
    staleTime: 1000 * 60 * 10, // 10 minute tak same search results server se nahi mangega
  });

  // 🚀 OPTIMIZATION 3: UNIFIED MUTATION FOR SAVE/UPDATE
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const API_URL = process.env.REACT_APP_API_URL;
      const url = isEdit ? `/home-new-noteworthy/update/${id}` : `/home-new-noteworthy/save`;
      // Backend mapping update: many backends prefer PUT or PATCH for update
      const method = isEdit ? 'put' : 'post';
      const res = await axios[method](`${API_URL}${url}`, payload);
      return res.data;
    }
  });

  // Select Product
  const handleSelectProduct = (product) => {
    setFormData({ ...formData, productId: product.bagchee_id });
    setSearchQuery(`${product.bagchee_id} - ${product.title}`); 
    setIsDropdownOpen(false); 
  };

  const handleSubmit = (e, actionType) => {
    e.preventDefault();
    if (!formData.productId) return toast.error("Product ID is required!");
    if (!formData.order) return toast.error("Order is required!");

    const toastId = toast.loading(isEdit ? "Updating..." : "Saving...");
    const payload = { ...formData, isActive: formData.isActive === 'yes' };

    saveMutation.mutate(payload, {
      onSuccess: (res) => {
        if (res.status) {
          toast.success(isEdit ? "Updated successfully! ✨" : "Added successfully! 📦", { id: toastId });
          queryClient.invalidateQueries(['noteworthyDetails']);
          
          if (actionType === 'back') {
            navigate('/admin/new-and-noteworthy');
          } else if (!isEdit) {
            setFormData({ productId: '', isActive: 'yes', order: '' });
            setSearchQuery(""); 
          }
        } else {
          toast.error(res.msg || "Operation failed", { id: toastId });
        }
      },
      onError: (err) => {
        toast.error(err.response?.data?.msg || "Operation failed", { id: toastId });
      }
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputClass = `w-full border border-[#e6decd] rounded-[4px] px-3.5 py-2 text-[13px] outline-none transition-all duration-200 ease-in-out bg-[#fffdf5] focus:bg-white focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,141,218,0.15)] font-body`;

  if (isEdit && (initialLoading || !isDataInitialized)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 text-primary">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          {isEdit ? "Edit New & Noteworthy Product" : "Add New & Noteworthy Product"}
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden" onSubmit={(e) => e.preventDefault()}>
          
          <div className="bg-cream-100 px-6 py-3 border-b border-cream-200 flex justify-between items-center">
             <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">
                Product Information
             </h2>
          </div>

          <div className="p-8 space-y-6">
            
            {/* Search Field */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4 relative z-50">
              <label className="col-span-12 md:col-span-3 md:text-right text-left text-[11px] font-bold text-text-muted uppercase font-montserrat">
                Product Id / Title / ISBN
              </label>
              <div className="col-span-12 md:col-span-9 relative" ref={dropdownRef}>
                <div className="relative">
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
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

                {isDropdownOpen && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 max-h-60 overflow-y-auto z-50">
                        {searchResults.map((prod) => (
                            <div 
                                key={prod._id} 
                                onClick={() => handleSelectProduct(prod)}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 flex flex-col justify-center"
                            >
                                <p className="text-xs font-bold text-gray-800 line-clamp-1">{prod.title}</p>
                                <div className="text-[10px] text-gray-500 flex flex-wrap gap-x-2">
                                    <span>ID: <strong className="text-primary">{prod.bagchee_id}</strong></span>
                                    {prod.isbn13 && <span>| ISBN-13: {prod.isbn13}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isDropdownOpen && searchQuery.length > 2 && !isSearching && searchResults.length === 0 && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 p-3 text-xs text-gray-500 text-center z-50">
                        No products found matching "{searchQuery}"
                    </div>
                )}
              </div>
            </div>

            {/* Status Dropdown */}
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
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            {/* Order Field */}
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

            {/* Buttons */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-8 border-t mt-4 font-montserrat">
              <button 
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={saveMutation.isPending} 
                className="w-full md:w-auto bg-primary text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {saveMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} 
                {isEdit ? "Update" : "Save"}
              </button>
              
              <button 
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={saveMutation.isPending} 
                className="w-full md:w-auto bg-text-main text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <RotateCcw size={14}/> 
                {isEdit ? "Update & Go Back" : "Save & Go Back"}
              </button>

              <button 
                type="button" 
                onClick={() => navigate('/admin/new-and-noteworthy')} 
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

export default HomeNewNoteworthyForm;