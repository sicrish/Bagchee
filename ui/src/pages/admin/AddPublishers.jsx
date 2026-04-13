import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, X, Upload, Loader2 } from 'lucide-react';
import axios from '../../utils/axiosConfig.js';
import toast from 'react-hot-toast';

const AddPublishers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    category: '', // Stores ObjectId now
    title: '',
    company: '',
    address: '',
    place: '',
    email: '',
    phone: '',
    fax: '',
    date: '',
    order: '',
    show: '',
    slug: '',
    ship_in_days: ''
  });

  // 1. Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await axios.get(`${API_URL}/category/fetch`);
        if (res.data.status) {
          setCategories(res.data.data);
        }
      } catch (error) {
        console.error("Categories fetch error");
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {

      let updatedData = { ...prev, [name]: value };


      if (name === 'title') {
        updatedData.slug = value
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '');
      }

      return updatedData;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // 📸 Instant Preview creation
    }
  };

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error("Title is required!");
    if (!formData.category) return toast.error("Category is required!");

    setLoading(true);
    const toastId = toast.loading("Saving publisher...");

    try {
      const data = new FormData();

      // Smart Append: Skip empty date to avoid DB crash
      Object.keys(formData).forEach(key => {
        if (key === 'date' && !formData[key]) return;
        data.append(key, formData[key]);
      });

      // Append Image
      if (imageFile) {
        data.append('image', imageFile);
      }

      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/publishers/save`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.status) {
        toast.success("Publisher added successfully! 📚", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/publishers');
        } else {
          // Reset Form
          setFormData({
            category: '', title: '', company: '', address: '', place: '',
            email: '', phone: '', fax: '', date: '', order: '',
            show: '', slug: '', ship_in_days: ''
          });
          setImageFile(null);
          // Reset file input manually
          const fileInput = document.getElementById('pub_img');
          if (fileInput) fileInput.value = "";
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to save", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Reusable Classes to match AddFormats exactly
  const inputClass = "w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20";
  const labelClass = "col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">

      {/* 🔵 Header Bar */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Add Publishers
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">

          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200">
            <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">
              Publisher Information
            </h2>
          </div>

          <div className="p-8 space-y-6">

            {/* 1. Category (Sends ObjectId) */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Category*</label>
              <div className="col-span-9">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`${inputClass} w-1/3 text-gray-600`}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    // 🟢 Value = ID (ObjectId) for backend relation
                    <option key={cat._id} value={cat._id}>
                      {cat.categorytitle}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Title */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Title*</label>
              <div className="col-span-9">
                <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="Enter publisher title" />
              </div>
            </div>

            {/* 3. Image Upload */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Image</label>
              <div className="col-span-9 flex items-center gap-3">
               
                <input
                  type="file"
                  id="pub_img"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setImageFile(file); 
                     
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  accept="image/*"
                />

                <label
                  htmlFor="pub_img"
                  className="bg-gray-100 border border-gray-300 px-4 py-2 rounded text-[11px] font-bold cursor-pointer hover:bg-gray-200 transition-all flex items-center gap-2 text-text-muted uppercase shadow-sm active:scale-95"
                >
                  <Upload size={14} /> {imageFile ? "Change File" : "Upload File"}
                </label>

                {/* 3.  छोटी प्रिव्यू इमेज */}
                {imagePreview && (
                  <div className="h-10 w-10 border rounded overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}

                {/* 4. File name display with safe navigation */}
                {imageFile && (
                  <span className="text-[10px] italic text-primary font-bold truncate max-w-[200px]">
                    {imageFile?.name}
                  </span>
                )}
              </div>
            </div>

            {/* 4. Company */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Company</label>
              <div className="col-span-9">
                <input type="text" name="company" value={formData.company} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* 5. Address */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Address</label>
              <div className="col-span-9">
                <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* 6. Place */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Place</label>
              <div className="col-span-9">
                <input type="text" name="place" value={formData.place} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* 7. Email */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Email</label>
              <div className="col-span-9">
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* 8. Phone */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Phone</label>
              <div className="col-span-9">
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* 9. Fax */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Fax</label>
              <div className="col-span-9">
                <input type="text" name="fax" value={formData.fax} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* 10. Date */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Date</label>
              <div className="col-span-9 relative">
                <input type="date" name="date" value={formData.date} onChange={handleChange} className={`${inputClass} text-gray-500`} />
                {formData.date && (
                  <button type="button" onClick={() => setFormData({ ...formData, date: '' })} className="absolute right-[-40px] top-2.5 text-[10px] text-red-500 font-bold hover:underline">
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* 11. Order */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Order</label>
              <div className="col-span-9">
                <input type="number" name="order" value={formData.order} onChange={handleChange} className={inputClass} placeholder="0" />
              </div>
            </div>

            {/* 12. Show */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Show</label>
              <div className="col-span-9">
                <select name="show" value={formData.show} onChange={handleChange} className={`${inputClass} w-1/3 text-gray-600`}>
                  <option value="">Select Show</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            {/* 13. Slug */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Slug</label>
              <div className="col-span-9">
                <input type="text" name="slug" value={formData.slug} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* 14. Ship in days */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Ship in days</label>
              <div className="col-span-9">
                <select name="ship_in_days" value={formData.ship_in_days} onChange={handleChange} className={`${inputClass} w-1/3 text-gray-600`}>
                  <option value="">Select Ship in days</option>
                  {[...Array(30)].map((_, i) => (
                    <option key={i + 1} value={`${i + 1} Days`}>{i + 1} Days</option>
                  ))}
                </select>
              </div>
            </div>

            {/* --- ACTION BUTTONS (Exact Match to AddFormats) --- */}
            <div className="flex justify-center items-center gap-3 pt-8 border-t mt-10 font-montserrat">

              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'stay')}
                disabled={loading}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} className="text-green-600" />}
                <span className="font-bold">Save</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'back')}
                disabled={loading}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                <RotateCcw size={16} className="text-primary" />
                <span className="font-bold">Save and go back to list</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/publishers')}
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

export default AddPublishers;