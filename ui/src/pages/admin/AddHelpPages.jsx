import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const AddHelpPages = () => {
  const navigate = useNavigate();
  const editor = useRef(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
  });

  const [pageContent, setPageContent] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Title is required!");

    setLoading(true);
    const toastId = toast.loading("Saving help page...");

    try {
      const payload = { ...formData, content: pageContent };
      
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/help-pages/save`, payload);

      if (res.data.status) {
        toast.success("Help Page added successfully! 📘", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/help-pages');
        } else {
          setFormData({ title: '', meta_title: '', meta_description: '', meta_keywords: '' });
          setPageContent('');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to save", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const config = useMemo(() => ({
    readonly: false,
    height: 350,
    theme: "default",
    placeholder: 'Start typing page content...',
    buttons: [
      'source', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
      'superscript', 'subscript', '|', 'ul', 'ol', '|', 'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|', 'image', 'table', 'link', '|',
      'align', 'undo', 'redo', '|', 'hr', 'eraser', 'fullsize'
    ],
  }), []);

  // Reusable Classes
  const inputClass = "w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20 font-body";
  const labelClass = "col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Bar */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Add Help Pages
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200">
             <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">
               Help Page Information
             </h2>
          </div>

          <div className="p-8 space-y-6">
            
            {/* Title Field */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Title</label>
              <div className="col-span-9">
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  className={inputClass}
                  placeholder="Enter page title" 
                />
              </div>
            </div>

            {/* Page Content (Jodit Editor) */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className={labelClass}>Page content</label>
              <div className="col-span-9 border border-gray-300 rounded overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-primary/20">
                <JoditEditor 
                  ref={editor} 
                  value={pageContent} 
                  config={config} 
                  onBlur={newContent => setPageContent(newContent)} 
                />
              </div>
            </div>

            {/* Meta Title */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Meta title</label>
              <div className="col-span-9">
                <input 
                  type="text" 
                  name="meta_title" 
                  value={formData.meta_title} 
                  onChange={handleChange} 
                  className={inputClass}
                />
              </div>
            </div>

            {/* Meta Description */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Meta description</label>
              <div className="col-span-9">
                <input 
                  type="text" 
                  name="meta_description" 
                  value={formData.meta_description} 
                  onChange={handleChange} 
                  className={inputClass}
                />
              </div>
            </div>

            {/* Meta Keywords */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Meta keywords</label>
              <div className="col-span-9">
                <input 
                  type="text" 
                  name="meta_keywords" 
                  value={formData.meta_keywords} 
                  onChange={handleChange} 
                  className={inputClass}
                />
              </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="flex justify-center items-center gap-3 pt-8 border-t mt-10 font-montserrat">
              
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={loading} 
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Check size={16} className="text-green-600"/>} 
                <span className="font-bold">Save</span>
              </button>
              
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={loading} 
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                <RotateCcw size={16} className="text-primary"/> 
                <span className="font-bold">Save and go back to list</span>
              </button>

              <button 
                type="button" 
                onClick={() => navigate('/admin/help-pages')} 
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                <X size={16} className="text-red-600" /> 
                <span className="font-bold">Cancel</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHelpPages;