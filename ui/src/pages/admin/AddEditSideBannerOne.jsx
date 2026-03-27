import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  RotateCcw, TriangleAlert, Upload, Check, ChevronDown, X, Link as LinkIcon, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // 🟢 React Query added
import { validateImageFiles } from '../../utils/fileValidator'; // 🟢 Validation Helper added

const AddEditSideBannerOne = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID for Edit Mode
  const isEditMode = Boolean(id);
  const queryClient = useQueryClient();

  // 🟢 Data lock to prevent auto overwrite
  const [isDataInitialized, setIsDataInitialized] = useState(false);

  // States for Left (Image 1) & Right (Image 2)
  const [image1, setImage1] = useState(null); 
  const [preview1, setPreview1] = useState(null);

  const [image2, setImage2] = useState(null); 
  const [preview2, setPreview2] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    link1: '', 
    link2: '', 
    active: 'yes',
    order: ''
  });

  // Helper to fix image URL
  const getFullImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:3001";
      return `${API_BASE}/${path.replace(/^\//, '')}`;
  };

  // 🚀 OPTIMIZATION 1: Fetch Existing Data using useQuery
  const { data: bannerData, isLoading: fetching } = useQuery({
    queryKey: ['sideBannerOneData', id],
    queryFn: async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/side-banner-one/get/${id}`);
      if (!response.data.status) throw new Error("Failed to fetch banner");
      return response.data.data;
    },
    enabled: isEditMode, // Only run in edit mode
    staleTime: 1000 * 60 * 5, // 5 mins cache
    refetchOnWindowFocus: false, // Prevent overwrite on window focus
    onError: (error) => {
      console.error("Error fetching data:", error);
      toast.error("Could not load banner details");
      navigate('/admin/side-banner-one');
    }
  });

  // 🟢 Populate State Once
  useEffect(() => {
    if (isEditMode && bannerData && !isDataInitialized) {
      setFormData({
        link1: bannerData.link1 || '',
        link2: bannerData.link2 || '',
        active: bannerData.isActive ? 'yes' : 'no',
        order: bannerData.order || ''
      });
      if (bannerData.image1) setPreview1(getFullImageUrl(bannerData.image1));
      if (bannerData.image2) setPreview2(getFullImageUrl(bannerData.image2));

      setIsDataInitialized(true); // Lock it
    }
  }, [isEditMode, bannerData, isDataInitialized]);

  // AUTO-GENERATE PREVIEW (Image 1 - Left)
  useEffect(() => {
    if (!image1) return;
    const objectUrl = URL.createObjectURL(image1);
    setPreview1(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image1]);

  // AUTO-GENERATE PREVIEW (Image 2 - Right)
  useEffect(() => {
    if (!image2) return;
    const objectUrl = URL.createObjectURL(image2);
    setPreview2(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image2]);

  // Remove Handlers
  const removeImage1 = () => {
    setImage1(null);
    setPreview1(null);
    const input = document.getElementById('image1-input');
    if (input) input.value = "";
  };

  const removeImage2 = () => {
    setImage2(null);
    setPreview2(null);
    const input = document.getElementById('image2-input');
    if (input) input.value = "";
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // 🚀 OPTIMIZATION 2: Unified Save/Update Mutation
  const saveBannerMutation = useMutation({
    mutationFn: async (payloadData) => {
      const API_URL = process.env.REACT_APP_API_URL;
      if (isEditMode) {
        // MNC Standard logic: use PUT or PATCH appropriately. We use PUT to match your previous setup safely.
        const res = await axios.patch(`${API_URL}/side-banner-one/update/${id}`, payloadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
      } else {
        const res = await axios.post(`${API_URL}/side-banner-one/save`, payloadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
      }
    }
  });

  // 🟢 SUBMIT HANDLER
  const handleSubmit = (e, actionType) => {
    e.preventDefault();

    if (!isEditMode && (!image1 && !preview1)) return toast.error("Left image is required.");
    if (!isEditMode && (!image2 && !preview2)) return toast.error("Right image is required.");

    const toastId = toast.loading(isEditMode ? "Updating banners..." : "Saving banners...");

    const data = new FormData();
    data.append('link1', formData.link1);
    data.append('link2', formData.link2);
    data.append('isActive', formData.active === 'yes');
    data.append('order', formData.order);

    if (image1) data.append('image1', image1);
    if (image2) data.append('image2', image2);

    saveBannerMutation.mutate(data, {
      onSuccess: (resData) => {
        if (resData.status) {
          toast.success(resData.msg || "Success!", { id: toastId });
          
          if (isEditMode) {
             queryClient.invalidateQueries({ queryKey: ['sideBannerOneData', id] });
          }

          if (actionType === 'back') {
             navigate('/admin/side-banner-one');
          } else if (!isEditMode) {
             setFormData({ link1: '', link2: '', active: 'yes', order: '' });
             setImage1(null); setPreview1(null);
             setImage2(null); setPreview2(null);
             document.getElementById('image1-input').value = "";
             document.getElementById('image2-input').value = "";
          }
        } else {
          toast.error(resData.msg || "Operation failed", { id: toastId });
        }
      },
      onError: (error) => {
        console.error("Submit Error:", error);
        toast.error(error.response?.data?.msg || "Failed to connect to server", { id: toastId });
      }
    });
  };

  // 🟢 Centralized Image File Selection with Validation
  const onFileSelect = (e, setImage) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (validateImageFiles(file)) {
            setImage(file);
        } else {
            e.target.value = ""; // Reset input if validation fails
        }
    }
  };

  // Loader Setup
  if (isEditMode && (fetching || !isDataInitialized)) {
    return <div className="h-screen flex items-center justify-center bg-cream-50"><Loader2 className="animate-spin text-primary" size={48}/></div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen font-body p-4 md:p-8">

      <div className="bg-white rounded-xl shadow-[0_2px_15px_rgb(0,0,0,0.05)] border border-gray-100 max-w-5xl mx-auto overflow-hidden">

        <div className="bg-primary px-6 py-4 border-b border-primary-dark flex justify-between items-center">
           <h2 className="font-bold text-white font-display text-lg tracking-wide">
               {isEditMode ? "Edit Side Banner 1" : "Add Side Banner 1"}
           </h2>
        </div>

        <form className="p-6 md:p-10 space-y-8" onSubmit={(e) => e.preventDefault()}>

           {/* ================= LEFT BANNER SECTION ================= */}
           <div className="bg-cream-50/50 p-6 rounded-lg border border-cream-200 relative">
               <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-primary border border-cream-200 rounded uppercase tracking-wider">
                   Left Banner (Image 1)
               </div>
               
               <div className="space-y-6">
                   <FormRow label="Left Image">
                     <div className="flex items-start gap-4">
                         <div className="flex flex-col gap-2 justify-center h-16">
                             <div className="flex items-center gap-3">
                                 <label className="cursor-pointer bg-white border border-dashed border-gray-300 px-4 py-2 rounded-lg text-[11px] font-bold uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2 text-gray-500 shadow-sm">
                                    <Upload size={14} />
                                    {image1 || preview1 ? "Change Image" : "Upload Image"}
                                    <input 
                                        id="image1-input"
                                        type="file" 
                                        className="hidden" 
                                        onChange={(e) => onFileSelect(e, setImage1)}
                                        accept="image/jpeg,image/png,image/webp" 
                                    />
                                 </label>

                                 {preview1 && (
                                    <div className="relative group shrink-0">
                                        <div className="w-32 h-16 rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white flex items-center justify-center">
                                            <img src={preview1} alt="Left Preview" className="w-full h-full object-cover" />
                                        </div>
                                        <button type="button" onClick={removeImage1} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform">
                                            <X size={12} />
                                        </button>
                                    </div>
                                 )}

                                 {image1 && (
                                     <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded">
                                        <span className="text-[10px] text-primary font-bold max-w-[150px] truncate">{image1.name}</span>
                                        <Check size={12} className="text-green-600" />
                                     </div>
                                 )}
                             </div>
                         </div>
                     </div>
                   </FormRow>

                   <FormRow label="Target Link">
                      <div className="relative">
                        <LinkIcon size={14} className="absolute left-3 top-3 text-gray-400" />
                        <input type="text" name="link1" value={formData.link1} onChange={handleChange} className="theme-input pl-9" placeholder="e.g., /category/fiction" />
                      </div>
                   </FormRow>
               </div>
           </div>

           {/* ================= RIGHT BANNER SECTION ================= */}
           <div className="bg-cream-50/50 p-6 rounded-lg border border-cream-200 relative mt-8">
               <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-accent border border-cream-200 rounded uppercase tracking-wider">
                   Right Banner (Image 2)
               </div>

               <div className="space-y-6">
                   <FormRow label="Right Image">
                     <div className="flex items-start gap-4">
                         <div className="flex flex-col gap-2 justify-center h-16">
                             <div className="flex items-center gap-3">
                                 <label className="cursor-pointer bg-white border border-dashed border-gray-300 px-4 py-2 rounded-lg text-[11px] font-bold uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2 text-gray-500 shadow-sm">
                                    <Upload size={14} />
                                    {image2 || preview2 ? "Change Image" : "Upload Image"}
                                    <input 
                                        id="image2-input"
                                        type="file" 
                                        className="hidden" 
                                        onChange={(e) => onFileSelect(e, setImage2)}
                                        accept="image/jpeg,image/png,image/webp" 
                                    />
                                 </label>

                                 {preview2 && (
                                    <div className="relative group shrink-0">
                                        <div className="w-32 h-16 rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white flex items-center justify-center">
                                            <img src={preview2} alt="Right Preview" className="w-full h-full object-cover" />
                                        </div>
                                        <button type="button" onClick={removeImage2} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform">
                                            <X size={12} />
                                        </button>
                                    </div>
                                 )}

                                 {image2 && (
                                     <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded">
                                        <span className="text-[10px] text-primary font-bold max-w-[150px] truncate">{image2.name}</span>
                                        <Check size={12} className="text-green-600" />
                                     </div>
                                 )}
                             </div>
                         </div>
                     </div>
                   </FormRow>

                   <FormRow label="Target Link">
                      <div className="relative">
                        <LinkIcon size={14} className="absolute left-3 top-3 text-gray-400" />
                        <input type="text" name="link2" value={formData.link2} onChange={handleChange} className="theme-input pl-9" placeholder="e.g., /category/non-fiction" />
                      </div>
                   </FormRow>
               </div>
           </div>

           {/* ================= COMMON SETTINGS ================= */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
               <FormRow label="Active Status">
                  <div className="relative w-full">
                     <select name="active" value={formData.active} onChange={handleChange} className="theme-input appearance-none bg-white cursor-pointer w-full">
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                     </select>
                     <ChevronDown size={14} className="absolute right-3 top-3.5 text-text-muted pointer-events-none" />
                  </div>
               </FormRow>

               <FormRow label="Sort Order">
                  <input type="number" name="order" value={formData.order} onChange={handleChange} className="theme-input" placeholder="e.g., 1" />
               </FormRow>
           </div>

           {/* ACTION BUTTONS */}
           <div className="pt-8 flex flex-wrap justify-center gap-4 border-t border-gray-100 mt-8 font-montserrat">
              <button 
                type="button" 
                disabled={saveBannerMutation.isPending} 
                onClick={(e) => handleSubmit(e, 'stay')} 
                className={`flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded shadow-lg shadow-primary/30 transition-all transform active:scale-95 text-sm font-bold uppercase tracking-wider ${saveBannerMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                 {saveBannerMutation.isPending ? 'Processing...' : <><Check size={18} strokeWidth={3} /> {isEditMode ? "Update" : "Save"}</>}
              </button>

              <button 
                type="button" 
                disabled={saveBannerMutation.isPending} 
                onClick={(e) => handleSubmit(e, 'back')} 
                className={`flex items-center gap-2 bg-text-main hover:bg-black text-white px-6 py-2.5 rounded shadow-md transition-all transform active:scale-95 text-sm font-bold uppercase tracking-wider ${saveBannerMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                 {saveBannerMutation.isPending ? <Loader2 size={16} className="animate-spin"/> : <RotateCcw size={16} />} 
                 {isEditMode ? "Update & Go Back" : "Save & Go Back"}
              </button>

              <button 
                type="button" 
                disabled={saveBannerMutation.isPending}
                onClick={() => navigate('/admin/side-banner-one')} 
                className="flex items-center gap-2 bg-white border border-gray-300 text-text-muted hover:text-red-500 hover:border-red-500 px-6 py-2.5 rounded shadow-sm transition-all text-sm font-bold uppercase tracking-wider disabled:opacity-50"
              >
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
           box-shadow: 0 0 0 3px rgba(0, 141, 218, 0.1);
           outline: none;
        }
      `}</style>
    </div>
  );
};

const FormRow = ({ label, children }) => (
   <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50/50 pb-5 last:border-0 last:pb-0">
      <div className="col-span-12 md:col-span-3 text-left md:text-right pt-2.5">
         <label className="text-xs font-bold text-text-muted uppercase tracking-wider font-montserrat">{label}</label>
      </div>
      <div className="col-span-12 md:col-span-9">
         {children}
      </div>
   </div>
);

export default AddEditSideBannerOne;