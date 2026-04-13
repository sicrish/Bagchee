'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, LayoutGrid, Search as SearchIcon } from 'lucide-react';
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // 🟢 React Query added

const AddHomeSectionProduct = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(""); // 🟢 For Debouncing
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    home_section_id: '', 
    productId: '', 
    title: '',    
    active: 'Yes',
    order: '0'
  });

  // 🟢 1. DEBOUNCE LOGIC: Typing ke 500ms baad hi request trigger hogi
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 🟢 2. CLICK OUTSIDE: Dropdown band karne ke liye
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🚀 OPTIMIZATION 1: Fetch Sections List (Cached)
  const { data: sectionsList = [], isLoading: fetchingSections } = useQuery({
    queryKey: ['homeSectionsList'],
    queryFn: async () => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/home-sections/list`);
      return res.data.status ? res.data.data : [];
    },
    staleTime: 1000 * 60 * 10, // 10 Min cache
  });

  // 🚀 OPTIMIZATION 2: SERVER-SIDE LIVE SEARCH
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['productLiveSearch', debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch.trim().length < 2) return [];
      const API_URL = process.env.REACT_APP_API_URL;
      // Fetching only 15 matches from server for speed
      const res = await axios.get(`${API_URL}/product/fetch?keyword=${debouncedSearch}&limit=15`);
      return res.data.status ? res.data.data : [];
    },
    enabled: debouncedSearch.trim().length >= 2 && showDropdown, // API tabhi chalegi jab input active ho
    staleTime: 1000 * 60 * 5, // Cache pichle search results for 5 mins
  });

  const handleSelectProduct = (product) => {
    setSearchTerm(product.title);
    setFormData(prev => ({ 
        ...prev, 
        productId:product._id, 
        title: product.title 
    }));
    setShowDropdown(false);
  };

  // 🚀 OPTIMIZATION 3: Save Mutation
  const saveProductMutation = useMutation({
    mutationFn: async (finalData) => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/home-sections/products/save`, finalData);
      return res.data;
    }
  });

  // 🔵 Submit Logic
  const handleSubmit = (e, actionType) => {
    e.preventDefault();

    if (!formData.home_section_id) return toast.error("Please select a Target Section!");
    if (!formData.productId) return toast.error("Please search and select a valid product!");

    const toastId = toast.loading("Saving configuration...");

    saveProductMutation.mutate(formData, {
      onSuccess: (resData) => {
        if (resData.status) {
          toast.success("Saved successfully! 📦", { id: toastId });
          if (actionType === 'back') {
            navigate('/admin/home-section-1'); 
          } else {
            setSearchTerm("");
            setFormData(prev => ({ 
              ...prev, 
              productId: '', 
              title: '', 
              order: (Number(prev.order) + 1).toString() 
            }));
          }
        } else {
          toast.error(resData.msg || "Server Error", { id: toastId });
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.msg || "Server Error", { id: toastId });
      }
    });
  };

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[14px] outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white font-body shadow-inner";
  const labelClass = "col-span-12 md:col-span-3 md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat tracking-tight pt-3";

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-20">
      
      <div className="bg-primary px-6 py-4 shadow-lg flex items-center justify-between text-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
            <LayoutGrid size={22} />
            <h1 className="text-lg font-bold uppercase tracking-wider font-display text-white">Add Home Section Product</h1>
        </div>
        <button onClick={() => navigate('/admin/home-section-1')}><X size={24}/></button>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 mt-6">
        <form onSubmit={(e) => e.preventDefault()} className="bg-white rounded-2xl border border-cream-200 shadow-xl overflow-hidden animate-fadeIn">
          
          <div className="bg-cream-100/50 px-8 py-4 border-b border-cream-200 flex items-center gap-2">
             <div className="w-1.5 h-4 bg-primary rounded-full"></div>
             <h2 className="text-[10px] font-bold uppercase tracking-widest font-montserrat text-text-muted">Section Product Settings</h2>
          </div>

          <div className="p-8 md:p-12 space-y-10">
            
            {/* Dynamic Section Dropdown */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Target Section*</label>
              <div className="col-span-12 md:col-span-6">
                <select 
                    value={formData.home_section_id} 
                    onChange={(e) => setFormData({...formData, home_section_id: e.target.value})}
                    className={`${inputClass} font-bold text-primary`}
                    disabled={fetchingSections}
                    required
                >
                    <option value="">{fetchingSections ? "Loading Sections..." : "-- Select a Section --"}</option>
                    {sectionsList.map((sec) => (
                        <option key={sec._id} value={sec._id}>
                            {sec.sectionTitle || sec.title} {sec.section ? `(${sec.section})` : ''}
                        </option>
                    ))}
                </select>
                <p className="text-[9px] text-gray-400 mt-2 italic">Select the section you want to add this product to.</p>
              </div>
            </div>

            {/* Smart Live Search Field */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className={labelClass}>Product Search*</label>
              <div className="col-span-12 md:col-span-9 relative" ref={dropdownRef}>
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchTerm} 
                    autoComplete="off"
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className={inputClass}
                    placeholder="Search by book name or numeric SKU..." 
                  />
                  {isSearching ? <Loader2 size={18} className="absolute right-3 top-3 text-gray-400 animate-spin" /> : <SearchIcon size={18} className="absolute right-3 top-3 text-gray-400" />}
                </div>

                {showDropdown && searchTerm.length >= 2 && (
                  <ul className="absolute z-50 w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-gray-50">
                    {isSearching ? (
                        <li className="px-4 py-4 text-sm text-gray-400 italic text-center flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin" /> Searching database...
                        </li>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((p) => (
                        <li 
                          key={p._id} 
                          onClick={() => handleSelectProduct(p)}
                          className="px-4 py-3 hover:bg-primary/5 cursor-pointer transition-colors group flex justify-between items-center"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-700 group-hover:text-primary">{p.title}</span>
                            <span className="text-[10px] text-gray-400">{p.author?.first_name} {p.author?.last_name}</span>
                          </div>
                          <span className="text-[10px] font-mono bg-gray-100 px-2 py-1 rounded text-gray-500 shrink-0">ID: {p.bagchee_id || p.productId}</span>
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-4 text-sm text-gray-400 italic text-center">No matches found</li>
                    )}
                  </ul>
                )}

                {formData.productId && !showDropdown && (
                  <p className="text-[10px] text-green-600 font-bold mt-2 ml-1 uppercase flex items-center gap-1">
                    <Check size={12}/> Product Selected: {formData.productId}
                  </p>
                )}
              </div>
            </div>

            {/* Active & Order Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Live Status</label>
                    <select value={formData.active} onChange={(e) => setFormData({...formData, active: e.target.value})} className={inputClass}>
                        <option value="Yes">Yes (Enabled)</option>
                        <option value="No">No (Disabled)</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Order Index</label>
                    <input type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: e.target.value})} className={inputClass} />
                </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-10 border-t mt-12 font-montserrat">
              <button 
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={saveProductMutation.isPending || isSearching} 
                className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-10 py-3 rounded-xl font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-60"
              >
                {saveProductMutation.isPending ? <Loader2 size={16} className="animate-spin"/> : <Check size={18} className="text-green-600"/>} 
                Save Item
              </button>
              
              <button 
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={saveProductMutation.isPending || isSearching} 
                className="w-full sm:w-auto bg-primary text-white hover:brightness-110 px-10 py-3 rounded-xl font-bold text-[11px] uppercase flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60"
              >
                {saveProductMutation.isPending ? <Loader2 size={16} className="animate-spin"/> : <RotateCcw size={18}/>} 
                Commit & Return
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHomeSectionProduct; 