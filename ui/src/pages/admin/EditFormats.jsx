import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';

const EditFormats = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // URL se ID nikalne ke liye
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    status: 'active',
    category_id: '',
    order: ''
  });

  // 🟢 1. Categories aur Single Format Data load karein
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        
        // Parallel requests for Categories and the Format details
        const [catRes, formatRes] = await Promise.all([
          axios.get(`${API_URL}/category/fetch`),
          axios.get(`${API_URL}/formats/get/${id}`) // Backend route verify karein
        ]);

        if (catRes.data.status) setCategories(catRes.data.data);
        
        if (formatRes.data.status) {
          const data = formatRes.data.data;
          setFormData({
            title: data.title || '',
            status: data.status || 'active',
            category_id: data.category_id || '',
            order: data.order || ''
          });
        }
      } catch (error) {
        console.error("Data fetch error:", error);
        toast.error("Failed to load format details");
        navigate('/admin/formats');
      } finally {
        setFetching(false);
      }
    };
    loadInitialData();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔵 2. Update Handle Function
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error("Title is required!");

    setLoading(true);
    const toastId = toast.loading("Updating format...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      // PATCH request for updating existing record
      const res = await axios.patch(`${API_URL}/formats/update/${id}`, formData);

      if (res.data.status) {
        toast.success("Format updated successfully! 🎬", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/formats');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to update", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Bar: bg-primary (#008DDA) */}
      <div className="bg-primary  px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Edit Formats
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200">
             <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">
               Modify Format Information
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
                  className="w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white" 
                />
              </div>
            </div>

            {/* 2. Active Status */}
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

            {/* 3. Category Field */}
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
                  className="w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white" 
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
                <span className="font-bold">Update</span>
              </button>
              
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={loading} 
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                <RotateCcw size={16} className="text-primary"/> 
                <span className="font-bold">Update and go back to list</span>
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

export default EditFormats;