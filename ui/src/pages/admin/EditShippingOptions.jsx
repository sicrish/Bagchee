import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const EditShippingOptions = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // URL se ID nikalne ke liye
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    max_day_limit: '',
    price_usd: '',
    price_eur: '',
    price_inr: '',
    active: '',
    order: ''
  });

  // 🟢 1. Fetch Existing Data for Auto-fill

useEffect(() => {
  const fetchOptionData = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/shipping-options/get/${id}`);
      
      if (res.data.status) {
        const data = res.data.data;
        
        // 🟢 FIX: Map Database Keys (camelCase) to State Keys (snake_case)
        setFormData({
          title: data.title || '',
          
          // Database bhejega 'maxDayLimit', State maang raha hai 'max_day_limit'
          max_day_limit: data.maxDayLimit || '', 
          
          price_usd: data.priceUsd || '',
          price_eur: data.priceEur || '',
          price_inr: data.priceInr || '',
          
          // Boolean to String conversion for Select Dropdown
          active: data.active ? 'yes' : 'no',

          order: data.ord !== undefined ? data.ord : ''
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load shipping data");
      navigate('/admin/shipping-options');
    } finally {
      setFetching(false);
    }
  };
  fetchOptionData();
}, [id, navigate]);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔵 2. Handle Update Submit
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Title is required!");

    setLoading(true);
    const toastId = toast.loading("Updating shipping option...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.patch(`${API_URL}/shipping-options/update/${id}`, formData);

      if (res.data.status) {
        toast.success("Shipping option updated successfully! 🚢", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/shipping-options');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Update failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20 font-body";
  const labelClass = "col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";

  if (fetching) {
    return (
      <div className="h-screen flex items-center justify-center bg-cream-50">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Edit Shipping option
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200">
             <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">
               Shipping Option Information
             </h2>
          </div>

          <div className="p-8 space-y-6">
            
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Title*</label>
              <div className="col-span-9">
                <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Max day limit</label>
              <div className="col-span-9">
                <input type="text" name="max_day_limit" value={formData.max_day_limit} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Price usd</label>
              <div className="col-span-9">
                <input type="number" name="price_usd" value={formData.price_usd} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Price eur</label>
              <div className="col-span-9">
                <input type="number" name="price_eur" value={formData.price_eur} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Price inr</label>
              <div className="col-span-9">
                <input type="number" name="price_inr" value={formData.price_inr} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Active</label>
              <div className="col-span-9">
                <select name="active" value={formData.active} onChange={handleChange} className={inputClass}>
                  <option value="">Select Active</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Order</label>
              <div className="col-span-9">
                <input type="number" name="order" value={formData.order} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="flex justify-center items-center gap-3 pt-8 border-t mt-10 font-montserrat">
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={loading} 
                className="bg-white border border-gray-300 hover:bg-gray-50 px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Check size={16} className="text-green-600"/>} 
                <span>Update</span>
              </button>
              
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={loading} 
                className="bg-white border border-gray-300 hover:bg-gray-50 px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                <RotateCcw size={16} className="text-primary"/> 
                <span>Update and go back</span>
              </button>

              <button 
                type="button" 
                onClick={() => navigate('/admin/shipping-options')} 
                className="bg-white border border-gray-300 hover:bg-gray-50 px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                <X size={16} className="text-red-600" /> 
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditShippingOptions;