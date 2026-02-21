import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const EditReviews = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // URL se ID lene ke liye
  const editor = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // Loading state for initial fetch
  
  // Dropdown Data States
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]); // 🟢 Added Products State

  // Form State
  const [formData, setFormData] = useState({
    category_id: '',
    item_id: '', // Will store Product ID
    email: '',
    name: '',
    title: '',
    rating: '',
    status: 'inactive', 
  });

  const [reviewContent, setReviewContent] = useState('');

  // 1. Fetch Categories, Products & Review Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        
        // 🟢 Parallel Fetch: Categories + Products + Review Details
        const [catRes, prodRes, reviewRes] = await Promise.all([
          axios.get(`${API_URL}/category/fetch`),
          axios.get(`${API_URL}/product/fetch`), // 🟢 Fetching Products List
          axios.get(`${API_URL}/reviews/get/${id}`)
        ]);

        // Set Categories
        if (catRes.data.status) {
          setCategories(catRes.data.data);
        }

        // Set Products
        if (prodRes.data.status) {
          setProducts(prodRes.data.data);
        }

        // Set Review Data (Auto-fill)
        if (reviewRes.data.status) {
          const data = reviewRes.data.data;
          
          // 🟢 Handle Item ID: If backend sends populated object or just ID
          const currentItemId = data.item_id && typeof data.item_id === 'object' 
            ? data.item_id._id 
            : data.item_id;

          setFormData({
            category_id: data.category_id || '',
            item_id: currentItemId || '', // Auto-select product
            email: data.email || '',
            name: data.name || '',
            title: data.title || '',
            rating: data.rating || '',
            status: data.status || 'inactive',
          });
          setReviewContent(data.review || '');
        }

      } catch (error) {
        console.error("Fetch error", error);
        toast.error("Failed to load review details");
        navigate('/admin/reviews'); 
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Submit Logic (Update) ---
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.item_id) return toast.error("Please select a Product (Item)!");
    if (!formData.name) return toast.error("Name is required!");

    setLoading(true);
    const toastId = toast.loading("Updating review...");

    try {
      const payload = { ...formData, review: reviewContent };
      
      const API_URL = process.env.REACT_APP_API_URL;
      // Using PATCH for update
      const res = await axios.patch(`${API_URL}/reviews/update/${id}`, payload);

      if (res.data.status) {
        toast.success("Review updated successfully! ⭐", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/reviews');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to update", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Jodit Config
  const config = useMemo(() => ({
    readonly: false,
    height: 300,
    theme: "default",
    placeholder: '',
    toolbar: true,
    buttons: [
      'source', '|', 'save', 'print', 'preview', '|', 'cut', 'copy', 'paste', '|',
      'bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', '|',
      'ul', 'ol', '|', 'outdent', 'indent', '|', 'font', 'fontsize', 'brush', '|',
      'image', 'table', 'link', '|', 'align', 'undo', 'redo', '|', 'hr', 'eraser', 'fullsize'
    ],
  }), []);

  // Reusable Classes
  const inputClass = "w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20 font-body";
  const labelClass = "col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";

  // Loading State UI
  if (fetching) {
    return <div className="h-screen flex items-center justify-center bg-cream-50"><Loader2 className="animate-spin text-primary" size={40}/></div>;
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Bar */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Edit Review
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200">
             <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">
               Review Information
             </h2>
          </div>

          <div className="p-8 space-y-6">
            
            {/* Category ID Dropdown */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Category id</label>
              <div className="col-span-9">
                <select 
                  name="category_id" 
                  value={formData.category_id} 
                  onChange={handleChange} 
                  className={`${inputClass} w-1/3 text-gray-600`}
                >
                  <option value="">Select Category id</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.categorytitle || cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 🟢 ITEM ID (Changed to Dropdown) */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Product (Item)</label>
              <div className="col-span-9">
                <select 
                  name="item_id" 
                  value={formData.item_id} 
                  onChange={handleChange} 
                  className={`${inputClass} w-1/2 text-gray-600`}
                >
                  <option value="">Select Product to Review</option>
                  {products.length > 0 ? (
                    products.map(prod => (
                      // Value stores ID, but Display shows Name/Title
                      <option key={prod._id} value={prod._id}>
                        {prod.title || prod.name} {prod.sku ? `(SKU: ${prod.sku})` : ''}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No products found</option>
                  )}
                </select>
                <p className="text-[10px] text-gray-400 mt-1 ml-1 font-montserrat italic">
                  * Item ID is automatically set based on selected product
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Email</label>
              <div className="col-span-9">
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Name</label>
              <div className="col-span-9">
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* Title */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Title</label>
              <div className="col-span-9">
                <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* Review (Jodit Editor) */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className={labelClass}>Review</label>
              <div className="col-span-9 border border-gray-300 rounded overflow-hidden shadow-sm">
                <JoditEditor 
                  ref={editor} 
                  value={reviewContent} 
                  config={config} 
                  onBlur={newContent => setReviewContent(newContent)} 
                />
              </div>
            </div>

            {/* Rating */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Rating</label>
              <div className="col-span-9">
                <input type="text" name="rating" value={formData.rating} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* Active (Radio Buttons) */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className={labelClass}>Active</label>
              <div className="col-span-9 pt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    id="active" 
                    name="status" 
                    value="active" 
                    checked={formData.status === 'active'} 
                    onChange={handleChange}
                    className="accent-primary"
                  />
                  <label htmlFor="active" className="text-sm">active</label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    id="inactive" 
                    name="status" 
                    value="inactive" 
                    checked={formData.status === 'inactive'} 
                    onChange={handleChange}
                    className="accent-primary"
                  />
                  <label htmlFor="inactive" className="text-sm">inactive</label>
                </div>
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
                onClick={() => navigate('/admin/reviews')} 
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

export default EditReviews;