'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, Tag } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const AddTags = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null); // 🟢 Auto-focus ke liye
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
  });

  // 🟢 Load hote hi focus input par jaye
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e, actionType = 'stay') => {
    if (e) e.preventDefault();
    
    // 💡 Trim checking: Sirf spaces ko rokne ke liye
    if (!formData.title.trim()) return toast.error("Tag title is required!");

    setLoading(true);
    const toastId = toast.loading("Syncing tag with database...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/tags/save`, {
        title: formData.title.trim()
      });

      if (res.data.status) {
        toast.success("New Tag Created! 🏷️", { id: toastId });
        
        if (actionType === 'back') {
          navigate('/admin/tags');
        } else {
          setFormData({ title: '' });
          inputRef.current.focus(); // Dubara focus lao
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Server Error: Failed to save", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 TOP HEADER STRIP */}
      <div className="bg-primary px-6 py-4 shadow-lg flex items-center justify-between text-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Tag size={20} />
          <h1 className="text-lg font-bold uppercase tracking-wider font-display">
            Manage Product Tags
          </h1>
        </div>
        <button onClick={() => navigate('/admin/tags')} className="hover:rotate-90 transition-transform"><X size={24}/></button>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 mt-6">
        <form 
          onSubmit={(e) => handleSubmit(e, 'stay')} 
          className="bg-white rounded-2xl border border-cream-200 shadow-xl overflow-hidden animate-fadeIn"
        >
          
          {/* Section Sub-heading */}
          <div className="bg-cream-100/50 px-8 py-4 border-b border-cream-200 flex items-center gap-2">
             <div className="w-1 h-4 bg-primary rounded-full"></div>
             <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] font-montserrat text-text-muted">
                add tags
             </h2>
          </div>

          <div className="p-8 md:p-12 space-y-10">
            {/* 🟢 Title Input Section */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-12 md:col-span-3 md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat tracking-tight">
                Title*
              </label>
              <div className="col-span-12 md:col-span-9">
                <input 
                  ref={inputRef}
                  type="text"
                  name="title" 
                  autoComplete="off"
                  value={formData.title} 
                  onChange={handleChange} 
               
                  className="w-full border border-gray-300 rounded-xl px-5 py-3 text-[14px] outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white text-text-main font-medium shadow-inner" 
                />
                
              </div>
            </div>

            {/* --- ACTION BUTTONS (MNC Layout) --- */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-10 border-t mt-12 font-montserrat">
              
              <button 
                type="submit" // 🟢 Enter key par trigger hoga
                disabled={loading} 
                className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-10 py-3 rounded-xl font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Check size={18} className="text-green-600"/>} 
                Save & Continue
              </button>
              
              <button 
                type="button"
                onClick={() => handleSubmit(null, 'back')} 
                disabled={loading} 
                className="w-full sm:w-auto bg-primary text-white hover:bg-primary-dark px-10 py-3 rounded-xl font-bold text-[11px] uppercase flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                <RotateCcw size={18} /> 
                Save and Return
              </button>

              <button 
                type="button" 
                onClick={() => navigate('/admin/tags')} 
                className="w-full sm:w-auto bg-white border border-red-100 text-red-500 hover:bg-red-50 px-10 py-3 rounded-xl font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <X size={18} /> Discard
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTags;