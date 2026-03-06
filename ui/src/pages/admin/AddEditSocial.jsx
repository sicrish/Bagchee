import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, UploadCloud } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // 🟢 React Query Imports
import { validateImageFiles } from '../../utils/fileValidator'; // 🟢 Validation Helper

const AddSocial = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // 🟢 Check for Edit Mode
  const isEdit = Boolean(id); // True if editing
  const queryClient = useQueryClient();

  // 🟢 Prevent continuous state overwrite during typing
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    order: '',
    icon_image: null,
    
    // Flags (Default strings for Radio logic)
    isActive: 'true',
    isShareActive: 'false',
    showInFooter: 'true',
    showInProduct: 'false',
    showInCategory: 'false'
  });

  // 🚀 OPTIMIZATION 1: Fetch Existing Data with React Query
  const { data: socialData, isLoading: fetching } = useQuery({
    queryKey: ['socialData', id],
    queryFn: async () => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/socials/get/${id}`);
      if (!res.data.status) throw new Error("Failed to load data");
      return res.data.data;
    },
    enabled: isEdit, // Run only in edit mode
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
    refetchOnWindowFocus: false, // Prevent auto-refresh overwrite
    onError: (error) => {
      console.error(error);
      toast.error("Failed to load data");
      navigate('/admin/socials');
    }
  });

  // 🟢 1. Initialize State ONCE when data arrives
  useEffect(() => {
    if (isEdit && socialData && !isDataInitialized) {
      const d = socialData;
      setFormData({
        title: d.title || '',
        link: d.link || '',
        order: d.order || '',
        isActive: d.isActive ? 'true' : 'false',
        isShareActive: d.isShareActive ? 'true' : 'false',
        showInFooter: d.showInFooter ? 'true' : 'false',
        showInProduct: d.showInProduct ? 'true' : 'false',
        showInCategory: d.showInCategory ? 'true' : 'false',
        icon_image: null 
      });

      // Set Preview from Server
      if (d.icon_image) {
          const imgUrl = d.icon_image.startsWith('http') 
              ? d.icon_image 
              : `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${d.icon_image}`;
          setImagePreview(imgUrl);
      }
      
      setIsDataInitialized(true); // Lock it!
    }
  }, [isEdit, socialData, isDataInitialized]);

  // Safe handler using useCallback
  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  // 🟢 Image Handler with Validation
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (validateImageFiles(file)) {
        setFormData({ ...formData, icon_image: file });
        setImagePreview(URL.createObjectURL(file));
      } else {
        e.target.value = ""; // Reset input if validation fails
      }
    }
  };

  // 🚀 OPTIMIZATION 2: Unified Save/Update Mutation
  const saveSocialMutation = useMutation({
    mutationFn: async (payloadData) => {
      const API_URL = process.env.REACT_APP_API_URL;
      if (isEdit) {
         // Using PUT to match your original logic
         const res = await axios.put(`${API_URL}/socials/update/${id}`, payloadData, {
             headers: { 'Content-Type': 'multipart/form-data' }
         });
         return res.data;
      } else {
         const res = await axios.post(`${API_URL}/socials/save`, payloadData, {
             headers: { 'Content-Type': 'multipart/form-data' }
         });
         return res.data;
      }
    }
  });

  // 🟢 2. DYNAMIC SUBMIT (Add vs Update)
  const handleSubmit = (e, actionType) => {
    e.preventDefault();
    if (!formData.title || !formData.link) return toast.error("Title and Link are required!");
    // Edit mode mein image optional hai, Add mein required
    if (!isEdit && !formData.icon_image && !imagePreview) return toast.error("Icon image is required!");

    const toastId = toast.loading(isEdit ? "Updating..." : "Saving...");

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key !== 'icon_image') data.append(key, formData[key]);
    });
    
    // Append Image only if new one selected
    if (formData.icon_image) {
      data.append('icon_image', formData.icon_image);
    }

    saveSocialMutation.mutate(data, {
      onSuccess: (resData) => {
        if (resData.status) {
          toast.success(isEdit ? "Updated successfully!" : "Added successfully!", { id: toastId });
          
          if (isEdit) {
            queryClient.invalidateQueries({ queryKey: ['socialData', id] });
          }

          if (actionType === 'back') {
            navigate('/admin/socials');
          } else if (!isEdit) {
             // Reset only if adding new and staying on page
             setFormData({
                 title: '', link: '', order: '', icon_image: null,
                 isActive: 'true', isShareActive: 'false', showInFooter: 'true',
                 showInProduct: 'false', showInCategory: 'false'
             });
             setImagePreview(null);
             const fileInput = document.getElementById('social-file-input');
             if(fileInput) fileInput.value = "";
          }
        } else {
          toast.error(resData.msg || "Operation Failed", { id: toastId });
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.msg || "Operation Failed", { id: toastId });
      }
    });
  };

  // Common Styles
  const inputClass = "w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20 font-body";
  const labelClass = "col-span-12 md:col-span-3 text-left md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";
  const colSpanClass = "col-span-12 md:col-span-9";

  // 🟢 Fixed Radio Group Helper (Solves focus losing bug on re-render)
  const renderRadioGroup = (label, name, value) => (
    <div className="grid grid-cols-12 gap-2 md:gap-4 items-start border-b border-gray-50 pb-4">
      <label className={labelClass}>{label}</label>
      <div className={`${colSpanClass} pt-0 md:pt-2 space-y-2`}>
        <div className="flex gap-6">
            <div className="flex items-center gap-2">
            <input type="radio" id={`${name}_active`} name={name} value="true" checked={value === 'true'} onChange={handleChange} className="accent-primary" />
            <label htmlFor={`${name}_active`} className="text-sm cursor-pointer">Active</label>
            </div>
            <div className="flex items-center gap-2">
            <input type="radio" id={`${name}_inactive`} name={name} value="false" checked={value === 'false'} onChange={handleChange} className="accent-primary" />
            <label htmlFor={`${name}_inactive`} className="text-sm cursor-pointer">Inactive</label>
            </div>
        </div>
      </div>
    </div>
  );

  // Full Screen Loader for Edit Mode Setup
  if (isEdit && (fetching || !isDataInitialized)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* Header */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
            {isEdit ? "Edit Social Media" : "Add Social Media"}
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden" onSubmit={(e) => e.preventDefault()}>
          
          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200">
             <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">Social Information</h2>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            
            {/* Title */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-center border-b border-gray-50 pb-4">
              <label className={labelClass}>Title</label>
              <div className={colSpanClass}>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="e.g. Facebook" />
              </div>
            </div>

            {/* Link */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-center border-b border-gray-50 pb-4">
              <label className={labelClass}>Link</label>
              <div className={colSpanClass}>
                <input type="text" name="link" value={formData.link} onChange={handleChange} className={inputClass} placeholder="https://facebook.com/page" />
              </div>
            </div>

            {/* Order */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-center border-b border-gray-50 pb-4">
              <label className={labelClass}>Sort Order</label>
              <div className={colSpanClass}>
                <input type="number" name="order" value={formData.order} onChange={handleChange} className={inputClass} placeholder="0" />
              </div>
            </div>

            {/* Image Upload */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start md:items-center border-b border-gray-50 pb-4">
              <label className={labelClass}>Icon Image</label>
              <div className={colSpanClass}>
                 <div className="border border-dashed border-gray-300 rounded p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors relative">
                    {imagePreview ? (
                        <div className="relative group">
                            <img src={imagePreview} alt="Preview" className="h-16 object-contain mb-2" />
                            <button type="button" onClick={() => {setImagePreview(null); setFormData({...formData, icon_image: null})}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><X size={12}/></button>
                        </div>
                    ) : (
                        <UploadCloud size={24} className="text-gray-400 mb-2"/>
                    )}
                    <input id="social-file-input" type="file" onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer w-full" />
                 </div>
              </div>
            </div>

            {/* Flags */}
            {renderRadioGroup("Share", "isShareActive", formData.isShareActive)}
            {renderRadioGroup("Active", "isActive", formData.isActive)}
            {renderRadioGroup("Show in Product", "showInProduct", formData.showInProduct)}
            {renderRadioGroup("Show in Category", "showInCategory", formData.showInCategory)}
            {renderRadioGroup("Show in Footer", "showInFooter", formData.showInFooter)}

            {/* Action Buttons */}
            {/* 🟢 Bound dynamically to saveSocialMutation.isPending */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-8 border-t mt-10">
              <button type="button" onClick={(e) => handleSubmit(e, 'stay')} disabled={saveSocialMutation.isPending} className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
                {saveSocialMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <Check size={16} className="text-green-600"/>} 
                {isEdit ? "Update" : "Save"}
              </button>
              
              <button type="button" onClick={(e) => handleSubmit(e, 'back')} disabled={saveSocialMutation.isPending} className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
                <RotateCcw size={16} className="text-primary"/> 
                {isEdit ? "Update and go back" : "Save and go back"}
              </button>

              <button type="button" onClick={() => navigate('/admin/socials')} disabled={saveSocialMutation.isPending} className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
                <X size={16} className="text-red-600" /> Cancel
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSocial;