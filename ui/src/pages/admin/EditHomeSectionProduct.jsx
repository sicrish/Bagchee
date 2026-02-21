'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, LayoutGrid, Search as SearchIcon, Tag } from 'lucide-react';
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';

const EditHomeSectionProduct = () => {
  const { id } = useParams(); // URL ID for fetching existing record
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // Loading state for auto-fill
  const [sections, setSections] = useState([]); 
  const [products, setProducts] = useState([]); 
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    home_section_id: '',
    productId: '',
    title: '',
    active: 'Yes',
    order: '0'
  });

  // 🟢 1. Auto-fill Logic: Fetch Existing Data & Dropdowns
  useEffect(() => {
    const initData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const [sectionRes, productRes, editRes] = await Promise.all([
          axios.get(`${API_URL}/home-sections/list`),
          axios.get(`${API_URL}/product/fetch?limit=5000`),
          axios.get(`${API_URL}/home-sections/products/get/${id}`) // Fetch this specific record
        ]);

        if (sectionRes.data.status) setSections(sectionRes.data.data);
        if (productRes.data.status) setProducts(productRes.data.data);
        
        if (editRes.data.status) {
          const item = editRes.data.data;
          setFormData({
            home_section_id: item.home_section_id,
            productId: item.productId,
            title: item.title,
            active: item.active,
            order: item.order
          });
          setSearchTerm(item.title); // Set the search box text to the book title
        }
      } catch (error) {
        toast.error("Failed to retrieve record data");
      } finally {
        setFetching(false);
      }
    };
    initData();
  }, [id]);

  // 🟢 2. Filtering Search Logic
  const filteredProducts = products.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.productId?.toString().includes(searchTerm)
  ).slice(0, 10);

  const handleSelectProduct = (product) => {
    setFormData(prev => ({ ...prev, productId: product.productId, title: product.title }));
    setSearchTerm(product.title);
    setShowDropdown(false);
  };

  // 🔵 3. Update Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Updating record...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.patch(`${API_URL}/home-sections/products/update/${id}`, formData);
      if (res.data.status) {
        toast.success("Updated successfully! ✨", { id: toastId });
        navigate('/admin/home-section-1');
      }
    } catch (error) {
      toast.error("Update failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[14px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white font-body shadow-inner transition-all";
  const labelClass = "col-span-12 md:col-span-3 md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat tracking-tight pt-3";

  if (fetching) {
    return <div className="h-screen flex items-center justify-center bg-cream-50"><Loader2 className="animate-spin text-primary" size={40}/></div>;
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-20">
      <div className="bg-primary px-6 py-4 shadow-lg flex items-center justify-between text-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
            <LayoutGrid size={22} />
            <h1 className="text-lg font-bold uppercase tracking-wider font-display text-white">Edit Linked Product</h1>
        </div>
        <button onClick={() => navigate('/admin/home-section-1')}><X size={24}/></button>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 mt-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-cream-200 shadow-xl overflow-hidden animate-fadeIn">
          <div className="bg-cream-100/50 px-8 py-4 border-b border-cream-200 flex items-center gap-2">
             <div className="w-1.5 h-4 bg-primary rounded-full"></div>
             <h2 className="text-[10px] font-bold uppercase tracking-widest font-montserrat text-text-muted">Modify Connection Settings</h2>
          </div>

          <div className="p-8 md:p-12 space-y-10">
            {/* Target Section */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Section Assignment*</label>
              <div className="col-span-12 md:col-span-6">
                <select 
                   value={formData.home_section_id} 
                   onChange={(e) => setFormData({...formData, home_section_id: e.target.value})} 
                   className={inputClass}
                >
                  {sections.map(sec => <option key={sec._id} value={sec._id}>{sec.section} - {sec.title}</option>)}
                </select>
              </div>
            </div>

            {/* Search Box (Edit Mode) */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className={labelClass}>Product Identity*</label>
              <div className="col-span-12 md:col-span-9 relative" ref={dropdownRef}>
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={(e) => {setSearchTerm(e.target.value); setShowDropdown(true);}}
                    className={inputClass}
                  />
                  <SearchIcon size={18} className="absolute right-3 top-3 text-gray-400" />
                </div>

                {showDropdown && searchTerm.length > 0 && (
                  <ul className="absolute z-50 w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {filteredProducts.map((p) => (
                      <li key={p._id} onClick={() => handleSelectProduct(p)} className="px-4 py-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors">
                        <span className="text-sm font-bold text-gray-700">{p.title}</span>
                        <span className="text-[10px] font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">ID: {p.productId}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Status & Order Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Live Status</label>
                    <select value={formData.active} onChange={(e) => setFormData({...formData, active: e.target.value})} className={inputClass}>
                        <option value="Yes">Active</option>
                        <option value="No">Inactive</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Sort Order</label>
                    <input type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: e.target.value})} className={inputClass} />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center items-center gap-4 pt-10 border-t mt-12">
              <button type="submit" disabled={loading} className="bg-primary text-white px-12 py-3 rounded-xl font-bold text-[11px] uppercase flex items-center gap-2 active:scale-95 shadow-lg shadow-primary/20 transition-all">
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Check size={18}/>} Save Updates
              </button>
              <button type="button" onClick={() => navigate('/admin/home-section-1')} className="bg-white border border-gray-300 px-12 py-3 rounded-xl font-bold text-[11px] uppercase active:scale-95 shadow-sm transition-all">
                Discard
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditHomeSectionProduct;