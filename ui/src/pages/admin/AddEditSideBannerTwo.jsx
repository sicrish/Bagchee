import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RotateCcw, TriangleAlert, Upload, Check, ChevronDown, X, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';

const AddEditSideBannerTwo = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);

  const [image1, setImage1] = useState(null);
  const [preview1, setPreview1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [preview2, setPreview2] = useState(null);

  const [formData, setFormData] = useState({ link1: '', link2: '', active: 'yes', order: '' });

  // 🛠️ Image Validation Logic (MNC Standards)
  const validateAndSetImage = (e, setImage) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 1. Extension/Mime-Type Check
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid format! Only JPG, PNG, and WebP allowed.");
        e.target.value = ""; // Input reset
        return;
      }

      // 2. Size Check (10MB)
      const MAX_SIZE = 10 * 1024 * 1024; 
      if (file.size > MAX_SIZE) {
        toast.error("File is too heavy! Max 10MB allowed.");
        e.target.value = "";
        return;
      }

      setImage(file);
    }
  };

  const getFullImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:5000";
      return `${API_BASE}/${path.replace(/^\//, '')}`;
  };

  useEffect(() => {
    if (isEditMode) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/side-banner-two/get/${id}`);
          if (response.data.status) {
            const data = response.data.data;
            setFormData({ link1: data.link1 || '', link2: data.link2 || '', active: data.isActive ? 'yes' : 'no', order: data.order || '' });
            if (data.image1) setPreview1(getFullImageUrl(data.image1));
            if (data.image2) setPreview2(getFullImageUrl(data.image2));
          }
        } catch (error) { toast.error("Could not load banner details"); }
        finally { setLoading(false); }
      };
      fetchData();
    }
  }, [id, isEditMode]);

  useEffect(() => {
    if (!image1) return;
    const objectUrl = URL.createObjectURL(image1);
    setPreview1(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image1]);

  useEffect(() => {
    if (!image2) return;
    const objectUrl = URL.createObjectURL(image2);
    setPreview2(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image2]);

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!isEditMode && (!preview1 || !preview2)) return toast.error("Both images are required.");
    
    setLoading(true);
    const toastId = toast.loading("Processing...");
    try {
      const data = new FormData();
      data.append('link1', formData.link1);
      data.append('link2', formData.link2);
      data.append('isActive', formData.active === 'yes');
      data.append('order', formData.order);
      if (image1) data.append('image1', image1);
      if (image2) data.append('image2', image2);

      const url = isEditMode ? `${process.env.REACT_APP_API_URL}/side-banner-two/update/${id}` : `${process.env.REACT_APP_API_URL}/side-banner-two/save`;
      // Standardize to PUT/PATCH for updates based on your backend
      const res = await axios({ method: isEditMode ? 'patch' : 'post', url, data });

      if (res.data.status) {
        toast.success(isEditMode ? "Banner updated!" : "Banner saved!", { id: toastId });
        if (actionType === 'back') navigate('/admin/side-banner-two');
      }
    } catch (error) { 
      toast.error(error.response?.data?.msg || "Failed to save", { id: toastId }); 
    }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8 font-body">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-5xl mx-auto overflow-hidden">
        <div className="bg-primary px-6 py-4 text-white font-bold text-lg font-display">
            {isEditMode ? "Edit Side Banner 2" : "Add Side Banner 2"}
        </div>
        <form className="p-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
          
          {/* Banner 1 */}
          <div className="bg-cream-50/50 p-6 rounded-lg border border-cream-200">
             <div className="font-bold text-primary mb-4 text-xs uppercase tracking-widest font-montserrat">Left Banner</div>
             <div className="grid md:grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Image</label>
                  <input 
                    type="file" 
                    onChange={(e) => validateAndSetImage(e, setImage1)} 
                    className="w-full text-xs" 
                    accept="image/jpeg,image/png,image/webp" 
                  />
                  {preview1 && <img src={preview1} className="w-32 h-16 object-cover mt-2 rounded border shadow-sm" alt="Preview 1" />}
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Target Link</label>
                  <input type="text" value={formData.link1} onChange={(e) => setFormData({...formData, link1: e.target.value})} className="theme-input" placeholder="/category-link" />
               </div>
             </div>
          </div>

          {/* Banner 2 */}
          <div className="bg-cream-50/50 p-6 rounded-lg border border-cream-200">
             <div className="font-bold text-accent mb-4 text-xs uppercase tracking-widest font-montserrat">Right Banner</div>
             <div className="grid md:grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Image</label>
                  <input 
                    type="file" 
                    onChange={(e) => validateAndSetImage(e, setImage2)} 
                    className="w-full text-xs" 
                    accept="image/jpeg,image/png,image/webp" 
                  />
                  {preview2 && <img src={preview2} className="w-32 h-16 object-cover mt-2 rounded border shadow-sm" alt="Preview 2" />}
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Target Link</label>
                  <input type="text" value={formData.link2} onChange={(e) => setFormData({...formData, link2: e.target.value})} className="theme-input" placeholder="/category-link" />
               </div>
             </div>
          </div>

          {/* Order & Status */}
          <div className="grid grid-cols-2 gap-6 pt-4">
              <div>
                <label className="text-xs font-bold text-text-muted block mb-1 uppercase">Active Status</label>
                <select name="active" value={formData.active} onChange={(e) => setFormData({...formData, active: e.target.value})} className="theme-input cursor-pointer">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted block mb-1 uppercase">Display Order</label>
                <input type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: e.target.value})} className="theme-input" placeholder="e.g. 1" />
              </div>
          </div>

          <div className="pt-8 flex justify-center gap-4 border-t border-gray-100 mt-4">
              <button onClick={(e) => handleSubmit(e, 'stay')} disabled={loading} className="bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded font-bold uppercase text-xs transition-all shadow-md active:scale-95">
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={(e) => handleSubmit(e, 'back')} disabled={loading} className="bg-gray-800 hover:bg-black text-white px-8 py-2.5 rounded font-bold uppercase text-xs text-nowrap transition-all shadow-md active:scale-95">
                Save & Go Back
              </button>
          </div>
        </form>
      </div>
      <style>{`.theme-input { width: 100%; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; font-size: 0.85rem; transition: border-color 0.2s; } .theme-input:focus { border-color: #41C9E2; outline: none; }`}</style>
    </div>
  );
};

export default AddEditSideBannerTwo;