import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const EditLabels = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID from URL
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // Loading state for initial data fetch

  const [formData, setFormData] = useState({
    title: '',
    status: 'active',
    order: ''
  });

  // 🟢 1. Fetch Existing Data (Auto-fill)
  useEffect(() => {
    const fetchLabelData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await axios.get(`${API_URL}/labels/get/${id}`);
        
        if (res.data.status) {
          const data = res.data.data;
          setFormData({
            title: data.title || '',
            status: data.status || 'active',
            order: data.order || ''
          });
        } else {
          toast.error("Label not found");
          navigate('/admin/labels');
        }
      } catch (error) {
        console.error("Error fetching label:", error);
        toast.error("Failed to load label data");
        navigate('/admin/labels');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchLabelData();
    }
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🟢 2. Handle Update
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error("Title is required!");

    setLoading(true);
    const toastId = toast.loading("Updating label...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.patch(`${API_URL}/labels/update/${id}`, formData);

      if (res.data.status) {
        toast.success("Label updated successfully! 🏷️", { id: toastId });
        
        if (actionType === 'back') {
          navigate('/admin/labels');
        }
        // If 'stay', we just keep the updated data in the form
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to update", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Reusable Classes (Exact match)
  const inputClass = "w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20";
  const labelClass = "col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";

  if (fetching) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-cream-50 text-primary">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Bar */}
      <div className="bg-primary sticky top-0 z-50 px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Edit Labels
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200">
             <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">
               Label Information
             </h2>
          </div>

          <div className="p-8 space-y-6">
            
            {/* 1. Title Field */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>
                Title
              </label>
              <div className="col-span-9">
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  className={inputClass}
                  placeholder="Enter label title" 
                />
              </div>
            </div>

            {/* 2. Active Status */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className={labelClass}>
                Active
              </label>
              <div className="col-span-9 space-y-2 pt-2">
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

            {/* 3. Order Field */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>
                Order
              </label>
              <div className="col-span-9">
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
                <span className="font-bold">Update and go back</span>
              </button>

              <button 
                type="button" 
                onClick={() => navigate('/admin/labels')} 
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

export default EditLabels;