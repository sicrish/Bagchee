import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  RotateCcw, TriangleAlert, Upload, Check, ChevronDown, X, Monitor, Smartphone, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { validateImageFiles } from '../../utils/fileValidator';

const AddEditEGiftCardBanner = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const isEditMode = Boolean(id);
  const queryClient = useQueryClient();

  const [isDataInitialized, setIsDataInitialized] = useState(false);

  // States for Desktop & Mobile Images
  const [desktopImage, setDesktopImage] = useState(null); 
  const [desktopPreview, setDesktopPreview] = useState(null);

  const [mobileImage, setMobileImage] = useState(null); 
  const [mobilePreview, setMobilePreview] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    active: 'yes',
    order: ''
  });

  const getFullImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:5000";
      return `${API_BASE}/${path.replace(/^\//, '')}`;
  };

  // Fetch Existing Data
  const { data: bannerData, isLoading: fetching } = useQuery({
    queryKey: ['eGiftCardBannerData', id],
    queryFn: async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/e-gift-card-banner/get/${id}`);
      if (!response.data.status) throw new Error("Failed to fetch banner");
      return response.data.data;
    },
    enabled: isEditMode,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isEditMode && bannerData && !isDataInitialized) {
      setFormData({
        active: bannerData.isActive ? 'yes' : 'no',
        order: bannerData.order || ''
      });
      if (bannerData.desktopImage) setDesktopPreview(getFullImageUrl(bannerData.desktopImage));
      if (bannerData.mobileImage) setMobilePreview(getFullImageUrl(bannerData.mobileImage));
      setIsDataInitialized(true);
    }
  }, [isEditMode, bannerData, isDataInitialized]);

  // Previews logic
  useEffect(() => {
    if (!desktopImage) return;
    const url = URL.createObjectURL(desktopImage);
    setDesktopPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [desktopImage]);

  useEffect(() => {
    if (!mobileImage) return;
    const url = URL.createObjectURL(mobileImage);
    setMobilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [mobileImage]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (payloadData) => {
      const API_URL = process.env.REACT_APP_API_URL;
      const url = isEditMode 
        ? `${API_URL}/e-gift-card-banner/update/${id}` 
        : `${API_URL}/e-gift-card-banner/save`;
      
      const res = await axios({
        method: isEditMode ? 'patch' : 'post',
        url: url,
        data: payloadData,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    }
  });

  const handleSubmit = (e, actionType) => {
    e.preventDefault();

    if (!isEditMode && !desktopImage) return toast.error("Desktop image is required.");
    
    const toastId = toast.loading("Processing...");

    const data = new FormData();
    data.append('isActive', formData.active === 'yes');
    data.append('order', formData.order);
    if (desktopImage) data.append('desktopImage', desktopImage);
    if (mobileImage) data.append('mobileImage', mobileImage);

    saveMutation.mutate(data, {
      onSuccess: (resData) => {
        if (resData.status) {
          toast.success("Success!", { id: toastId });
          queryClient.invalidateQueries(['eGiftCardBannerData']);
          if (actionType === 'back') navigate('/admin/e-gift-card-banner');
        } else {
          toast.error(resData.msg || "Error", { id: toastId });
        }
      },
      onError: (err) => toast.error("Server Error", { id: toastId })
    });
  };

  if (isEditMode && (fetching || !isDataInitialized)) {
    return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={48}/></div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen font-body p-4 md:p-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 max-w-5xl mx-auto overflow-hidden">
        
        <div className="bg-primary px-6 py-4 flex justify-between items-center">
           <h2 className="font-bold text-white text-lg uppercase tracking-wider">
               {isEditMode ? "Edit Gift Card Banner" : "Add Gift Card Banner"}
           </h2>
        </div>

        <form className="p-6 md:p-10 space-y-8">

           {/* DESKTOP VIEW IMAGE */}
           <div className="bg-cream-50/50 p-6 rounded-lg border border-cream-200 relative">
               <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-primary border border-cream-200 rounded uppercase flex items-center gap-1">
                  <Monitor size={12}/> Desktop View
               </div>
               
               <FormRow label="Banner Image">
                  <div className="flex items-center gap-4">
                      <label className="cursor-pointer bg-white border border-dashed border-gray-300 px-4 py-2 rounded-lg text-[11px] font-bold uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2 shadow-sm">
                         <Upload size={14} /> {desktopPreview ? "Change" : "Upload"}
                         <input type="file" className="hidden" onChange={(e) => e.target.files[0] && setDesktopImage(e.target.files[0])} accept="image/*" />
                      </label>

                      {desktopPreview && (
                        <div className="relative group">
                            <img src={desktopPreview} alt="Desktop" className="w-48 h-20 object-cover rounded border shadow-sm" />
                            <button type="button" onClick={() => {setDesktopImage(null); setDesktopPreview(null)}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={12}/></button>
                        </div>
                      )}
                  </div>
               </FormRow>
           </div>

           {/* MOBILE VIEW IMAGE */}
           <div className="bg-cream-50/50 p-6 rounded-lg border border-cream-200 relative">
               <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-accent border border-cream-200 rounded uppercase flex items-center gap-1">
                  <Smartphone size={12}/> Mobile View
               </div>

               <FormRow label="Banner Image">
                  <div className="flex items-center gap-4">
                      <label className="cursor-pointer bg-white border border-dashed border-gray-300 px-4 py-2 rounded-lg text-[11px] font-bold uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2 shadow-sm">
                         <Upload size={14} /> {mobilePreview ? "Change" : "Upload"}
                         <input type="file" className="hidden" onChange={(e) => e.target.files[0] && setMobileImage(e.target.files[0])} accept="image/*" />
                      </label>

                      {mobilePreview && (
                        <div className="relative group">
                            <img src={mobilePreview} alt="Mobile" className="w-20 h-24 object-cover rounded border shadow-sm" />
                            <button type="button" onClick={() => {setMobileImage(null); setMobilePreview(null)}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={12}/></button>
                        </div>
                      )}
                  </div>
               </FormRow>
           </div>

           {/* COMMON SETTINGS */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
               <FormRow label="Active Status">
                  <select name="active" value={formData.active} onChange={handleChange} className="theme-input">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
               </FormRow>

               <FormRow label="Order">
                  <input type="number" name="order" value={formData.order} onChange={handleChange} className="theme-input" placeholder="Priority (e.g. 1)" />
               </FormRow>
           </div>

           {/* BUTTONS */}
           <div className="pt-8 flex justify-center gap-4 border-t">
              <button type="button" onClick={(e) => handleSubmit(e, 'stay')} className="bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded font-bold uppercase text-xs tracking-widest flex items-center gap-2 transition-all">
                <Check size={16}/> {isEditMode ? "Update" : "Save"}
              </button>
              <button type="button" onClick={(e) => handleSubmit(e, 'back')} className="bg-black text-white px-8 py-2.5 rounded font-bold uppercase text-xs tracking-widest flex items-center gap-2 transition-all">
                <RotateCcw size={16}/> {isEditMode ? "Update & Exit" : "Save & Exit"}
              </button>
              <button type="button" onClick={() => navigate('/admin/e-gift-card-banner')} className="border border-gray-300 text-gray-500 px-8 py-2.5 rounded font-bold uppercase text-xs tracking-widest hover:bg-red-50 hover:text-red-500 transition-all">
                Cancel
              </button>
           </div>
        </form>
      </div>

      <style>{`
        .theme-input {
           width: 100%; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; font-size: 0.9rem;
        }
        .theme-input:focus { border-color: #008DDA; outline: none; box-shadow: 0 0 0 3px rgba(0, 141, 218, 0.1); }
      `}</style>
    </div>
  );
};

const FormRow = ({ label, children }) => (
   <div className="grid grid-cols-12 gap-4 items-center pb-2">
      <div className="col-span-12 md:col-span-3 text-left md:text-right">
         <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{label}</label>
      </div>
      <div className="col-span-12 md:col-span-9">{children}</div>
   </div>
);

export default AddEditEGiftCardBanner;