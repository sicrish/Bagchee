import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';

import toast from 'react-hot-toast';

const AddNavigation = () => {
  const navigate = useNavigate();
  const editor = useRef(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    item: '',
    link: '',
    dropdown: 'inactive',
    active: 'active',
    order: ''
  });

  const [dropdownContent, setDropdownContent] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();

    // 1. Validation (Frontend state check)
    if (!formData.item || !formData.link) {
      return toast.error("Item name and Link are required!");
    }

    setLoading(true);
    const toastId = toast.loading("Saving navigation...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;

      // 🟢 MAIN FIX: Data Mapping for Backend
      // Frontend (item, active) ---> Backend (name, status)
      const finalData = { 
          name: formData.item,       // 'item' ko 'name' banaya
          link: formData.link,
          order: formData.order,
          status: formData.active,   // 'active' ko 'status' banaya
          dropdown: formData.dropdown,
          dropdown_content: dropdownContent 
      };

      const res = await axios.post(`${API_URL}/navigation/save`, finalData);

      if (res.data.status) {
        toast.success("Navigation added successfully! ✨", { id: toastId });
        
        if (actionType === 'back') {
          navigate('/admin/navigation');
        } else {
          // Reset Form (Frontend keys reset karein)
          setFormData({ item: '', link: '', dropdown: 'inactive', active: 'active', order: '' });
          setDropdownContent('');
        }
      }
    } catch (error) {
      console.error("Save Error:", error);
      // Backend se jo error message aa raha hai use dikhayein
      const errorMsg = error.response?.data?.msg || "Failed to save";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const config = useMemo(() => ({
    readonly: false,
    height: 300,
    placeholder: 'Start typing dropdown content...',
    theme: "default",
    buttons: [
      'source', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
      'superscript', 'subscript', '|', 'ul', 'ol', '|', 'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|', 'image', 'table', 'link', '|',
      'align', 'undo', 'redo', '|', 'hr', 'eraser', 'fullsize'
    ],
  }), []);

  return (
    <div className="bg-[#f4f7f6] min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 TOP HEADER BAR (Primary Blue Theme) */}
      <div className="bg-primary  px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-tight font-display">
          Add Navigation
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        {/* Form Container */}
        <form className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          
          {/* Internal Header Strip */}
          <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
             <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider font-montserrat">Navigation Details</h2>
          </div>

          <div className="p-8 space-y-6">
            {/* 1. Item Name */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">
                Item*
              </label>
              <div className="col-span-9">
                <input 
                  name="item" 
                  value={formData.item} 
                  onChange={handleChange} 
                  className="theme-input w-full" 
                  placeholder="e.g. Categories"
                />
              </div>
            </div>

            {/* 2. Link */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">
                Link*
              </label>
              <div className="col-span-9">
                <input 
                  name="link" 
                  value={formData.link} 
                  onChange={handleChange} 
                  className="theme-input w-full" 
                  placeholder="e.g. /shop"
                />
              </div>
            </div>

            {/* 3. Dropdown Radio */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">
                Dropdown
              </label>
              <div className="col-span-9 flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer group font-body">
                  <input 
                    type="radio" 
                    name="dropdown" 
                    value="active" 
                    checked={formData.dropdown === "active"} 
                    onChange={handleChange} 
                    className="accent-primary w-4 h-4 cursor-pointer" 
                  /> 
                  <span className="group-hover:text-primary transition-colors">active</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer group font-body">
                  <input 
                    type="radio" 
                    name="dropdown" 
                    value="inactive" 
                    checked={formData.dropdown === "inactive"} 
                    onChange={handleChange} 
                    className="accent-primary w-4 h-4 cursor-pointer" 
                  /> 
                  <span className="group-hover:text-primary transition-colors">inactive</span>
                </label>
              </div>
            </div>

            {/* 4. Dropdown Content (Editor) */}
            <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-6">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat pt-2">
                Dropdown content
              </label>
              <div className="col-span-9 border rounded-md overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <JoditEditor 
                  ref={editor}
                  value={dropdownContent} 
                  config={config} 
                  onBlur={c => setDropdownContent(c)} 
                />
              </div>
            </div>

            {/* 5. Active Radio */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">
                Active
              </label>
              <div className="col-span-9 flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer group font-body">
                  <input 
                    type="radio" 
                    name="active" 
                    value="active" 
                    checked={formData.active === "active"} 
                    onChange={handleChange} 
                    className="accent-primary w-4 h-4" 
                  /> active
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer group font-body">
                  <input 
                    type="radio" 
                    name="active" 
                    value="inactive" 
                    checked={formData.active === "inactive"} 
                    onChange={handleChange} 
                    className="accent-primary w-4 h-4" 
                  /> inactive
                </label>
              </div>
            </div>

            {/* 6. Order */}
            <div className="grid grid-cols-12 gap-4 items-center pb-6">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">
                Order
              </label>
              <div className="col-span-9">
                <input 
                  name="order" 
                  type="number" 
                  value={formData.order} 
                  onChange={handleChange} 
                  className="theme-input w-full md:w-1/3" 
                  placeholder="e.g. 1"
                />
              </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="flex justify-center items-center gap-4 pt-8 border-t mt-4">
              <button 
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={loading}
                className="flex items-center bg-primary text-white px-8 py-2.5 rounded font-montserrat font-bold text-[10px] uppercase shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                {loading ? <Loader2 size={14} className="animate-spin mr-2"/> : <Check size={14} className="mr-2"/>} 
                Save
              </button>
              
              <button 
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={loading}
                className="flex items-center bg-gray-800 text-white px-8 py-2.5 rounded font-montserrat font-bold text-[10px] uppercase shadow-md hover:bg-gray-900 active:scale-95 transition-all"
              >
                <RotateCcw size={14} className="mr-2"/> Save & Go back to list
              </button>

              <button 
                type="button"
                onClick={() => navigate('/admin/navigation')} 
                className="flex items-center bg-white border border-gray-300 px-8 py-2.5 rounded font-montserrat font-bold text-[10px] uppercase shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-text-main"
              >
                <X size={14} className="mr-2 text-red-600" /> Cancel
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .theme-input { 
          border: 1px solid #d1d5db; 
          border-radius: 4px; 
          padding: 8px 14px; 
          font-size: 13px; 
          outline: none; 
          transition: all 0.2s ease-in-out; 
          background: white;
          font-family: 'Roboto', sans-serif;
        }
        .theme-input:focus { 
          border-color: #008DDA; 
          box-shadow: 0 0 0 3px rgba(0, 141, 218, 0.15); 
        }
        .theme-input::placeholder {
          color: #9ca3af;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default AddNavigation;