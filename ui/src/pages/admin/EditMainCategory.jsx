import React, { useState, useEffect } from 'react';
import { 
  Save, X, Upload, ArrowLeft, Loader2, Image as ImageIcon 
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../utils/axiosConfig'; // Apana axios config path check kar lena
import toast from 'react-hot-toast';

const EditMainCategory = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // URL se ID nikalne ke liye
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // 🟢 1. Server URL Setup (Consistency ke liye same logic)
  const RAW_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const API_URL = RAW_URL.endsWith('/') ? RAW_URL.slice(0, -1) : RAW_URL;

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    active: 'Yes',
    order: ''
  });

  // Image State
  const [imageFile, setImageFile] = useState(null); // Nayi file jo select ki
  const [previewUrl, setPreviewUrl] = useState(null); // Nayi file ka preview
  const [existingImage, setExistingImage] = useState(null); // Database wali purani image

  // 🟢 2. Fetch Existing Data
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        // Route check kar lena: /main-categories/get/:id ya /main-categories/:id
        const res = await axios.get(`${API_URL}/main-categories/get/${id}`);
        if (res.data.status) {
          const data = res.data.data;
          setFormData({
            title: data.title || '',
            link: data.link || '',
            active: data.active || 'Yes',
            order: data.order || ''
          });
          setExistingImage(data.image); // DB path set karein
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Failed to fetch category details");
        navigate('/admin/main-categories'); // Error aaye to wapis bhej do
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) fetchCategory();
  }, [id, API_URL, navigate]);

  // Handle Text Inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle File Input
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create local preview URL
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 🟢 3. Submit Handler (Update Logic)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('link', formData.link);
    data.append('active', formData.active);
    data.append('order', formData.order);

    // Agar nayi image select ki hai tabhi bhejo
    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      // Backend Route: /update/:id
      const res = await axios.put(`${API_URL}/main-categories/update/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.status) {
        toast.success("Category updated successfully!");
        navigate('/admin/main-categories'); // List page par wapis
      }
    } catch (error) {
      console.error("Update Error:", error);
      toast.error(error.response?.data?.msg || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 4. Image URL Helper (Wahi purana logic)
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const cleanPath = imagePath.replace(/\\/g, '/');
    if (cleanPath.startsWith('http')) return cleanPath;
    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${API_URL}${finalPath}`; // http://localhost:3001/uploads/...
  };

  if (fetchLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-cream-50 text-primary">
        <Loader2 className="animate-spin mr-2" /> Loading Details...
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-8 font-body text-text-main flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-sm border border-cream-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <button onClick={() => navigate(-1)} className="hover:bg-white/10 p-1 rounded transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-montserrat font-bold tracking-wide uppercase">Edit Main Category</h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-text-muted mb-1 ml-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-medium"
                  placeholder="Enter category title"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-text-muted mb-1 ml-1">Link / Slug</label>
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-mono text-text-muted"
                  placeholder="/books/example"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-text-muted mb-1 ml-1">Active</label>
                  <select
                    name="active"
                    value={formData.active}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded outline-none focus:border-primary text-sm font-medium cursor-pointer"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-text-muted mb-1 ml-1">Order</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-cream-50 border border-cream-200 rounded outline-none focus:border-primary text-sm font-medium"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Image Upload */}
            <div className="flex flex-col gap-4">
               <label className="block text-xs font-bold uppercase text-text-muted ml-1">Category Image</label>
               
               <div className="border-2 border-dashed border-cream-200 rounded-lg p-4 flex flex-col items-center justify-center bg-cream-50 hover:bg-cream-100 transition-colors relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  
                  {/* Image Preview Logic */}
                  <div className="w-full h-48 flex items-center justify-center overflow-hidden rounded bg-white mb-3 shadow-inner border border-cream-200">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                    ) : existingImage ? (
                      <img 
                        src={getFullImageUrl(existingImage)} 
                        alt="Existing" 
                        className="w-full h-full object-contain"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Error" }}
                      />
                    ) : (
                      <div className="flex flex-col items-center text-gray-300">
                        <ImageIcon size={48} />
                        <span className="text-xs mt-2 font-bold">No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase">
                    <Upload size={16} />
                    <span>{previewUrl ? "Change Image" : "Upload New Image"}</span>
                  </div>
               </div>
               
               <div className="text-[10px] text-text-muted bg-blue-50 p-2 rounded border border-blue-100">
                 <span className="font-bold text-blue-600">Note:</span> If you don't select a new image, the existing image will remain unchanged.
               </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-cream-100">
            <button
              type="button"
              onClick={() => navigate('/admin/main-categories')}
              className="px-5 py-2.5 rounded border border-cream-200 text-text-muted font-bold text-xs uppercase hover:bg-cream-50 transition-colors flex items-center gap-2"
            >
              <X size={16} /> Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded bg-primary text-white font-bold text-xs uppercase hover:brightness-110 shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {loading ? "Updating..." : "Update Category"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditMainCategory;