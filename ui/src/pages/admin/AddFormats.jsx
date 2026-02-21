import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';

const AddFormats = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]); // Category dropdown ke liye

  const [formData, setFormData] = useState({
    title: '',
    status: 'active', // Default value based on image radio buttons
    category_id: '',
    order: ''
  });

  // 🟢 1. Categories load karein (Dropdown ke liye)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await axios.get(`${API_URL}/category/fetch`);
        if (res.data.status) {
          setCategories(res.data.data);
        }
      } catch (error) {
        console.error("Categories fetch error");
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Title is required!");

    setLoading(true);
    const toastId = toast.loading("Saving format...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/formats/save`, formData);

      if (res.data.status) {
        toast.success("Format added successfully! 🎬", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/formats');
        } else {
          setFormData({ title: '', status: 'active', category_id: '', order: '' });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to save", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Bar: bg-primary (#008DDA) aur font-display (Outfit) */}
      <div className="bg-primary  px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Add Formats
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200">
             <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">
               Format Information
             </h2>
          </div>

          <div className="p-8 space-y-6">
            {/* 1. Title Field */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">
                Title
              </label>
              <div className="col-span-9">
                <input 
                  type="text"
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  placeholder="Enter format title"
                  className="w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white" 
                />
              </div>
            </div>

            {/* 2. Active Status (Radio Buttons as per image_74986e.png) */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-1">
                Active
              </label>
              <div className="col-span-9 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="status" 
                    value="active" 
                    checked={formData.status === 'active'}
                    onChange={handleChange}
                    className="accent-primary h-4 w-4"
                  />
                  <span className="text-[13px] text-text-main group-hover:text-primary transition-colors">active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="status" 
                    value="inactive" 
                    checked={formData.status === 'inactive'}
                    onChange={handleChange}
                    className="accent-primary h-4 w-4"
                  />
                  <span className="text-[13px] text-text-main group-hover:text-primary transition-colors">inactive</span>
                </label>
              </div>
            </div>

            {/* 3. Category Field (Dropdown) */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">
                Category
              </label>
              <div className="col-span-9">
                <select 
                  name="category_id" 
                  value={formData.category_id} 
                  onChange={handleChange} 
                  className="w-1/3 border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white text-gray-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.categorytitle}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Order Field */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">
                Order
              </label>
              <div className="col-span-9">
                <input 
                  type="number"
                  name="order" 
                  value={formData.order} 
                  onChange={handleChange} 
                  placeholder="0"
                  className="w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white" 
                />
              </div>
            </div>

            {/* --- ACTION BUTTONS (As per Image Layout) --- */}
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
                onClick={() => navigate('/admin/formats')} 
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

export default AddFormats;