import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, X, Check, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // 🟢 React Query added

const EditCourier = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID from URL
  const queryClient = useQueryClient(); // 🟢 Cache manage karne ke liye
  
  // State for form fields
  const [title, setTitle] = useState('');
  const [trackingPage, setTrackingPage] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Ek flag lagaya taaki form ka data sirf pehli baar (mount hone par) fill ho
  const [isDataInitialized, setIsDataInitialized] = useState(false);

  // 🚀 OPTIMIZATION 1: FETCH EXISTING DATA WITH useQuery
  const { data: courierData, isLoading: fetching } = useQuery({
    queryKey: ['editCourierData', id],
    queryFn: async () => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.get(`${API_URL}/couriers/get/${id}`);
      
      if (!res.data.status) {
        throw new Error("Courier not found");
      }
      return res.data.data;
    },
    enabled: !!id, // Run only if ID exists
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
    refetchOnWindowFocus: false, // Auto-refresh roko taaki form data overwrite na ho
    onError: (error) => {
      console.error("Fetch Error:", error);
      toast.error("Failed to fetch courier details");
      navigate('/admin/couriers');
    }
  });

  // 🟢 Effect to populate state ONLY ONCE when data arrives
  useEffect(() => {
    if (courierData && !isDataInitialized) {
      setTitle(courierData.title || '');
      setTrackingPage(courierData.trackingPage || '');
      setIsActive(courierData.active !== undefined ? courierData.active : courierData.isActive !== undefined ? courierData.isActive : true);
      
      setIsDataInitialized(true); // Lock it
    }
  }, [courierData, isDataInitialized]);

  // 🚀 OPTIMIZATION 2: UPDATE MUTATION
  const updateCourierMutation = useMutation({
    mutationFn: async (payload) => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.patch(`${API_URL}/couriers/update/${id}`, payload);
      return res.data;
    }
  });

  // 🟢 2. HANDLE UPDATE
  const handleUpdate = (e, actionType) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) return toast.error("Title is required");
    if (!trackingPage.trim()) return toast.error("Tracking Page URL is required");

    const toastId = toast.loading("Updating courier...");

    const payload = {
      title: title,
      trackingPage: trackingPage,
      isActive: isActive
    };

    updateCourierMutation.mutate(payload, {
      onSuccess: (resData) => {
        if (resData.status) {
          toast.success("Courier Updated Successfully!", { id: toastId });
          
          // Purana cache delete karo taaki updated data reflect ho
          queryClient.invalidateQueries({ queryKey: ['editCourierData', id] });

          if (actionType === 'back') {
            navigate('/admin/couriers');
          }
        } else {
          toast.error(resData.msg || "Failed to update courier", { id: toastId });
        }
      },
      onError: (error) => {
        console.error("Update Error:", error);
        toast.error(error.response?.data?.msg || "Failed to update courier", { id: toastId });
      }
    });
  };

  // 🟢 SHOW LOADER WHILE FETCHING
  if (fetching || !isDataInitialized) {
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
            {/* 🟢 Disabled logic bound to useMutation's isPending */}
            <div className="flex flex-wrap justify-center items-center gap-4 pt-6">
              <button onClick={(e) => handleUpdate(e, 'stay')} disabled={updateCourierMutation.isPending} className="flex items-center bg-white border border-gray-300 text-text-main px-6 py-2 rounded font-bold text-xs uppercase shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50">
                {updateCourierMutation.isPending ? "Updating..." : <><Check size={16} className="mr-2" /> Update</>}
              </button>
              <button onClick={(e) => handleUpdate(e, 'back')} disabled={updateCourierMutation.isPending} className="flex items-center bg-gray-100 border border-gray-300 text-text-main px-6 py-2 rounded font-bold text-xs uppercase shadow-sm hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50">
                <RotateCcw size={16} className="mr-2" /> Update and go back
              </button>
              <button onClick={() => navigate('/admin/couriers')} disabled={updateCourierMutation.isPending} className="flex items-center bg-white border border-gray-300 text-gray-600 px-6 py-2 rounded font-bold text-xs uppercase shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50">
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