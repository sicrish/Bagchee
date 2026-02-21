import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, Trash2, Image as ImageIcon } from 'lucide-react';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const EditPayments = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID from URL
  const editor = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // For initial data load

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    status: 'active',
    order: '',
    additional_text_status: 'active',
    image: null, // For NEW file upload
  });

  const [additionalText, setAdditionalText] = useState('');
  
  // 🟢 State to handle existing image display
  const [existingImage, setExistingImage] = useState(null);

  // 1. Fetch Existing Data
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await axios.get(`${API_URL}/payments/get/${id}`);

        if (res.data.status) {
          const data = res.data.data;
          setFormData({
            title: data.title || '',
            status: data.status || 'active', // Handle boolean/string mapping if needed
            order: data.order || '',
            additional_text_status: data.additional_text_status || 'active',
            image: null 
          });
          setAdditionalText(data.additional_text || '');
          
          // Store existing image path/name
          if (data.image) {
            setExistingImage(`${API_URL}${data.image}`);
          }
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Failed to load payment details");
        navigate('/admin/payments');
      } finally {
        setFetching(false);
      }
    };
    fetchPaymentData();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  // 🔴 Handle Delete Image Click
  const handleDeleteImage = () => {
    
        setExistingImage(null); // Clear existing image state -> Shows File Input
        toast("Image removed. Upload a new one.", { icon: '🗑️' });
  };

  // 2. Update Logic
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Title is required!");

    setLoading(true);
    const toastId = toast.loading("Updating payment option...");

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('status', formData.status);
      data.append('order', formData.order);
      data.append('additional_text', additionalText);
      data.append('additional_text_status', formData.additional_text_status);
      
      // If new image is selected, send it
      if (formData.image) {
        data.append('image', formData.image);
      }

      // Logic to tell backend to remove image if existing is cleared and no new image
      if (!existingImage && !formData.image) {
        data.append('remove_image', 'true'); 
      }

      const API_URL = process.env.REACT_APP_API_URL;
      // Using PATCH for update
      const res = await axios.patch(`${API_URL}/payments/update/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.status) {
        toast.success("Payment option updated! 💳", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/payments');
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
    height: 200,
    theme: "default",
    placeholder: '',
    toolbar: true,
    buttons: [
      'source', '|', 'bold', 'italic', 'underline', '|', 'ul', 'ol', '|', 'font', 'fontsize', 'brush', '|',
      'image', 'table', 'link', '|', 'align', 'undo', 'redo', '|', 'hr', 'eraser', 'fullsize'
    ],
  }), []);

  // Reusable Classes
  const inputClass = "w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20 font-body";
  const labelClass = "col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";

  // Loading State
  if (fetching) {
    return <div className="h-screen flex items-center justify-center bg-cream-50"><Loader2 className="animate-spin text-primary" size={40}/></div>;
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Bar */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Edit Payments
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="bg-cream-100 px-6 py-2 border-b border-cream-200">
             <h2 className="text-[11px] font-bold uppercase tracking-wider font-montserrat text-text-muted">
               Payment Information
             </h2>
          </div>

          <div className="p-8 space-y-6">
            
            {/* Title */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Title</label>
              <div className="col-span-9">
                <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* Active (Radio Buttons) */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className={labelClass}>Active</label>
              <div className="col-span-9 pt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <input type="radio" id="active" name="status" value="active" checked={formData.status === 'active'} onChange={handleChange} className="accent-primary" />
                  <label htmlFor="active" className="text-sm cursor-pointer">active</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="radio" id="inactive" name="status" value="inactive" checked={formData.status === 'inactive'} onChange={handleChange} className="accent-primary" />
                  <label htmlFor="inactive" className="text-sm cursor-pointer">inactive</label>
                </div>
              </div>
            </div>

            {/* Order */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className={labelClass}>Order</label>
              <div className="col-span-9">
                <input type="number" name="order" value={formData.order} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* Additional Text (Editor) */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className={labelClass}>Additional text</label>
              <div className="col-span-9 border border-gray-300 rounded overflow-hidden shadow-sm">
                <JoditEditor 
                  ref={editor} 
                  value={additionalText} 
                  config={config} 
                  onBlur={newContent => setAdditionalText(newContent)} 
                />
              </div>
            </div>

            {/* Additional Text Active */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className={labelClass}>Additional text active</label>
              <div className="col-span-9 pt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <input type="radio" id="text_active" name="additional_text_status" value="active" checked={formData.additional_text_status === 'active'} onChange={handleChange} className="accent-primary" />
                  <label htmlFor="text_active" className="text-sm cursor-pointer">active</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="radio" id="text_inactive" name="additional_text_status" value="inactive" checked={formData.additional_text_status === 'inactive'} onChange={handleChange} className="accent-primary" />
                  <label htmlFor="text_inactive" className="text-sm cursor-pointer">inactive</label>
                </div>
              </div>
            </div>

            {/* 🟢 Image Logic: Display or Upload */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className={labelClass}>Image</label>
              <div className="col-span-9">
                {existingImage ? (
                  // Case 1: Image exists -> Show Preview + Details
                  <div className="flex gap-4 p-3 border border-gray-100 rounded bg-gray-50/50">
                    
                    {/* 🟢 1. LARGER IMAGE PREVIEW (w-24 h-24) */}
                    <div className="w-24 h-24 border border-gray-300 rounded bg-white flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                      <img 
                        src={existingImage} 
                        alt="Payment Method" 
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { e.target.src = "https://placehold.co/100x100?text=No+Image"; }} 
                      />
                    </div>

                    {/* 🟢 2. Info & Actions */}
                    <div className="flex flex-col justify-center space-y-2">
                      <div className="text-xs text-gray-500 font-montserrat">
                        <span className="font-bold text-gray-700 block mb-1">Current File:</span>
                        {typeof existingImage === 'string' ? existingImage.split('/').pop().substring(0, 30) + (existingImage.length > 30 ? '...' : '') : 'Uploaded Image'}
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={handleDeleteImage}
                        className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all w-fit shadow-sm"
                      >
                        <Trash2 size={12} /> Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  // Case 2: No Image -> Show File Input
                  <div className="border border-dashed border-gray-300 rounded p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                      <ImageIcon size={24} className="text-gray-400 mb-2"/>
                      <input 
                        type="file" 
                        onChange={handleFileChange} 
                        accept="image/*"
                        className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" 
                      />
                      <span className="text-[10px] text-gray-400 mt-2 font-montserrat">Supported formats: JPG, PNG, WEBP</span>
                  </div>
                )}
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
                <span className="font-bold">Update changes</span>
              </button>
              
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={loading} 
                className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-6 py-2 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm"
              >
                <RotateCcw size={16} className="text-primary"/> 
                <span className="font-bold">Update and go back to list</span>
              </button>

              <button 
                type="button" 
                onClick={() => navigate('/admin/payments')} 
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

export default EditPayments;