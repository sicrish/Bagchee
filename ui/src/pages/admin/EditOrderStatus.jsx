import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const EditOrderStatus = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // URL se ID lene ke liye
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Image ke hisab se sirf 'name' field hai
  const [formData, setFormData] = useState({
    name: '',
  });

  // 1. Fetch Existing Data
  useEffect(() => {
    const fetchStatusData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await axios.get(`${API_URL}/order-status/get/${id}`);
        
        if (res.data.status) {
          setFormData({ name: res.data.data.name });
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load order status details");
        navigate('/admin/order-status');
      } finally {
        setFetching(false);
      }
    };
    fetchStatusData();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Update Logic
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Name is required!");

    setLoading(true);
    const toastId = toast.loading("Updating order status...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      // Update ke liye PATCH/PUT request
      const res = await axios.patch(`${API_URL}/order-status/update/${id}`, formData);

      if (res.data.status) {
        toast.success("Order Status updated successfully! 🔖", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/order-status');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to update", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Reusable Classes
  const inputClass = "w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20 font-body text-text-main";
  const labelClass = "col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";

  if (fetching) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Bar */}
      <div className="bg-primary sticky top-0 z-50 px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Edit Order Status
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
            
            {/* Name Field (Based on image_bfb88c.png) */}
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

export default EditOrderStatus;