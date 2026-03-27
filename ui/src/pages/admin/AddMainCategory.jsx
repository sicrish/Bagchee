import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, UploadCloud } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const AddMainCategory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Form State matching the Categories Image
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    active: 'Yes', // Default to Yes as per image dropdown
    order: '',
    image: null 
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    
    // Basic Validation
    if (!formData.title) return toast.error("Title is required!");
    if (!formData.link) return toast.error("Link is required!");

    setLoading(true);
    const toastId = toast.loading("Saving category...");

    try {
      // Prepare FormData for file upload
      const data = new FormData();
      data.append('title', formData.title);
      data.append('link', formData.link);
      data.append('active', formData.active);
      data.append('order', formData.order);
      if (formData.image) {
        data.append('image', formData.image);
      }
      

      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/main-categories/save`, data);

      if (res.data.status) {
        toast.success("Category added successfully! 📂", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/main-categories'); // Redirect to your Main Categories list
        } else {
          // Reset Form
          setFormData({ 
            title: '', link: '', active: 'Yes', order: '', image: null 
          });
          setImagePreview(null);
          // Reset file input manually
          const fileInput = document.getElementById('category-file-input');
          if(fileInput) fileInput.value = "";
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to save category", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Responsive Classes (Reused from AddPayments)
  const inputClass = "w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20 font-body";
  
  // Label: Left on mobile, Right on desktop
  const labelClass = "col-span-12 md:col-span-2 text-left md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";
  
  // Input Container: Full width on mobile, 10 columns on desktop
  const colSpanClass = "col-span-12 md:col-span-10";

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Bar */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Add Main Category
        </h1>
        {/* Optional Close Button */}
        <button onClick={() => navigate('/admin/main-categories')} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200">
             <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">
               Category Details
             </h2>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            
            {/* Title Field */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
              <label className={labelClass}>Title</label>
              <div className={colSpanClass}>
                <input 
                    type="text" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    className={inputClass} 
                    placeholder="e.g. Health, Mind & Body" 
                />
              </div>
            </div>

            {/* Image Upload Field */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
              <label className={labelClass}>Image</label>
              <div className={colSpanClass}>
                 <div className="border border-dashed border-gray-300 rounded p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors relative">
                    
                    {/* Preview Image if selected */}
                    {imagePreview ? (
                        <div className="mb-3 relative group">
                            <img src={imagePreview} alt="Preview" className="h-32 w-auto object-cover rounded border border-gray-200 shadow-sm" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                                <span className="text-white text-xs font-bold">Change Image</span>
                            </div>
                        </div>
                    ) : (
                        <UploadCloud size={24} className="text-gray-400 mb-2"/>
                    )}

                    <input 
                      id="category-file-input"
                      type="file" 
                      onChange={handleFileChange} 
                      accept="image/*"
                      className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer w-full text-center" 
                    />
                 </div>
              </div>
            </div>

            {/* Link Field */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
              <label className={labelClass}>Link</label>
              <div className={colSpanClass}>
                <input 
                    type="text" 
                    name="link" 
                    value={formData.link} 
                    onChange={handleChange} 
                    className={inputClass} 
                    placeholder="e.g. /books/health-mind-body" 
                />
              </div>
            </div>

            {/* Active (Dropdown style as per image or Radio) */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
              <label className={labelClass}>Active</label>
              <div className={colSpanClass}>
                <select 
                    name="active" 
                    value={formData.active} 
                    onChange={handleChange} 
                    className={inputClass}
                >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>
              </div>
            </div>

            {/* Order Field */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
              <label className={labelClass}>Order</label>
              <div className={colSpanClass}>
                <input 
                    type="number" 
                    name="order" 
                    value={formData.order} 
                    onChange={handleChange} 
                    className={inputClass} 
                    placeholder="0" 
                />
              </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-8 border-t mt-10 font-montserrat">
              
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={loading} 
                className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Check size={16} className="text-green-600"/>} 
                <span className="font-bold">Update changes</span>
              </button>
              
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={loading} 
                className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <RotateCcw size={16} className="text-primary"/> 
                <span className="font-bold">Update and go back to list</span>
              </button>

              <button 
                type="button" 
                onClick={() => navigate('/admin/main-categories')} 
                className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
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

export default AddMainCategory;