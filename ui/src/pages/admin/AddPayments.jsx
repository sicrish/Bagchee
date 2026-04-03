import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, UploadCloud } from 'lucide-react';
import JoditEditor from '../../components/admin/LazyJoditEditor';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const AddPayments = () => {
  const navigate = useNavigate();
  const editor = useRef(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    status: 'active',
    order: '',
    additional_text_status: 'active',
    image: null 
  });

  const [additionalText, setAdditionalText] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0]; // 🟢 Fixed: Defined 'file'
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file)); // 📸 Create Preview URL
    }
  };
  

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Title is required!");

    setLoading(true);
    const toastId = toast.loading("Saving payment option...");

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('status', formData.status);
      data.append('order', formData.order);
      data.append('additional_text', additionalText);
      data.append('additional_text_status', formData.additional_text_status);
      if (formData.image) {
        data.append('image', formData.image);
      }

      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/payments/save`, data); // Axios handles multipart automatically

      if (res.data.status) {
        toast.success("Payment option added successfully! 💳", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/payments');
        } else {
          setFormData({ 
            title: '', status: 'active', order: '', 
            additional_text_status: 'active', image: null 
          });
          setAdditionalText('');
          // Reset file input manually if needed
          const fileInput = document.getElementById('payment-file-input');
          if(fileInput) fileInput.value = "";
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to save", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Jodit Config
  // Jodit Config (Responsive)
  const config = useMemo(() => ({
    readonly: false,
    height: 200,
    width: '100%', // 🟢 FORCE WIDTH
    theme: "default",
    placeholder: '',
    toolbar: true,
    toolbarSticky: false, // 🟢 DISABLE STICKY (Fixes mobile scrolling issues)
    showCharsCounter: false, // Optional: Saves space on mobile
    showWordsCounter: false, // Optional: Saves space on mobile
    showXPathInStatusbar: false, // Optional: Hides path bar for cleaner UI
    buttons: [
      'source', '|', 'bold', 'italic', 'underline', '|', 
      'ul', 'ol', '|', 'font', 'fontsize', 'brush', '|',
      'image', 'table', 'link', '|', 'align', 'undo', 'redo', '|', 
      'hr', 'eraser', 'fullsize'
    ],
    // 🟢 Fix for text color/bg sometimes not rendering correctly on mobile
    style: {
      background: '#ffffff',
      color: '#000000'
    }
  }), []);

  // 🟢 Responsive Classes
  const inputClass = "w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20 font-body";
  
  // Label: Left aligned on mobile, Right aligned on desktop (md)
  const labelClass = "col-span-12 md:col-span-3 text-left md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";
  
  // Input Container: Full width on mobile, 9 columns on desktop
  const colSpanClass = "col-span-12 md:col-span-9";

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Bar */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Add Payments
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200">
             <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">
               Payment Information
             </h2>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            
            {/* Title */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
              <label className={labelClass}>Title</label>
              <div className={colSpanClass}>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="e.g. Credit Card" />
              </div>
            </div>

            {/* Active (Radio Buttons) */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start">
              <label className={labelClass}>Active</label>
              <div className={`${colSpanClass} pt-0 md:pt-2 space-y-2`}>
                <div className="flex items-center gap-2">
                  <input type="radio" id="active" name="status" value="active" checked={formData.status === 'active'} onChange={handleChange} className="accent-primary" />
                  <label htmlFor="active" className="text-sm cursor-pointer">active</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="radio" id="inactive" name="status" value="inactive" checked={formData.status === 'inactive'} onChange={handleChange} className="accent-primary" />
                  <label htmlFor="inactive" className="text-sm cursor-pointer">inactive</label>
                </div>
              </div>
            </div>

            {/* Order */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
              <label className={labelClass}>Order</label>
              <div className={colSpanClass}>
                <input type="number" name="order" value={formData.order} onChange={handleChange} className={inputClass} placeholder="0" />
              </div>
            </div>

            {/* Additional Text (Editor) */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start">
              <label className={labelClass}>Additional text</label>
              <div className={`${colSpanClass} border border-gray-300 rounded overflow-hidden shadow-sm w-full max-w-full`}>
                <JoditEditor 
                  ref={editor} 
                  value={additionalText} 
                  config={config} 
                  onBlur={newContent => setAdditionalText(newContent)} 
                />
              </div>
            </div>

            {/* Additional Text Active */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start">
              <label className={labelClass}>Additional text active</label>
              <div className={`${colSpanClass} pt-0 md:pt-2 space-y-2`}>
                <div className="flex items-center gap-2">
                  <input type="radio" id="text_active" name="additional_text_status" value="active" checked={formData.additional_text_status === 'active'} onChange={handleChange} className="accent-primary" />
                  <label htmlFor="text_active" className="text-sm cursor-pointer">active</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="radio" id="text_inactive" name="additional_text_status" value="inactive" checked={formData.additional_text_status === 'inactive'} onChange={handleChange} className="accent-primary" />
                  <label htmlFor="text_inactive" className="text-sm cursor-pointer">inactive</label>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
              <label className={labelClass}>Image</label>
              <div className={colSpanClass}>
                 <div className="border border-dashed border-gray-300 rounded p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                    <UploadCloud size={24} className="text-gray-400 mb-2"/>
                    <input 
                      id="payment-file-input"
                      type="file" 
                      onChange={handleFileChange} 
                      accept="image/*"
                      className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer w-full" 
                    />
                 </div>
              </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            {/* 🟢 Responsive Buttons: Stack on mobile, Row on Desktop */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-8 border-t mt-10 font-montserrat">
              
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={loading} 
                className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Check size={16} className="text-green-600"/>} 
                <span className="font-bold">Save</span>
              </button>
              
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={loading} 
                className="w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <RotateCcw size={16} className="text-primary"/> 
                <span className="font-bold">Save and go back to list</span>
              </button>

              <button 
                type="button" 
                onClick={() => navigate('/admin/payments')} 
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

export default AddPayments;