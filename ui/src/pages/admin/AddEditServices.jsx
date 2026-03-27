import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // 🟢 React Query Imports

const AddEditServices = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // ID check for Edit mode
  const queryClient = useQueryClient();

  const isEdit = Boolean(id);
  const [isDataInitialized, setIsDataInitialized] = useState(false); // 🟢 Prevents continuous re-renders

  // 🟢 Form States based on Image fields
  const [formData, setFormData] = useState({
    title: '',
    page_title: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
  });

  const [boxDescription, setBoxDescription] = useState('');
  const [pageContent, setPageContent] = useState('');

  // 🚀 OPTIMIZATION 1: Fetch Existing Data using useQuery
  const { data: serviceData, isLoading: fetching } = useQuery({
    queryKey: ['serviceDetails', id],
    queryFn: async () => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/services/get/${id}`);
      if (!res.data.status) throw new Error("Failed to fetch data");
      return res.data.data;
    },
    enabled: isEdit, // Sirf Edit Mode me run karega
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
    refetchOnWindowFocus: false, // Window switch karne par overwrite rokne ke liye
    onError: (error) => {
      console.error(error);
      toast.error("Failed to fetch service details");
      navigate('/admin/services');
    }
  });

  // 🟢 Populate State Once
  useEffect(() => {
    if (isEdit && serviceData && !isDataInitialized) {
      setFormData({
        title: serviceData.title || '',
        page_title: serviceData.pageTitle || '',
        meta_title: serviceData.metaTitle || '',
        meta_description: serviceData.metaDesc || '',
        meta_keywords: serviceData.metaKeywords || '',
      });
      setBoxDescription(serviceData.boxDesc || '');
      setPageContent(serviceData.pageContent || '');
      
      setIsDataInitialized(true); // Lock the initialization
    }
  }, [isEdit, serviceData, isDataInitialized]);

  // Safe handler
  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  // 🚀 OPTIMIZATION 2: Unified Mutation for Save & Update
  const saveServiceMutation = useMutation({
    mutationFn: async (payload) => {
      const API_URL = process.env.REACT_APP_API_URL;
      if (isEdit) {
        
        const res = await axios.patch(`${API_URL}/services/update/${id}`, payload);
        return res.data;
      } else {
        const res = await axios.post(`${API_URL}/services/save`, payload);
        return res.data;
      }
    }
  });

  // 🟢 Handle Submit
  const handleSubmit = (e, actionType) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Title is required!");

    const toastId = toast.loading(isEdit ? "Updating service..." : "Saving service...");

    const payload = { 
      ...formData, 
      box_description: boxDescription, 
      page_content: pageContent 
    };

    saveServiceMutation.mutate(payload, {
      onSuccess: (resData) => {
        if (resData.status) {
          toast.success(isEdit ? "Service updated!" : "Service added!", { id: toastId });
          
          if (isEdit) {
            // Update ho gaya, ab cache refresh kar do taaki naya data dikhe
            queryClient.invalidateQueries({ queryKey: ['serviceDetails', id] });
          }

          if (actionType === 'back') {
            navigate('/admin/services');
          } else if (!isEdit) {
            // Sirf "Add" me clear karna hai agar wahi page par rukna ho
            setFormData({ title: '', page_title: '', meta_title: '', meta_description: '', meta_keywords: '' });
            setBoxDescription('');
            setPageContent('');
          }
        } else {
          toast.error(resData.msg || "Operation failed", { id: toastId });
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.msg || "Operation failed", { id: toastId });
      }
    });
  };

  // Editor Config
  const config = useMemo(() => ({
    readonly: false,
    height: 250,
    theme: "default",
    buttons: ['source', '|', 'bold', 'italic', 'underline', '|', 'ul', 'ol', '|', 'font', 'fontsize', 'brush', 'paragraph', '|', 'image', 'table', 'link', '|', 'align', 'undo', 'redo']
  }), []);

  // Shared Tailwind Classes
  const inputClass = "w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20 font-body";
  const labelClass = "col-span-12 md:col-span-2 text-left md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";

  // Full Page Loader for Edit Mode Setup
  if (isEdit && (fetching || !isDataInitialized)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Section */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between text-white font-display font-bold uppercase tracking-widest">
        <h1>{isEdit ? 'Edit Services' : 'Add New Service'}</h1>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 md:p-6 mt-2">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="p-6 md:p-10 space-y-8">
            
            {/* Title */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Title</label>
              <div className="col-span-12 md:col-span-10">
                <input name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="e.g. Approval Plans" />
              </div>
            </div>

            {/* Box Description (Rich Editor) */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className={labelClass}>Box description</label>
              <div className="col-span-12 md:col-span-10 border rounded overflow-hidden">
                <JoditEditor value={boxDescription} config={config} onBlur={c => setBoxDescription(c)} />
              </div>
            </div>

            {/* Page Content (Rich Editor) */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className={labelClass}>Page content</label>
              <div className="col-span-12 md:col-span-10 border rounded overflow-hidden">
                <JoditEditor value={pageContent} config={{...config, height: 400}} onBlur={c => setPageContent(c)} />
              </div>
            </div>

            {/* Page Title */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Page title</label>
              <div className="col-span-12 md:col-span-10">
                <input name="page_title" value={formData.page_title} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* Meta Title */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Meta title</label>
              <div className="col-span-12 md:col-span-10">
                <input name="meta_title" value={formData.meta_title} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* Meta Description */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Meta description</label>
              <div className="col-span-12 md:col-span-10">
                <input name="meta_description" value={formData.meta_description} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* Meta Keywords */}
            <div className="grid grid-cols-12 gap-4 items-center pb-4">
              <label className={labelClass}>Meta keywords</label>
              <div className="col-span-12 md:col-span-10">
                <input name="meta_keywords" value={formData.meta_keywords} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            {/* 🟢 Bound to saveServiceMutation.isPending dynamically */}
            <div className="flex flex-wrap justify-center items-center gap-4 pt-8 border-t">
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={saveServiceMutation.isPending}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-8 py-2.5 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {saveServiceMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <Check size={16} className="text-green-600"/>} 
                {isEdit ? "Update changes" : "Save changes"}
              </button>
              
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={saveServiceMutation.isPending}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-8 py-2.5 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {saveServiceMutation.isPending ? <Loader2 size={16} className="animate-spin"/> : <RotateCcw size={16} className="text-primary"/>} 
                {isEdit ? "Update and go back" : "Save and go back"}
              </button>

              <button 
                type="button" 
                onClick={() => navigate('/admin/services')}
                disabled={saveServiceMutation.isPending}
                className="bg-white border border-gray-300 hover:bg-red-50 text-text-main px-8 py-2.5 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <X size={16} className="text-red-600" /> Cancel
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditServices;