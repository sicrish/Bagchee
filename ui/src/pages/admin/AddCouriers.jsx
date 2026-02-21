import React, { useState } from 'react';
import { Save, RotateCcw, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const AddCourier = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // State for form fields
  const [title, setTitle] = useState('');
  const [trackingPage, setTrackingPage] = useState(''); // 🟢 State ka naam
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) return toast.error("Title is required");
    if (!trackingPage.trim()) return toast.error("Tracking Page URL is required");

    setLoading(true);
    const toastId = toast.loading("Saving courier...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      
      // 🟢 1. DATA OBJECT TAYYAR KAREIN
      // Dhyan dein: Backend ko 'trackingPage' chahiye (camelCase)
      const payload = {
        title: title,
        trackingPage: trackingPage, // ✅ Yahan galti hoti hai aksar
        isActive: isActive
      };

      console.log("Sending Data:", payload); // Debugging ke liye

      const res = await axios.post(`${API_URL}/couriers/save`, payload);

      if (res.data.status) {
        toast.success("Courier Added Successfully!", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/couriers');
        } else {
          // Reset form
          setTitle('');
          setTrackingPage('');
          setIsActive(true);
        }
      }
    } catch (error) {
      console.error("Save Error:", error);
      toast.error(error.response?.data?.msg || "Failed to save courier", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main">
      <div className="bg-primary text-white border-b px-6 py-3 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-bold text-gray-700 uppercase tracking-tight">Add Couriers</h1>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-8 space-y-6">
            
            {/* Title Input */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
              <label className="col-span-12 md:col-span-2 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Title</label>
              <div className="col-span-12 md:col-span-10">
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Tracking Page URL Input */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
              <label className="col-span-12 md:col-span-2 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Tracking page</label>
              <div className="col-span-12 md:col-span-10">
                <input 
                  type="text" 
                  value={trackingPage}
                  onChange={(e) => setTrackingPage(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="https://www.google.com/search?q="
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
              <label className="col-span-12 md:col-span-2 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Active</label>
              <div className="col-span-12 md:col-span-10 flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input 
                    type="radio" 
                    name="active" 
                    checked={isActive === true} 
                    onChange={() => setIsActive(true)}
                    className="accent-primary" 
                  /> active
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input 
                    type="radio" 
                    name="active" 
                    checked={isActive === false} 
                    onChange={() => setIsActive(false)}
                    className="accent-primary" 
                  /> inactive
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center items-center gap-4 pt-6">
              <button onClick={(e) => handleSubmit(e, 'stay')} disabled={loading} className="flex items-center bg-white border border-gray-300 text-text-main px-6 py-2 rounded font-bold text-xs uppercase shadow-sm hover:bg-gray-50">
                {loading ? "Processing..." : <><Check size={16} className="mr-2" /> Save</>}
              </button>
              <button onClick={(e) => handleSubmit(e, 'back')} disabled={loading} className="flex items-center bg-gray-100 border border-gray-300 text-text-main px-6 py-2 rounded font-bold text-xs uppercase shadow-sm hover:bg-gray-200">
                <RotateCcw size={16} className="mr-2" /> Save and go back to list
              </button>
              <button onClick={() => navigate('/admin/couriers')} className="flex items-center bg-white border border-gray-300 text-gray-600 px-6 py-2 rounded font-bold text-xs uppercase shadow-sm hover:bg-gray-50">
                <X size={16} className="mr-2" /> Cancel
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCourier;