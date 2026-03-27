import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const AddOrderStatus = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Based on image_bf5356.png, there is only a 'Name' field.
  const [formData, setFormData] = useState({
    name: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Name is required!");

    setLoading(true);
    const toastId = toast.loading("Saving order status...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      // Adjust the endpoint to match your backend route for Order Status
      const res = await axios.post(`${API_URL}/order-status/save`, formData);

      if (res.data.status) {
        toast.success("Order status added successfully! 🏷️", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/order-status');
        } else {
          setFormData({ name: '' });
        }
      }
    } catch (error) {
      console.error("Save Error:", error);
      toast.error(error.response?.data?.msg || "Failed to save", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Reusable Classes (Consistent with previous components)
  const inputClass = "w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20 font-body text-text-main";
  const labelClass = "col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Bar */}
      <div className="bg-primary sticky top-0 z-50 px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Add Order Status
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200">
             <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">
               Order Status Information
             </h2>
          </div>

          <div className="p-8 space-y-6">
            
            {/* Name Field (Only field visible in image_bf5356.png) */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>
                Name
              </label>
              <div className="col-span-9">
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  className={inputClass}
                  placeholder="Enter status name" 
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
                onClick={() => navigate('/admin/order-status')} 
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

export default AddOrderStatus;