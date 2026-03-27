import React, { useState } from 'react';
import { Save, RotateCcw, X, Check, Loader2 } from 'lucide-react'; // Loader2 add kiya spin ke liye
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query'; // 🟢 React Query Import

const AddCourier = () => {
  const navigate = useNavigate();
  
  // State for form fields
  const [title, setTitle] = useState('');
  const [trackingPage, setTrackingPage] = useState('');
  const [isActive, setIsActive] = useState(true);

  // 🚀 OPTIMIZATION: React Query Mutation for Saving Courier
  const saveCourierMutation = useMutation({
    mutationFn: async (payload) => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/couriers/save`, payload);
      return res.data;
    }
  });

  const handleSubmit = (e, actionType) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) return toast.error("Title is required");
    if (!trackingPage.trim()) return toast.error("Tracking Page URL is required");

    const toastId = toast.loading("Saving courier...");

    // 🟢 DATA OBJECT TAYYAR KAREIN
    const payload = {
      title: title,
      trackingPage: trackingPage,
      isActive: isActive
    };

    // 🟢 Trigger React Query Mutation
    saveCourierMutation.mutate(payload, {
      onSuccess: (resData) => {
        if (resData.status) {
          toast.success("Courier Added Successfully!", { id: toastId });
          if (actionType === 'back') {
            navigate('/admin/couriers');
          } else {
            // Reset form for 'stay' action
            setTitle('');
            setTrackingPage('');
            setIsActive(true);
          }
        } else {
          toast.error(resData.msg || "Failed to save courier", { id: toastId });
        }
      },
      onError: (error) => {
        console.error("Save Error:", error);
        toast.error(error.response?.data?.msg || "Failed to save courier", { id: toastId });
      }
    });
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
            {/* 🟢 Disabled logic bounded to useMutation's isPending */}
            <div className="flex flex-wrap justify-center items-center gap-4 pt-6">
              <button onClick={(e) => handleSubmit(e, 'stay')} disabled={saveCourierMutation.isPending} className="flex items-center bg-white border border-gray-300 text-text-main px-6 py-2 rounded font-bold text-xs uppercase shadow-sm hover:bg-gray-50 disabled:opacity-50">
                {saveCourierMutation.isPending ? <><Loader2 size={16} className="mr-2 animate-spin" /> Processing...</> : <><Check size={16} className="mr-2" /> Save</>}
              </button>
              <button onClick={(e) => handleSubmit(e, 'back')} disabled={saveCourierMutation.isPending} className="flex items-center bg-gray-100 border border-gray-300 text-text-main px-6 py-2 rounded font-bold text-xs uppercase shadow-sm hover:bg-gray-200 disabled:opacity-50">
                <RotateCcw size={16} className="mr-2" /> Save and go back to list
              </button>
              <button onClick={() => navigate('/admin/couriers')} disabled={saveCourierMutation.isPending} className="flex items-center bg-white border border-gray-300 text-gray-600 px-6 py-2 rounded font-bold text-xs uppercase shadow-sm hover:bg-gray-50 disabled:opacity-50">
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