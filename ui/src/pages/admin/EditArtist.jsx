import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // Added useParams
import { Check, RotateCcw, X, Upload, Loader2, ArrowLeft } from 'lucide-react';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';

import toast from 'react-hot-toast';

const EditArtist = () => {
  const { id } = useParams(); // Get ID from URL
  const navigate = useNavigate();
  const editor = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // Loading state for initial data
  
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null); // To show existing image

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    role: '',
    origin: '',
  });

  const [profile, setProfile] = useState('');

  // 🟢 1. Fetch Existing Data
  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        // Adjust endpoint based on your backend route (e.g., /artists/get/:id)
        const res = await axios.get(`${API_URL}/artists/get/${id}`);
        
        if (res.data.status) {
          const data = res.data.data;
          setFormData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            role: data.role || '',
            origin: data.origin || '',
          });
          setProfile(data.profile || '');
          // Assuming backend returns a full URL or a relative path
          if (data.picture) {
 
            setPreviewImage(`${API_URL}${data.picture}`); 
        }
        } else {
          toast.error("Could not fetch artist details.");
          navigate('/admin/artists');
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load data.");
        navigate('/admin/artists');
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchArtistData();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🟢 2. Handle Update (PUT Request)
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.first_name.trim()) return toast.error("First name is required!");

    setLoading(true);
    const toastId = toast.loading("Updating artist...");

    try {
      const data = new FormData();
      data.append('first_name', formData.first_name);
      data.append('last_name', formData.last_name);
      data.append('role', formData.role);
      data.append('origin', formData.origin);
      data.append('profile', profile);
      
      // Only append image if a new one is selected
      if (imageFile) {
        data.append('picture', imageFile);
      }

      const API_URL = process.env.REACT_APP_API_URL;
      // Using PUT for update
      const res = await axios.patch(`${API_URL}/artists/update/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.status) {
        toast.success("Artist updated successfully! 🎨", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/artists');
        } else {
            // Stay on page, maybe refresh image preview if backend returns new url
            if(imageFile) {
                 // Option: re-fetch or just handle UI locally
                 setImageFile(null); 
            }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to update", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const config = useMemo(() => ({
    readonly: false,
    height: 300,
    theme: "default",
    placeholder: 'Enter artist profile details...',
    buttons: [
      'source', '|', 'bold', 'italic', 'underline', '|',
      'ul', 'ol', '|', 'outdent', 'indent', '|',
      'font', 'fontsize', 'paragraph', '|', 'image', 'table', 'link', '|',
      'align', 'undo', 'redo', '|', 'hr', 'fullsize'
    ],
  }), []);

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 Header Bar */}
      <div className="bg-primary  px-4 md:px-6 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/artists')} className="text-white hover:bg-white/20 p-1 rounded-full transition">
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-base md:text-lg font-bold text-white uppercase tracking-slick font-display">
            Edit Artist
            </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="bg-cream-100 px-6 py-3 border-b border-cream-200">
             <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">
                Artist Information
             </h2>
          </div>

          <div className="p-4 md:p-8 space-y-6">
            
            {/* First Name */}
            {/* 🟢 Responsive Grid: grid-cols-1 on mobile, grid-cols-12 on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center border-b border-cream-50 pb-4">
              <label className="md:col-span-3 text-left md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">First name*</label>
              <div className="md:col-span-9">
                <input name="first_name" value={formData.first_name} onChange={handleChange} className="theme-input w-full" placeholder="Enter first name" />
              </div>
            </div>

            {/* Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center border-b border-cream-50 pb-4">
              <label className="md:col-span-3 text-left md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Last name</label>
              <div className="md:col-span-9">
                <input name="last_name" value={formData.last_name} onChange={handleChange} className="theme-input w-full" placeholder="Enter last name" />
              </div>
            </div>

            {/* Picture Upload with Preview */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center border-b border-cream-50 pb-4">
    <label className="md:col-span-3 text-left md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Picture</label>
    <div className="md:col-span-9">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            
            {/* 🟢 SMART PREVIEW LOGIC */}
            {(imageFile || previewImage) && (
                <div className="relative group">
                    <img 
                        // 🟢 FIX: Agar nayi file chuni hai to uska preview dikhao, warna server wali photo
                        src={imageFile ? URL.createObjectURL(imageFile) : previewImage} 
                        alt="Artist Preview" 
                        className="w-16 h-16 object-cover rounded-lg border-2 border-primary/20 shadow-md transition-transform hover:scale-105" 
                        // 💡 Memory Leak se bachne ke liye cleanup
                        onLoad={() => { if(imageFile) URL.revokeObjectURL(URL.createObjectURL(imageFile)) }}
                        onError={(e) => { e.target.src = "https://placehold.co/100x100?text=Error"; }}
                    />
                    
                    {/* Display Badge for context */}
                    <span className="absolute -bottom-1 -right-1 bg-primary text-[8px] text-white px-1 rounded font-bold uppercase">
                        {imageFile ? "New" : "Saved"}
                    </span>
                </div>
            )}

            <div className="flex flex-col gap-2">
                <input 
                    type="file" 
                    id="picture" 
                    className="hidden" 
                    onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) setImageFile(file);
                    }} 
                    accept="image/*" 
                />
                
                <div className="flex items-center gap-3">
                    <label 
                        htmlFor="picture" 
                        className="cursor-pointer bg-cream-100 border border-cream-200 px-4 py-1.5 rounded text-[11px] font-bold uppercase hover:bg-cream-200 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap active:scale-95"
                    >
                        <Upload size={14} /> 
                        {previewImage || imageFile ? "Change Image" : "Upload Image"}
                    </label>
                    
                    {/* Selection Cancel Button */}
                    {imageFile && (
                        <button 
                            type="button" 
                            onClick={() => setImageFile(null)} 
                            className="text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors"
                            title="Remove Selection"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
                
                {imageFile && (
                    <div className="flex items-center gap-1 text-primary font-bold animate-pulse">
                        <Check size={12} />
                        <span className="text-[10px] italic truncate max-w-[120px]">{imageFile.name}</span>
                    </div>
                )}
            </div>
        </div>
    </div>
</div>

            {/* Role */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center border-b border-cream-50 pb-4">
              <label className="md:col-span-3 text-left md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Role</label>
              <div className="md:col-span-9">
                <input name="role" value={formData.role} onChange={handleChange} className="theme-input w-full" placeholder="e.g. Singer, Director" />
              </div>
            </div>

            {/* Origin */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center border-b border-cream-50 pb-4">
              <label className="md:col-span-3 text-left md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Origin</label>
              <div className="md:col-span-9">
                <input name="origin" value={formData.origin} onChange={handleChange} className="theme-input w-full" placeholder="e.g. USA, India" />
              </div>
            </div>

            {/* Profile Editor */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start border-b border-cream-50 pb-6">
              <label className="md:col-span-3 text-left md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2">Profile</label>
              <div className="md:col-span-9 w-full"> 
                <div className="border rounded-md overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/10">
                   <JoditEditor ref={editor} value={profile} config={config} onBlur={c => setProfile(c)} />
                </div>
              </div>
            </div>

            {/* --- ACTION BUTTONS (Stack on mobile, row on desktop) --- */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-8 border-t mt-4 font-montserrat">
              <button onClick={(e) => handleSubmit(e, 'stay')} disabled={loading} className="w-full sm:w-auto bg-primary text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md hover:brightness-110 active:scale-95 transition-all flex justify-center items-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} Update
              </button>
              
              <button onClick={(e) => handleSubmit(e, 'back')} disabled={loading} className="w-full sm:w-auto bg-text-main text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md hover:opacity-90 active:scale-95 transition-all flex justify-center items-center gap-2">
                <RotateCcw size={14}/> Update & go back
              </button>

              <button type="button" onClick={() => navigate('/admin/artists')} className="w-full sm:w-auto bg-white border border-cream-200 text-text-main px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-sm hover:bg-cream-50 active:scale-95 transition-all flex justify-center items-center gap-2">
                <X size={14} className="text-red-600" /> Cancel
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .theme-input { 
          border: 1px solid #e6decd; 
          border-radius: 4px; 
          padding: 8px 14px; 
          font-size: 13px; 
          outline: none; 
          transition: all 0.2s ease-in-out; 
          background: #fffdf5;
          font-family: 'Roboto', sans-serif;
        }
        .theme-input:focus { 
          border-color: #008DDA; 
          box-shadow: 0 0 0 3px rgba(0, 141, 218, 0.15); 
          background: white;
        }
      `}</style>
    </div>
  );
};

export default EditArtist;