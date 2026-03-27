import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RotateCcw, TriangleAlert, Upload, Check, ChevronDown, X, Link as LinkIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // 🟢 React Query added

const AddEditSideBannerTwo = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const queryClient = useQueryClient();

  // 🟢 Data lock to prevent auto overwrite
  const [isDataInitialized, setIsDataInitialized] = useState(false);

  const [image1, setImage1] = useState(null);
  const [preview1, setPreview1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [preview2, setPreview2] = useState(null);

  const [formData, setFormData] = useState({ link1: '', link2: '', active: 'yes', order: '' });

  // 🛠️ Image Validation Logic (MNC Standards)
  const validateAndSetImage = (e, setImage) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 1. Extension/Mime-Type Check
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid format! Only JPG, PNG, and WebP allowed.");
        e.target.value = ""; // Input reset
        return;
      }

      // 2. Size Check (10MB)
      const MAX_SIZE = 10 * 1024 * 1024; 
      if (file.size > MAX_SIZE) {
        toast.error("File is too heavy! Max 10MB allowed.");
        e.target.value = "";
        return;
      }

      setImage(file);
    }
  };

  const getFullImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:3001";
      return `${API_BASE}/${path.replace(/^\//, '')}`;
  };

  // 🚀 OPTIMIZATION 1: Fetch Existing Data using useQuery
  const { data: bannerData, isLoading: fetching } = useQuery({
    queryKey: ['sideBannerTwoData', id],
    queryFn: async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/side-banner-two/get/${id}`);
      if (!response.data.status) throw new Error("Failed to fetch banner");
      return response.data.data;
    },
    enabled: isEditMode, // Only run in edit mode
    staleTime: 1000 * 60 * 5, // 5 mins cache
    refetchOnWindowFocus: false, // Prevent overwrite on window focus
    onError: (error) => {
      console.error("Error fetching data:", error);
      toast.error("Could not load banner details");
      navigate('/admin/side-banner-two');
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

  // 🚀 OPTIMIZATION 2: Unified Save/Update Mutation
  const saveBannerMutation = useMutation({
    mutationFn: async (payloadData) => {
      const url = isEditMode 
        ? `${process.env.REACT_APP_API_URL}/side-banner-two/update/${id}` 
        : `${process.env.REACT_APP_API_URL}/side-banner-two/save`;
      
      // Changed to PUT/POST appropriately
      const method = isEditMode ? 'patch' : 'post';
      
      const res = await axios({ 
        method, 
        url, 
        data: payloadData,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    }
  });

  // 🟢 SUBMIT HANDLER
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!isEditMode && (!preview1 || !preview2)) return toast.error("Both images are required.");
    
    const toastId = toast.loading("Processing...");

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
          toast.success(isEditMode ? "Banner updated!" : "Banner saved!", { id: toastId });
          
          if (isEditMode) {
             queryClient.invalidateQueries({ queryKey: ['sideBannerTwoData', id] });
          }

          if (actionType === 'back') {
             navigate('/admin/side-banner-two');
          } else if (!isEditMode) {
             setFormData({ link1: '', link2: '', active: 'yes', order: '' });
             setImage1(null); setPreview1(null);
             setImage2(null); setPreview2(null);
             const input1 = document.getElementById('image1-input');
             if(input1) input1.value = "";
             const input2 = document.getElementById('image2-input');
             if(input2) input2.value = "";
          }
        } else {
          toast.error(resData.msg || "Operation failed", { id: toastId });
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.msg || "Failed to save", { id: toastId }); 
      }
    });
  };

  // Loader Setup
  if (isEditMode && (fetching || !isDataInitialized)) {
    return <div className="h-screen flex items-center justify-center bg-cream-50"><Loader2 className="animate-spin text-primary" size={48}/></div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8 font-body">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-5xl mx-auto overflow-hidden">
        <div className="bg-primary px-6 py-4 text-white font-bold text-lg font-display">
            {isEditMode ? "Edit Side Banner 2" : "Add Side Banner 2"}
        </div>
        <form className="p-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
          
          {/* Banner 1 */}
          <div className="bg-cream-50/50 p-6 rounded-lg border border-cream-200">
             <div className="font-bold text-primary mb-4 text-xs uppercase tracking-widest font-montserrat">Left Banner</div>
             <div className="grid md:grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Image</label>
                  <input 
                    id="image1-input"
                    type="file" 
                    onChange={(e) => validateAndSetImage(e, setImage1)} 
                    className="w-full text-xs" 
                    accept="image/jpeg,image/png,image/webp" 
                  />
                  {preview1 && (
                      <div className="relative inline-block mt-2 group">
                          <img src={preview1} className="w-32 h-16 object-cover rounded border shadow-sm" alt="Preview 1" />
                          <button type="button" onClick={removeImage1} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform">
                              <X size={12} />
                          </button>
                      </div>
                  )}
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Target Link</label>
                  <input type="text" value={formData.link1} onChange={(e) => setFormData({...formData, link1: e.target.value})} className="theme-input" placeholder="/category-link" />
               </div>
             </div>
          </div>

          {/* Banner 2 */}
          <div className="bg-cream-50/50 p-6 rounded-lg border border-cream-200">
             <div className="font-bold text-accent mb-4 text-xs uppercase tracking-widest font-montserrat">Right Banner</div>
             <div className="grid md:grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Image</label>
                  <input 
                    id="image2-input"
                    type="file" 
                    onChange={(e) => validateAndSetImage(e, setImage2)} 
                    className="w-full text-xs" 
                    accept="image/jpeg,image/png,image/webp" 
                  />
                  {preview2 && (
                      <div className="relative inline-block mt-2 group">
                          <img src={preview2} className="w-32 h-16 object-cover rounded border shadow-sm" alt="Preview 2" />
                          <button type="button" onClick={removeImage2} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform">
                              <X size={12} />
                          </button>
                      </div>
                  )}
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Target Link</label>
                  <input type="text" value={formData.link2} onChange={(e) => setFormData({...formData, link2: e.target.value})} className="theme-input" placeholder="/category-link" />
               </div>
             </div>
          </div>

          {/* Order & Status */}
          <div className="grid grid-cols-2 gap-6 pt-4">
              <div>
                <label className="text-xs font-bold text-text-muted block mb-1 uppercase">Active Status</label>
                <select name="active" value={formData.active} onChange={(e) => setFormData({...formData, active: e.target.value})} className="theme-input cursor-pointer">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted block mb-1 uppercase">Display Order</label>
                <input type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: e.target.value})} className="theme-input" placeholder="e.g. 1" />
              </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-8 flex justify-center gap-4 border-t border-gray-100 mt-4">
              <button 
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={saveBannerMutation.isPending} 
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded font-bold uppercase text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {saveBannerMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : "Save Changes"}
              </button>
              
              <button 
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={saveBannerMutation.isPending} 
                className="flex items-center gap-2 bg-gray-800 hover:bg-black text-white px-8 py-2.5 rounded font-bold uppercase text-xs text-nowrap transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {saveBannerMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : "Save & Go Back"}
              </button>

              {/* Cancel Button */}
              <button 
                type="button" 
                onClick={() => navigate('/admin/side-banner-two')} 
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-600 hover:text-red-500 hover:border-red-500 px-6 py-2.5 rounded shadow-sm transition-all text-xs font-bold uppercase tracking-wider"
              >
                <X size={14} /> Cancel
              </button>
          </div>
        </form>
      </div>
      <style>{`.theme-input { width: 100%; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; font-size: 0.85rem; transition: border-color 0.2s; } .theme-input:focus { border-color: #41C9E2; outline: none; }`}</style>
    </div>
  );
};

export default AddEditSideBannerTwo;