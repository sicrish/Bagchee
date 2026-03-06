import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  RotateCcw, TriangleAlert, Upload, Check, ChevronDown, X, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // 🟢 Added React Query
import { validateImageFiles } from '../../utils/fileValidator'; // 🟢 Image Validation Helper

const AddHomeSlider = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID for Edit Mode
  const isEditMode = Boolean(id);
  const queryClient = useQueryClient();

  // 🟢 Flag to prevent data overwrite during typing
  const [isDataInitialized, setIsDataInitialized] = useState(false);

  // States for Desktop & Mobile Images
  const [desktopImage, setDesktopImage] = useState(null);
  const [desktopPreview, setDesktopPreview] = useState(null);

  const [mobileImage, setMobileImage] = useState(null);
  const [mobilePreview, setMobilePreview] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    link: '',
    active: 'no',
    order: ''
  });

  // Helper to fix image URL
  const getFullImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:5000";
      return `${API_BASE}/${path.replace(/^\//, '')}`;
  };

  // 🚀 OPTIMIZATION 1: Fetch Existing Data using useQuery
  const { data: sliderData, isLoading: fetching } = useQuery({
    queryKey: ['sliderDetails', id],
    queryFn: async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/home-slider/get/${id}`);
      if (!response.data.status) throw new Error("Failed to fetch");
      return response.data.data;
    },
    enabled: isEditMode, // Only run in edit mode
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
    refetchOnWindowFocus: false,
    onError: (error) => {
      toast.error("Could not load slider details");
      navigate('/admin/home-slider');
    }
  });

  // 🟢 2. Initialize State ONCE when data arrives
  useEffect(() => {
    if (isEditMode && sliderData && !isDataInitialized) {
      setFormData({
        link: sliderData.link || '',
        active: sliderData.isActive ? 'yes' : 'no',
        order: sliderData.order || ''
      });

      // Set existing previews
      if (sliderData.desktopImage) setDesktopPreview(getFullImageUrl(sliderData.desktopImage));
      if (sliderData.mobileImage) setMobilePreview(getFullImageUrl(sliderData.mobileImage));
      
      setIsDataInitialized(true); // Lock the initialization
    }
  }, [isEditMode, sliderData, isDataInitialized]);

  // 🟢 3. AUTO-GENERATE PREVIEW (Desktop)
  useEffect(() => {
    if (!desktopImage) return;
    const objectUrl = URL.createObjectURL(desktopImage);
    setDesktopPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [desktopImage]);

  // 🟢 4. AUTO-GENERATE PREVIEW (Mobile)
  useEffect(() => {
    if (!mobileImage) return;
    const objectUrl = URL.createObjectURL(mobileImage);
    setMobilePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [mobileImage]);

  // Remove Handlers
  const removeDesktopImage = () => {
    setDesktopImage(null);
    setDesktopPreview(null);
    const input = document.getElementById('desktop-file-input');
    if (input) input.value = "";
  };

  const removeMobileImage = () => {
    setMobileImage(null);
    setMobilePreview(null);
    const input = document.getElementById('mobile-file-input');
    if (input) input.value = "";
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // 🟢 Image Selection with Validation
  const onFileSelect = (e, setImage) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        // Standardize image validation using helper
        if (validateImageFiles(file)) {
            setImage(file);
        } else {
            e.target.value = ""; // Reset input on failure
        }
    }
  };

  // 🚀 OPTIMIZATION 2: Unified Save/Update Mutation
  const saveSliderMutation = useMutation({
    mutationFn: async (payload) => {
      const API_URL = process.env.REACT_APP_API_URL;
      if (isEditMode) {
        const res = await axios.patch(`${API_URL}/home-slider/update/${id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
      } else {
        const res = await axios.post(`${API_URL}/home-slider/save`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
      }
    }
  });

  // 🟢 SUBMIT HANDLER
  const handleSubmit = (e, actionType) => {
    e.preventDefault();

    // Validation: Add Mode needs both images
    if (!isEditMode && (!desktopImage || !mobileImage)) {
         return toast.error("Please upload both Desktop and Mobile images.");
    }

    const toastId = toast.loading(isEditMode ? "Updating slider..." : "Saving slider...");

    const data = new FormData();
    data.append('link', formData.link);
    data.append('isActive', formData.active === 'yes');
    data.append('order', formData.order);

    if (desktopImage) data.append('desktopImage', desktopImage);
    if (mobileImage) data.append('mobileImage', mobileImage);

    saveSliderMutation.mutate(data, {
      onSuccess: (resData) => {
        if (resData.status) {
          toast.success(resData.msg || "Success!", { id: toastId });
          
          if (isEditMode) {
            queryClient.invalidateQueries(['sliderDetails', id]);
          }

          if (actionType === 'back') {
             navigate('/admin/home-slider');
          } else if (!isEditMode) {
             setFormData({ link: '', active: 'no', order: '' });
             setDesktopImage(null); setDesktopPreview(null);
             setMobileImage(null); setMobilePreview(null);
             document.getElementById('desktop-file-input').value = "";
             document.getElementById('mobile-file-input').value = "";
          }
        } else {
            toast.error(resData.msg || "Operation failed", { id: toastId });
        }
      },
      onError: (error) => {
        const errorMsg = error.response?.data?.msg || "Failed to connect to server";
        toast.error(errorMsg, { id: toastId });
      }
    });
  };

  // Full Screen Loader for Setup
  if (isEditMode && (fetching || !isDataInitialized)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-body p-4 md:p-8">

      <div className="bg-white rounded-xl shadow-[0_2px_15px_rgb(0,0,0,0.05)] border border-gray-100 max-w-5xl mx-auto overflow-hidden">

        <div className="bg-primary px-6 py-4 border-b border-primary-dark flex justify-between items-center">
           <h2 className="font-bold text-white font-display text-lg tracking-wide">
               {isEditMode ? "Edit Slider" : "Add Slider"}
           </h2>
        </div>

        <form className="p-6 md:p-10 space-y-6" onSubmit={(e) => e.preventDefault()}>

           {/* 🟢 1. DESKTOP IMAGE UPLOAD */}
           <FormRow label="Desktop Image">
             <div className="flex items-start gap-4">
                 <div className="flex flex-col gap-2 justify-center h-16">
                     <div className="flex items-center gap-3">
                         <label className="cursor-pointer bg-white border border-dashed border-gray-300 px-4 py-2 rounded-lg text-[11px] font-bold uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2 text-gray-500 shadow-sm">
                            <Upload size={14} />
                            {desktopImage || desktopPreview ? "Change Desktop" : "Upload Desktop"}
                            <input 
                                id="desktop-file-input"
                                type="file" 
                                className="hidden" 
                                onChange={(e) => onFileSelect(e, setDesktopImage)} 
                                accept="image/jpeg,image/png,image/webp" 
                            />
                         </label>

                         {desktopPreview && (
                            <div className="relative group shrink-0">
                                <div className="w-32 h-12 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                    <img src={desktopPreview} alt="Desktop Preview" className="w-full h-full object-cover" />
                                </div>
                                <button type="button" onClick={removeDesktopImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform">
                                    <X size={12} />
                                </button>
                            </div>
                         )}

                         {desktopImage && (
                             <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded">
                                <span className="text-[10px] text-primary font-bold max-w-[150px] truncate">{desktopImage.name}</span>
                                <Check size={12} className="text-green-600" />
                             </div>
                         )}
                     </div>
                 </div>
             </div>
           </FormRow>

           {/* 🟢 2. MOBILE IMAGE UPLOAD */}
           <FormRow label="Mobile Image">
             <div className="flex items-start gap-4">
                 <div className="flex flex-col gap-2 justify-center h-16">
                     <div className="flex items-center gap-3">
                         <label className="cursor-pointer bg-white border border-dashed border-gray-300 px-4 py-2 rounded-lg text-[11px] font-bold uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2 text-gray-500 shadow-sm">
                            <Upload size={14} />
                            {mobileImage || mobilePreview ? "Change Mobile" : "Upload Mobile"}
                            <input 
                                id="mobile-file-input"
                                type="file" 
                                className="hidden" 
                                onChange={(e) => onFileSelect(e, setMobileImage)} 
                                accept="image/jpeg,image/png,image/webp" 
                            />
                         </label>

                         {mobilePreview && (
                            <div className="relative group shrink-0">
                                <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                    <img src={mobilePreview} alt="Mobile Preview" className="w-full h-full object-cover" />
                                </div>
                                <button type="button" onClick={removeMobileImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform">
                                    <X size={12} />
                                </button>
                            </div>
                         )}

                         {mobileImage && (
                             <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded">
                                <span className="text-[10px] text-primary font-bold max-w-[150px] truncate">{mobileImage.name}</span>
                                <Check size={12} className="text-green-600" />
                             </div>
                         )}
                     </div>
                 </div>
             </div>
           </FormRow>

           <FormRow label="Link">
              <input type="text" name="link" value={formData.link} onChange={handleChange} className="theme-input" placeholder="e.g., /shop" />
           </FormRow>

           <FormRow label="Active">
              <div className="relative max-w-xs">
                 <select name="active" value={formData.active} onChange={handleChange} className="theme-input appearance-none bg-white cursor-pointer">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                 </select>
                 <ChevronDown size={14} className="absolute right-3 top-3.5 text-text-muted pointer-events-none" />
              </div>
           </FormRow>

           <FormRow label="Order">
              <input type="number" name="order" value={formData.order} onChange={handleChange} className="theme-input" placeholder="e.g., 1" />
           </FormRow>

           <div className="pt-8 flex flex-wrap justify-center gap-4 border-t border-gray-100 mt-8 font-montserrat">
              <button 
                type="button" 
                disabled={saveSliderMutation.isPending} 
                onClick={(e) => handleSubmit(e, 'stay')} 
                className={`flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded shadow-lg shadow-primary/30 transition-all transform active:scale-95 text-sm font-bold uppercase tracking-wider ${saveSliderMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                 {saveSliderMutation.isPending ? <Loader2 size={16} className="animate-spin"/> : <><Check size={18} strokeWidth={3} /> {isEditMode ? "Update" : "Save"}</>}
              </button>

              <button 
                type="button" 
                disabled={saveSliderMutation.isPending} 
                onClick={(e) => handleSubmit(e, 'back')} 
                className="flex items-center gap-2 bg-text-main hover:bg-black text-white px-6 py-2.5 rounded shadow-md transition-all transform active:scale-95 text-sm font-bold uppercase tracking-wider disabled:opacity-70"
              >
                 {saveSliderMutation.isPending ? <Loader2 size={16} className="animate-spin"/> : <RotateCcw size={16} />} {isEditMode ? "Update & Go Back" : "Save & Go Back"}
              </button>

              <button type="button" onClick={() => navigate('/admin/home-slider')} className="flex items-center gap-2 bg-white border border-gray-300 text-text-muted hover:text-red-500 hover:border-red-500 px-6 py-2.5 rounded shadow-sm transition-all text-sm font-bold uppercase tracking-wider disabled:opacity-50">
                 <TriangleAlert size={16} /> Cancel
              </button>
           </div>

        </form>
      </div>

      <style>{`
        .theme-input {
           width: 100%;
           border: 1px solid #e5e7eb;
           border-radius: 6px;
           padding: 10px 12px;
           font-size: 0.9rem;
           color: #1f2937;
           transition: all 0.2s;
           font-family: 'Roboto', sans-serif;
        }
        .theme-input:focus {
           border-color: #008DDA; 
           box-shadow: 0 0 0 3px rgba(0, 141, 218, 0.15);
           outline: none;
        }
      `}</style>
    </div>
  );
};

const FormRow = ({ label, children }) => (
   <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-5 last:border-0">
      <div className="col-span-12 md:col-span-3 text-left md:text-right pt-2.5">
         <label className="text-xs font-bold text-text-muted uppercase tracking-wider font-montserrat">{label}</label>
      </div>
      <div className="col-span-12 md:col-span-9">
         {children}
      </div>
   </div>
);

export default AddHomeSlider;