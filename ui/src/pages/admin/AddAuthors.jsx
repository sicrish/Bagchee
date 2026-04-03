import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, X, Upload, Loader2, XCircle } from 'lucide-react';
import JoditEditor from '../../components/admin/LazyJoditEditor';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { validateImageFiles } from '../../utils/fileValidator';

const AddAuthors = () => {
  const navigate = useNavigate();
  const editor = useRef(null);
  const fileInputRef = useRef(null); // 🟢 Input ko control karne ke liye ref
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // 🟢 Preview ke liye naya state

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    origin: '',
  });

  const [profile, setProfile] = useState('');

  // Memory Leak bachane ke liye (Jab component unmount ho, preview URL delete karo)
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  // 🟢 Image Handler with Validation & Preview
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (validateImageFiles(file)) {
      setImageFile(file);
      // Nayi image ka preview link banao
      setImagePreview(URL.createObjectURL(file)); 
    } else {
      e.target.value = ""; 
      setImagePreview(null);
    }
  }, []);

  // 🟢 Remove Image Logic
  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview); // Memory free karo
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Input clear karo
    }
  }, [imagePreview]);

  const saveAuthorMutation = useMutation({
    mutationFn: async (submitData) => {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API_URL}/authors/save`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    }
  });

  const handleSubmit = (e, actionType) => {
    e.preventDefault();
    if (!formData.first_name) return toast.error("First name is required!");

    const toastId = toast.loading("Saving author...");

    const data = new FormData();
    data.append('first_name', formData.first_name);
    data.append('last_name', formData.last_name);
    data.append('origin', formData.origin);
    data.append('profile', profile);
    if (imageFile) data.append('picture', imageFile);

    saveAuthorMutation.mutate(data, {
      onSuccess: (resData) => {
        if (resData.status) {
          toast.success("Author added successfully! ✍️", { id: toastId });
          if (actionType === 'back') {
            navigate('/admin/authors');
          } else {
            setFormData({ first_name: '', last_name: '', origin: '' });
            setProfile('');
            handleRemoveImage(); // Form submit ke baad image aur preview clear karo
          }
        } else {
          toast.error(resData.msg || "Failed to save", { id: toastId });
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.msg || "Failed to save", { id: toastId });
      }
    });
  };

  const config = useMemo(() => ({
    readonly: false,
    height: 300,
    theme: "default",
    placeholder: 'Enter author profile details...',
    buttons: [
      'source', 'save', 'print', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
      'superscript', 'subscript', '|', 'ul', 'ol', '|', 'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|', 'image', 'table', 'link', '|',
      'align', 'undo', 'redo', '|', 'hr', 'eraser', 'fullsize'
    ],
  }), []);

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Add Authors
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="bg-cream-100 px-6 py-3 border-b border-cream-200">
             <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">Author Information</h2>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">First name*</label>
              <div className="col-span-9">
                <input name="first_name" value={formData.first_name} onChange={handleChange} className="theme-input w-full" placeholder="Enter first name" />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Last name</label>
              <div className="col-span-9">
                <input name="last_name" value={formData.last_name} onChange={handleChange} className="theme-input w-full" placeholder="Enter last name" />
              </div>
            </div>

            {/* 🟢 Picture Upload & Preview Area */}
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
                  <label htmlFor="picture" className="cursor-pointer bg-cream-100 border border-cream-200 px-4 py-1.5 rounded text-[11px] font-bold uppercase hover:bg-cream-200 transition-all flex items-center gap-2 shadow-sm">
                    <Upload size={14} /> {imageFile ? "Change file" : "Upload a file"}
                  </label>
                </div>

                {/* MNC Level Premium Image Preview */}
                {imagePreview && (
                  <div className="relative inline-block mt-2 w-24 h-24 border border-cream-200 rounded-md shadow-sm p-1 bg-white group">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover rounded-sm"
                    />
                    {/* Delete Cross Button */}
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-white rounded-full shadow-md text-red-500 hover:text-red-700 hover:scale-110 transition-all z-10"
                      title="Remove image"
                    >
                      <XCircle size={20} className="fill-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Origin</label>
              <div className="col-span-9">
                <input name="origin" value={formData.origin} onChange={handleChange} className="theme-input w-full" placeholder="e.g. India, UK" />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-start border-b border-cream-50 pb-6">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2">Profile</label>
              <div className="col-span-9 border rounded-md overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/10">
                <JoditEditor ref={editor} value={profile} config={config} onBlur={c => setProfile(c)} />
              </div>
            </div>

            <div className="flex justify-center items-center gap-4 pt-8 border-t mt-4 font-montserrat">
              <button type="button" onClick={(e) => handleSubmit(e, 'stay')} disabled={saveAuthorMutation.isPending} className="bg-primary text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70">
                {saveAuthorMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} Save
              </button>
              
              <button type="button" onClick={(e) => handleSubmit(e, 'back')} disabled={saveAuthorMutation.isPending} className="bg-text-main text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70">
                <RotateCcw size={14}/> Save & go back to list
              </button>

              <button type="button" onClick={() => navigate('/admin/authors')} disabled={saveAuthorMutation.isPending} className="bg-white border border-cream-200 text-text-main px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-sm hover:bg-cream-50 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70">
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

export default AddAuthors;