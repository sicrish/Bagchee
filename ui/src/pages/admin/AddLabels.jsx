import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query'; // 🟢 React Query Import

const AddLabels = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    status: 'active', // Default value as per image (active checked)
    order: ''
  });

  // 🚀 OPTIMIZATION: Save Label Mutation
  const saveLabelMutation = useMutation({
    mutationFn: async (submitData) => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/labels/save`, submitData);
      return res.data;
    }
  });

  // Safe and optimized handler
  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  // 🟢 Handle Submit
  const handleSubmit = (e, actionType) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Title is required!");

    const toastId = toast.loading("Saving label...");

    saveLabelMutation.mutate(formData, {
      onSuccess: (resData) => {
        if (resData.status) {
          toast.success("Label added successfully! 🏷️", { id: toastId });
          if (actionType === 'back') {
            navigate('/admin/labels');
          } else {
            // Reset form completely if staying on page
            setFormData({ title: '', status: 'active', order: '' });
          }
        } else {
          toast.error(resData.msg || "Failed to save", { id: toastId });
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.msg || "Failed to save", { id: toastId });
      }
    });
  };

  // Reusable Classes (Exact match as requested)
  const inputClass = "w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20";
  const labelClass = "col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Bar */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Add Labels
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden" onSubmit={(e) => e.preventDefault()}>
          
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
            {/* 🟢 Bound dynamically to saveLabelMutation.isPending */}
            <div className="flex justify-center items-center gap-3 pt-8 border-t mt-10 font-montserrat">
              
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={saveLabelMutation.isPending} 
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm disabled:opacity-70"
              >
                {saveLabelMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <Check size={16} className="text-green-600"/>} 
                <span className="font-bold">Save</span>
              </button>
              
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={saveLabelMutation.isPending} 
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm disabled:opacity-70"
              >
                {saveLabelMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <RotateCcw size={16} className="text-primary"/>} 
                <span className="font-bold">Save and go back to list</span>
              </button>

              <button 
                type="button" 
                onClick={() => navigate('/admin/labels')} 
                disabled={saveLabelMutation.isPending}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm disabled:opacity-70"
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

export default AddLabels;