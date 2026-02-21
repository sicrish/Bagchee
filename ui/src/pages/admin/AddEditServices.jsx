import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, Save } from 'lucide-react';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const AddEditServices = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // ID check for Edit mode
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

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

  // 🟢 1. Load Data for Edit Mode
  useEffect(() => {
    if (isEdit) {
      const fetchServiceData = async () => {
        try {
          const API_URL = process.env.REACT_APP_API_URL;
          const res = await axios.get(`${API_URL}/services/get/${id}`);
          if (res.data.status) {
            const d = res.data.data;
            setFormData({
              title: d.title || '',
              page_title: d.page_title || '',
              meta_title: d.meta_title || '',
              meta_description: d.meta_description || '',
              meta_keywords: d.meta_keywords || '',
            });
            setBoxDescription(d.box_description || '');
            setPageContent(d.page_content || '');
          }
        } catch (error) {
          toast.error("Failed to fetch service details");
        } finally {
          setInitialLoading(false);
        }
      };
      fetchServiceData();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🟢 2. Handle Submit (Save / Update)
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Title is required!");

    setLoading(true);
    const toastId = toast.loading(isEdit ? "Updating service..." : "Saving service...");

    try {
      const payload = { 
        ...formData, 
        box_description: boxDescription, 
        page_content: pageContent 
      };
      
      const API_URL = process.env.REACT_APP_API_URL;
      const res = isEdit 
        ? await axios.put(`${API_URL}/services/update/${id}`, payload)
        : await axios.post(`${API_URL}/services/save`, payload);

      if (res.data.status) {
        toast.success(isEdit ? "Service updated!" : "Service added!", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/services');
        } else if (!isEdit) {
          // Reset form only if adding new
          setFormData({ title: '', page_title: '', meta_title: '', meta_description: '', meta_keywords: '' });
          setBoxDescription('');
          setPageContent('');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Operation failed", { id: toastId });
    } finally {
      setLoading(false);
    }
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

  if (initialLoading) return <div className="min-h-screen flex items-center justify-center bg-cream-50"><Loader2 className="animate-spin text-primary" size={32} /></div>;

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
            <div className="flex flex-wrap justify-center items-center gap-4 pt-8 border-t">
              <button 
                type="button" onClick={(e) => handleSubmit(e, 'stay')} disabled={loading}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-8 py-2.5 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Check size={16} className="text-green-600"/>} 
                Update changes
              </button>
              
              <button 
                type="button" onClick={(e) => handleSubmit(e, 'back')} disabled={loading}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-8 py-2.5 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                <RotateCcw size={16} className="text-primary"/> Update and go back to list
              </button>

              <button 
                type="button" onClick={() => navigate('/admin/services')}
                className="bg-white border border-gray-300 hover:bg-red-50 text-text-main px-8 py-2.5 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
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