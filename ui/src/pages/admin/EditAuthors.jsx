import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Upload, Loader2, XCircle } from 'lucide-react'; // 🟢 XCircle import kiya
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { validateImageFiles } from '../../utils/fileValidator'; // 🟢 Validation Import kiya

const EditAuthors = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editor = useRef(null);
  const fileInputRef = useRef(null); // 🟢 Input control ke liye

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null); // 🟢 Server wali purani image
  const [localPreview, setLocalPreview] = useState(null); // 🟢 Nayi select ki hui image ka preview

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    origin: '',
  });

  const [profile, setProfile] = useState('');

  // 🟢 1. Existing Author Data fetch karein
  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await axios.get(`${API_URL}/authors/get/${id}`);

        if (res.data.status) {
          const author = res.data.data;
          setFormData({
            first_name: author.firstName || '',
            last_name: author.lastName || '',
            origin: author.origin || '',
          });
          setProfile(author.profile || '');
          if (author.picture) {
            setPreviewImage(`${API_URL}${author.picture}`); // Purani image dikhane ke liye
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Error loading author data");
        navigate('/admin/authors');
      } finally {
        setFetching(false);
      }
    };
    if (id) fetchAuthorData();
  }, [id, navigate]);

  // 🟢 Memory cleanup for local preview
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🟢 Image Handler with Validation & Local Preview
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (validateImageFiles(file)) {
      setImageFile(file);
      setLocalPreview(URL.createObjectURL(file)); // Naya temporary URL banaya
    } else {
      e.target.value = ""; 
      setLocalPreview(null);
    }
  }, []);

  // 🟢 Remove NEW Image Logic (Purani image wapas layega)
  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    if (localPreview) {
      URL.revokeObjectURL(localPreview); // Memory free
    }
    setLocalPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Form input clear
    }
  }, [localPreview]);

  // 🟢 2. Update Logic
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.first_name.trim()) return toast.error("First name is required!");

    setLoading(true);
    const toastId = toast.loading("Updating author...");

    try {
      const data = new FormData();
      data.append('first_name', formData.first_name);
      data.append('last_name', formData.last_name);
      data.append('origin', formData.origin);
      data.append('profile', profile);
      if (imageFile) data.append('picture', imageFile);

      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.patch(`${API_URL}/authors/update/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.status) {
        toast.success("Author updated successfully! ✨", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/authors');
        } else {
          // Stay hone par nayi image ko server image maan lo
          if (localPreview) {
            setPreviewImage(localPreview);
            setLocalPreview(null);
            setImageFile(null);
          }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Update failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const config = useMemo(() => ({
    readonly: false,
    height: 300,
    theme: "default",
    placeholder: 'Edit author profile details...',
    buttons: [
      'source', 'save', 'print', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
      'superscript', 'subscript', '|', 'ul', 'ol', '|', 'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|', 'image', 'table', 'link', '|',
      'align', 'undo', 'redo', '|', 'hr', 'eraser', 'fullsize'
    ],
  }), []);

  if (fetching) return (
    <div className="h-screen flex justify-center items-center bg-cream-50">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">

      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Edit Author: <span className="text-cream-200">{formData.first_name}</span>
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">

          <div className="bg-cream-100 px-6 py-3 border-b border-cream-200">
            <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">Update Information</h2>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">First name*</label>
              <div className="col-span-9">
                <input name="first_name" value={formData.first_name} onChange={handleChange} className="theme-input w-full" />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Last name</label>
              <div className="col-span-9">
                <input name="last_name" value={formData.last_name} onChange={handleChange} className="theme-input w-full" />
              </div>
            </div>

            {/* 🟢 Picture Upload & Smart Preview */}
            <div className="grid grid-cols-12 gap-4 items-start border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2">Picture</label>
              <div className="col-span-9 flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="picture"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                  <label
                    htmlFor="picture"
                    className="cursor-pointer bg-cream-100 border border-cream-200 px-4 py-1.5 rounded text-[11px] font-bold uppercase hover:bg-cream-200 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Upload size={14} />
                    {localPreview || previewImage ? "Change picture" : "Upload picture"}
                  </label>
                </div>

                {/* MNC Level Premium Image Preview (Local ya Server dono me se ek dikhega) */}
                {(localPreview || previewImage) && (
                  <div className="relative inline-block mt-2 w-24 h-24 border border-cream-200 rounded-md shadow-sm p-1 bg-white group">
                    <img
                      src={localPreview || previewImage}
                      alt="Author Preview"
                      className="w-full h-full object-cover rounded-sm"
                    />
                    
                    {/* Delete Cross Button (Sirf tab dikhega jab NAYI file select ki ho) */}
                    {localPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-white rounded-full shadow-md text-red-500 hover:text-red-700 hover:scale-110 transition-all z-10"
                        title="Remove new image"
                      >
                        <XCircle size={20} className="fill-white" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Origin</label>
              <div className="col-span-9">
                <input name="origin" value={formData.origin} onChange={handleChange} className="theme-input w-full" />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-start border-b border-cream-50 pb-6">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2">Profile</label>
              <div className="col-span-9 border rounded-md overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/10">
                <JoditEditor ref={editor} value={profile} config={config} onBlur={c => setProfile(c)} />
              </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="flex justify-center items-center gap-4 pt-8 border-t mt-4 font-montserrat">
              <button type="button" onClick={(e) => handleSubmit(e, 'stay')} disabled={loading} className="bg-primary text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Update
              </button>

              <button type="button" onClick={(e) => handleSubmit(e, 'back')} disabled={loading} className="bg-text-main text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-2">
                <RotateCcw size={14} /> Update & go back to list
              </button>

              <button type="button" onClick={() => navigate('/admin/authors')} className="bg-white border border-cream-200 text-text-main px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-sm hover:bg-cream-50 active:scale-95 transition-all flex items-center gap-2">
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

export default EditAuthors;