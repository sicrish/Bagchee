'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RotateCcw, X, Loader2, LayoutGrid, Save } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // 🟢 React Query added

const AddEditHomeSection = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // URL mein ID check karega (Edit vs Add)
  const queryClient = useQueryClient();

  const isEditMode = Boolean(id);

  // 🟢 Flag to prevent data overwrite during typing
  const [isDataInitialized, setIsDataInitialized] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    section: '',
    title: '',
    tagline: ''
  });

  // 🚀 OPTIMIZATION 1: Fetch Existing Data with React Query (Only if in Edit Mode)
  const { data: sectionData, isLoading: fetching } = useQuery({
    queryKey: ['homeSectionData', id],
    queryFn: async () => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/home-sections/get/${id}`);
      if (!res.data.status) {
        throw new Error("Failed to load section data");
      }
      return res.data.data;
    },
    enabled: isEditMode, // 🟢 Sirf tabhi run hoga jab URL me 'id' hogi
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
    refetchOnWindowFocus: false, // Window switch karne par overwrite na kare
    onError: (error) => {
      console.error(error);
      toast.error("Data retrieval failed");
      navigate('/admin/home-sections');
    }
  });

  // 🟢 Effect to populate state ONLY ONCE (When data arrives in Edit Mode)
  useEffect(() => {
    if (isEditMode && sectionData && !isDataInitialized) {
      setFormData({
        section: sectionData.section || '',
        title: sectionData.title || '',
        tagline: sectionData.tagline || ''
      });
      setIsDataInitialized(true); // Lock it
    }
  }, [isEditMode, sectionData, isDataInitialized]);

  // Safe handler for fast typing
  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  // 🚀 OPTIMIZATION 2: Unified Mutation for Add AND Update
  const saveSectionMutation = useMutation({
    mutationFn: async (submitData) => {
      const API_URL = process.env.REACT_APP_API_URL;
      if (isEditMode) {
        // Update Call
        const res = await axios.patch(`${API_URL}/home-sections/update/${id}`, submitData);
        return res.data;
      } else {
        // Create Call
        const res = await axios.post(`${API_URL}/home-sections/save`, submitData);
        return res.data;
      }
    }
  });

  // 🔵 Unified Submit Logic
  const handleSubmit = (e, actionType) => {
    e.preventDefault();
    
    // Validations
    if (!formData.section.trim()) return toast.error("Section name is required!");
    if (!formData.title.trim()) return toast.error("Display title is required!");

    const toastId = toast.loading(isEditMode ? "Updating section..." : "Creating section...");

    // 🟢 Trigger React Query Mutation
    saveSectionMutation.mutate(formData, {
      onSuccess: (resData) => {
        if (resData.status) {
          toast.success(isEditMode ? "Section synchronized! ✨" : "New section added! 📦", { id: toastId });
          
          if (isEditMode) {
            // Edit mode me purana cache clear karna padega taaki next load par updated dikhe
            queryClient.invalidateQueries({ queryKey: ['homeSectionData', id] });
          }

          if (actionType === 'back') {
            navigate('/admin/titles');
          } else if (!isEditMode) {
            // Sirf Add Mode me form clear hoga agar 'stay' click kiya
            setFormData({ section: '', title: '', tagline: '' }); 
          }
        } else {
          toast.error(resData.msg || "Operational failure", { id: toastId });
        }
      },
      onError: (error) => {
        const errorMsg = error.response?.data?.msg || "Operational failure";
        toast.error(errorMsg, { id: toastId });
      }
    });
  };

  // Reusable Styling Classes
  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[14px] outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white text-text-main font-medium shadow-inner font-body";
  const labelClass = "col-span-12 md:col-span-3 text-left md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat tracking-tight pt-3";

  // Loading Screen for Edit Mode
  if (isEditMode && (fetching || !isDataInitialized)) {
    return <div className="h-screen flex items-center justify-center bg-cream-50"><Loader2 className="animate-spin text-primary" size={48}/></div>;
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-20">
      
      {/* 🔵 Header Strip */}
      <div className="bg-primary px-6 py-4 shadow-lg flex items-center justify-between text-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <LayoutGrid size={22} />
          <h1 className="text-lg font-bold uppercase tracking-wider font-display">
            {isEditMode ? "Modify Home Section" : "Initialize New Section"}
          </h1>
        </div>
        <button onClick={() => navigate('/admin/home-sections')} className="hover:rotate-90 transition-transform"><X size={24}/></button>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 mt-6">
        <form onSubmit={(e) => e.preventDefault()} className="bg-white rounded-2xl border border-cream-200 shadow-xl overflow-hidden animate-fadeIn">
          
          <div className="bg-cream-100/50 px-8 py-4 border-b border-cream-200 flex items-center gap-2">
             <div className="w-1.5 h-4 bg-primary rounded-full"></div>
             <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] font-montserrat text-text-muted">Section Parameters</h2>
          </div>

          <div className="p-8 md:p-12 space-y-10">
            
            {/* Section Category Field */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Section*</label>
              <div className="col-span-12 md:col-span-9">
                <input 
                  type="text" 
                  name="section" 
                  value={formData.section} 
                  onChange={handleChange} 
                  className={inputClass}
                  placeholder="e.g. section 1"
                  readOnly={isEditMode} 
                />
                <p className="text-[9px] text-gray-400 mt-2 italic font-montserrat">* Unique identifier used by frontend to fetch specific titles.</p>
              </div>
            </div>

            {/* Display Title Field */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Title*</label>
              <div className="col-span-12 md:col-span-9">
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  className={inputClass}
                  placeholder="e.g. Today Sale"
                />
              </div>
            </div>

            {/* 🟢 Tagline Field */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Tagline (Subtitle)</label>
              <div className="col-span-12 md:col-span-9">
                <input 
                  type="text" 
                  name="tagline" 
                  value={formData.tagline} 
                  onChange={handleChange} 
                  className={`${inputClass} text-blue-600`}
                  placeholder="e.g. Explore the latest books"
                />
                <p className="text-[9px] text-gray-400 mt-2 italic font-montserrat">A small subtitle displayed below the main title.</p>
              </div>
            </div>

            {/* --- ACTION BUTTONS (MNC Standard) --- */}
            {/* 🟢 Bound to saveSectionMutation.isPending dynamically */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-10 border-t mt-12 font-montserrat">
              
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={saveSectionMutation.isPending} 
                className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-10 py-3 rounded-xl font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-70"
              >
                {saveSectionMutation.isPending ? <Loader2 size={16} className="animate-spin text-green-600"/> : <Save size={18} className="text-green-600"/>} 
                {isEditMode ? "Apply Changes" : "Save"}
              </button>
              
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={saveSectionMutation.isPending} 
                className="w-full sm:w-auto bg-primary text-white hover:bg-primary-dark px-10 py-3 rounded-xl font-bold text-[11px] uppercase flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-70"
              >
                {saveSectionMutation.isPending ? <Loader2 size={16} className="animate-spin"/> : <RotateCcw size={18} />} 
                {isEditMode ? "Update & Return" : "Save & Return"}
              </button>

              <button 
                type="button" 
                disabled={saveSectionMutation.isPending}
                onClick={() => navigate('/admin/titles')} 
                className="w-full sm:w-auto bg-white border border-red-100 text-red-500 hover:bg-red-50 px-10 py-3 rounded-xl font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
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

export default AddEditHomeSection;