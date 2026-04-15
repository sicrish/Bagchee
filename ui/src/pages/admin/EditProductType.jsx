import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, X, Check, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom'; // 🟢 Added useParams
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';


const EditProductType = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // 🟢 Get ID from URL
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    image_folder: '',
    bagchee_prefix: ''
  });

  // 🟢 1. Fetch Data on Component Mount
  useEffect(() => {
    const fetchProductType = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await axios.get(`${API_URL}/product-types/get/${id}`);
        
        if (res.data.status) {
          const d = res.data.data;
          setFormData({
            name: d.name || '',
            image_folder: d.imageFolder || d.image_folder || '',
            bagchee_prefix: d.bagcheePrefix || d.bagchee_prefix || ''
          });
        } else {
          toast.error("Product type not found");
          navigate('/admin/product-types');
        }
      } catch (error) {
        console.error(error);
        toast.error("Error fetching data");
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchProductType();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🟢 2. Handle Update (PUT Request)
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.image_folder || !formData.bagchee_prefix) {
      return toast.error("All fields are required!");
    }

    setLoading(true);
    const toastId = toast.loading("Updating product type...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      // Note the Patch request here
      const res = await axios.patch(`${API_URL}/product-types/update/${id}`, formData);

      if (res.data.status) {
        toast.success("Product Type Updated!", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/product-types');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  }

  return (
    <div className="bg-[#f4f7f6] min-h-screen font-body text-text-main pb-20">
      
      {/* 🔵 TOP HEADER BAR */}
      <div className="bg-primary  px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-tight">
          Edit Product Type
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden pb-8">
          
          <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
             <h2 className="text-sm font-bold text-gray-600 uppercase">Edit Details: <span className='text-primary'>{formData.name}</span></h2>
          </div>

          <form className="p-8 space-y-6">
            
            {/* 1. Name Field */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
              <label className="col-span-12 md:col-span-3 text-left md:text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                Name*
              </label>
              <div className="col-span-12 md:col-span-9">
                <input 
                  name="name" 
                  type="text" 
                  value={formData.name}
                  onChange={handleChange}
                  className="theme-input w-full" 
                  placeholder="e.g. Books" 
                />
              </div>
            </div>

            {/* 2. Image Folder Field */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
              <label className="col-span-12 md:col-span-3 text-left md:text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                Image folder*
              </label>
              <div className="col-span-12 md:col-span-9">
                <input 
                  name="image_folder" 
                  type="text" 
                  value={formData.image_folder}
                  onChange={handleChange}
                  className="theme-input w-full" 
                  placeholder="e.g. books" 
                />
              </div>
            </div>

            {/* 3. Bagchee Prefix Field */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
              <label className="col-span-12 md:col-span-3 text-left md:text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                Bagchee prefix*
              </label>
              <div className="col-span-12 md:col-span-9">
                <input 
                  name="bagchee_prefix" 
                  type="text" 
                  value={formData.bagchee_prefix}
                  onChange={handleChange}
                  className="theme-input w-full" 
                  placeholder="e.g. BK" 
                />
              </div>
            </div>

            {/* 🟢 ACTION BUTTONS */}
            <div className="flex flex-wrap justify-center items-center gap-4 pt-8 mt-4">
              <button 
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={loading}
                className="flex items-center bg-primary text-white px-8 py-2.5 rounded font-bold text-xs uppercase shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                {loading ? <Loader2 size={16} className="animate-spin mr-2"/> : <Check size={16} className="mr-2" />} 
                Update
              </button>
              
              <button 
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={loading}
                className="flex items-center bg-gray-800 text-white px-8 py-2.5 rounded font-bold text-xs uppercase shadow-md hover:bg-gray-900 active:scale-95 transition-all"
              >
                <RotateCcw size={14} className="mr-2"/> Update and go back
              </button>

              <button 
                onClick={() => navigate('/admin/product-types')} 
                className="flex items-center bg-white border border-gray-300 text-gray-600 px-8 py-2.5 rounded font-bold text-xs uppercase shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
              >
                <X size={16} className="mr-2" /> Cancel
              </button>
            </div>

          </form>
        </div>
      </div>

      <style>{`
        .theme-input { 
          border: 1px solid #d1d5db; 
          border-radius: 4px; 
          padding: 8px 12px; 
          font-size: 13px; 
          outline: none; 
          transition: all 0.2s;
          background-color: #fff;
        }
        .theme-input:focus { 
          border-color: #008DDA; 
          box-shadow: 0 0 0 2px rgba(0, 141, 218, 0.1); 
        }
      `}</style>
    </div>
  );
};

export default EditProductType;