import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import axios from '../../utils/axiosConfig';

import toast from 'react-hot-toast';

const EditLanguages = () => {
  const { id } = useParams(); // URL se ID nikalne ke liye
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    order: '',
  });

  // 🟢 1. Existing Language Data fetch karein
  useEffect(() => {
    const fetchLanguageData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await axios.get(`${API_URL}/languages/get/${id}`);
        
        if (res.data.status) {
          const lang = res.data.data;
          setFormData({
            title: lang.title || '',
            order: lang.ord || '',
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Error loading language data");
        navigate('/admin/languages');
      } finally {
        setFetching(false);
      }
    };
    if (id) fetchLanguageData();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🟢 2. Update Logic 
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error("Title is required!");

    setLoading(true);
    const toastId = toast.loading("Updating language...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.patch(`${API_URL}/languages/update/${id}`, formData);

      if (res.data.status) {
        toast.success("Language updated successfully! ✨", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/languages');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Update failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="h-screen flex justify-center items-center bg-cream-50">
      <Loader2 className="animate-spin text-primary" size={40}/>
    </div>
  );

  return (
    // 🟢 bg-cream-50 (#F7EEDD) and font-body (Roboto) from config
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Bar: bg-primary (#008DDA) aur font-display (Outfit) */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Edit Language: <span className="text-cream-200">{formData.title}</span>
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          {/* Section Heading with Montserrat */}
          <div className="bg-cream-100 px-6 py-3 border-b border-cream-200">
             <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">
               Update Language Details
             </h2>
          </div>

          <div className="p-8 space-y-6">
            {/* Title Field */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">
                Title*
              </label>
              <div className="col-span-9">
                <input 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  className="w-full border-2 border-cream-200 rounded-md px-4 py-2.5 text-[13px] outline-none transition-all focus:border-primary focus:bg-white bg-cream-50/30 text-text-main" 
                />
              </div>
            </div>

            {/* Order Field */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">
                Order
              </label>
              <div className="col-span-9">
                <input 
                  type="number"
                  name="order" 
                  value={formData.order} 
                  onChange={handleChange} 
                  className="w-32 border-2 border-cream-200 rounded-md px-4 py-2.5 text-[13px] outline-none transition-all focus:border-primary focus:bg-white bg-cream-50/30 text-text-main font-bold" 
                />
              </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="flex justify-center items-center gap-4 pt-8 border-t mt-4 font-montserrat">
              <button 
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={loading} 
                className="bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md active:scale-95 transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} Update
              </button>
              
              <button 
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={loading} 
                className="bg-text-main hover:opacity-90 text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md active:scale-95 transition-all flex items-center gap-2"
              >
                <RotateCcw size={14}/> Update & Exit
              </button>

              <button 
                type="button" 
                onClick={() => navigate('/admin/languages')} 
                className="bg-white border border-cream-200 text-text-main hover:bg-cream-50 px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-sm active:scale-95 transition-all flex items-center gap-2"
              >
                <X size={14} className="text-red-600" /> Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLanguages;