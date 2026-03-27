import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const EditTags = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // URL se Tag ID nikalne ke liye
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
  });

  // 🟢 1. Pehle se maujood Tag ka data load karein
  useEffect(() => {
    const fetchTagData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await axios.get(`${API_URL}/tags/get/${id}`); // Single tag fetch endpoint
        if (res.data.status) {
          setFormData({ title: res.data.data.title });
        }
      } catch (error) {
        toast.error("Failed to load tag details");
        navigate('/admin/tags');
      } finally {
        setFetching(false);
      }
    };
    fetchTagData();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔵 2. Update Handle Function
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Title is required!");

    setLoading(true);
    const toastId = toast.loading("Updating tag...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      // Backend endpoint for tags update (Patch use kiya hai standard ke liye)
      const res = await axios.patch(`${API_URL}/tags/update/${id}`, formData);

      if (res.data.status) {
        toast.success("Tag updated successfully! 🏷️", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/tags');
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
      
      {/* Header Bar */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Edit Tag
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200">
             <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">
               Modify Tag Information
             </h2>
          </div>

          <div className="p-8 space-y-6">
            {/* Title Field */}
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
                  placeholder="Enter tag title"
                  className="w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white text-text-main" 
                />
              </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="flex justify-center items-center gap-3 pt-8 border-t mt-10 font-montserrat">
              
              {/* Update Button */}
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={loading} 
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Check size={16} className="text-green-600"/>} 
                <span className="font-bold">Update</span>
              </button>
              
              {/* Update & Go Back Button */}
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={loading} 
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                <RotateCcw size={16} className="text-primary"/> 
                <span className="font-bold">Update and go back to list</span>
              </button>

              {/* Cancel Button */}
              <button 
                type="button" 
                onClick={() => navigate('/admin/tags')} 
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

export default EditTags;