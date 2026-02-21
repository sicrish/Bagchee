import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, X, Check, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const EditCourier = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // 🟢 Get ID from URL
  
  // Loading states
  const [loading, setLoading] = useState(false); // For Update button
  const [fetching, setFetching] = useState(true); // For Initial Data Load

  // State for form fields
  const [title, setTitle] = useState('');
  const [trackingPage, setTrackingPage] = useState('');
  const [isActive, setIsActive] = useState(true);

  // 🟢 1. FETCH EXISTING DATA
  useEffect(() => {
    const fetchCourierDetails = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await axios.get(`${API_URL}/couriers/get/${id}`);

        if (res.data.status) {
          const data = res.data.data;
          setTitle(data.title);
          setTrackingPage(data.trackingPage);
          setIsActive(data.isActive);
        } else {
          toast.error("Courier not found");
          navigate('/admin/couriers');
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Failed to fetch courier details");
        navigate('/admin/couriers');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchCourierDetails();
    }
  }, [id, navigate]);

  // 🟢 2. HANDLE UPDATE
  const handleUpdate = async (e, actionType) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) return toast.error("Title is required");
    if (!trackingPage.trim()) return toast.error("Tracking Page URL is required");

    setLoading(true);
    const toastId = toast.loading("Updating courier...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      
      const payload = {
        title: title,
        trackingPage: trackingPage,
        isActive: isActive
      };

      // PUT Request for Update
      const res = await axios.patch(`${API_URL}/couriers/update/${id}`, payload);

      if (res.data.status) {
        toast.success("Courier Updated Successfully!", { id: toastId });
        
        if (actionType === 'back') {
          navigate('/admin/couriers');
        }
        // If actionType is 'stay', we just stay on the page with updated data
      }
    } catch (error) {
      console.error("Update Error:", error);
      toast.error(error.response?.data?.msg || "Failed to update courier", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // 🟢 SHOW LOADER WHILE FETCHING
  if (fetching) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-cream-50 font-body text-text-muted">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
        <p className="text-sm font-bold">Loading Courier Details...</p>
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main">
      <div className="bg-primary text-white border-b px-6 py-3 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-bold text-gray-700 uppercase tracking-tight">Edit Couriers</h1>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-8 space-y-6">
            
            {/* Title Input */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
              <label className="col-span-12 md:col-span-2 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Title</label>
              <div className="col-span-12 md:col-span-10">
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Tracking Page URL Input */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
              <label className="col-span-12 md:col-span-2 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Tracking page</label>
              <div className="col-span-12 md:col-span-10">
                <input 
                  type="text" 
                  value={trackingPage}
                  onChange={(e) => setTrackingPage(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                  placeholder="https://www.google.com/search?q="
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-4">
              <label className="col-span-12 md:col-span-2 text-right text-[11px] font-bold text-gray-500 uppercase tracking-tight">Active</label>
              <div className="col-span-12 md:col-span-10 flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="active" 
                    checked={isActive === true} 
                    onChange={() => setIsActive(true)}
                    className="accent-primary" 
                  /> active
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="active" 
                    checked={isActive === false} 
                    onChange={() => setIsActive(false)}
                    className="accent-primary" 
                  /> inactive
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center items-center gap-4 pt-6">
              <button onClick={(e) => handleUpdate(e, 'stay')} disabled={loading} className="flex items-center bg-white border border-gray-300 text-text-main px-6 py-2 rounded font-bold text-xs uppercase shadow-sm hover:bg-gray-50 active:scale-95 transition-all">
                {loading ? "Updating..." : <><Check size={16} className="mr-2" /> Update</>}
              </button>
              <button onClick={(e) => handleUpdate(e, 'back')} disabled={loading} className="flex items-center bg-gray-100 border border-gray-300 text-text-main px-6 py-2 rounded font-bold text-xs uppercase shadow-sm hover:bg-gray-200 active:scale-95 transition-all">
                <RotateCcw size={16} className="mr-2" /> Update and go back
              </button>
              <button onClick={() => navigate('/admin/couriers')} className="flex items-center bg-white border border-gray-300 text-gray-600 px-6 py-2 rounded font-bold text-xs uppercase shadow-sm hover:bg-gray-50 active:scale-95 transition-all">
                <X size={16} className="mr-2" /> Cancel
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCourier;