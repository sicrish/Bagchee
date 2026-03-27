import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, LayoutPanelTop, TriangleAlert, Plus,Edit } from 'lucide-react';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const AddEditFooter = () => {
  const { id } = useParams(); // URL mein ID hai toh Edit mode, warna Add mode
  const navigate = useNavigate();
  const editor = useRef(null);
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode); // Sirf edit mode mein loading dikhayega

  // Form State
  const [formData, setFormData] = useState({
    name: '',       // e.g. Column 5
    title: '',      // e.g. SOCIAL LINKS
    subtitle: '',   // e.g. Follow us
  });

  const [content, setContent] = useState(''); // Editor content

  // 🟢 1. FETCH DATA (Sirf Edit Mode ke liye)
  useEffect(() => {
    if (isEditMode) {
      const fetchFooterDetail = async () => {
        setFetching(true);
        try {
          const API_URL = process.env.REACT_APP_API_URL;
          const res = await axios.get(`${API_URL}/footer/get/${id}`);
          if (res.data.status) {
            const data = res.data.data;
            setFormData({
              name: data.name || '',
              title: data.title || '',
              subtitle: data.subtitle || '',
            });
            setContent(data.content || '');
          }
        } catch (error) {
          console.error("Fetch Error:", error);
          toast.error("Failed to load footer details");
          navigate('/admin/footer');
        } finally {
          setFetching(false);
        }
      };
      fetchFooterDetail();
    }
  }, [id, isEditMode, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🟢 2. SUBMIT LOGIC (Dynamic: Save or Update)
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();

    if (!formData.name) return toast.error("Column Name is required!");

    setLoading(true);
    const toastId = toast.loading(isEditMode ? "Updating column..." : "Saving new column...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const finalData = { ...formData, content: content };

      let res;
      if (isEditMode) {
        // Edit Mode: PATCH use karein
        res = await axios.patch(`${API_URL}/footer/update/${id}`, finalData);
      } else {
        // Add Mode: POST use karein
        res = await axios.post(`${API_URL}/footer/save`, finalData);
      }

      if (res.data.status) {
        toast.success(res.data.msg || "Success!", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/footer');
        } else if (!isEditMode) {
          // Reset form agar naya add kiya hai aur wahi rehna hai
          setFormData({ name: '', title: '', subtitle: '' });
          setContent('');
        }
      }
    } catch (error) {
      console.error("Submit Error:", error);
      const errorMsg = error.response?.data?.msg || "Operation failed";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const config = useMemo(() => ({
    readonly: false,
    height: 400,
    placeholder: 'Enter column links and information...',
    theme: "default",
    toolbarSticky: false,
    buttons: [
      'source', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
      'superscript', 'subscript', '|', 'ul', 'ol', '|', 'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|', 'image', 'table', 'link', '|',
      'align', 'undo', 'redo', '|', 'hr', 'eraser', 'fullsize'
    ],
  }), []);

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="flex flex-col items-center gap-2 font-montserrat">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-text-muted font-bold text-xs uppercase tracking-widest">Loading Configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 HEADER BAR */}
      <div className="bg-primary px-6 py-4 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-tight font-montserrat flex items-center gap-2">
          {isEditMode ? <Edit size={20} /> : <Plus size={20} />} 
          {isEditMode ? "Edit Footer Column" : "Add New Footer Column"}
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <form className="bg-white rounded-xl border border-cream-200 shadow-lg overflow-hidden">
          
          <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 flex items-center gap-2">
             <TriangleAlert size={14} className="text-accent" />
             <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest font-montserrat">
               {isEditMode ? "Edit Content Configuration" : "New Column Setup"}
             </h2>
          </div>

          <div className="p-6 md:p-10 space-y-8">
            
            {/* 1. Name Field (Edit mein read-only, Add mein editable) */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-12 md:col-span-3 text-left md:text-right text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">
                Column Name*
              </label>
              <div className="col-span-12 md:col-span-7">
                <input 
                  name="name"
                  value={formData.name} 
                  onChange={handleChange}
                  disabled={isEditMode} // Edit mode mein reference change nahi karne dena chahiye
                  className={`theme-input w-full ${isEditMode ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-dashed' : 'bg-white'}`} 
                  placeholder="e.g. Column 5"
                />
                {!isEditMode && <p className="text-[10px] text-gray-400 mt-1 italic">Use a unique name like 'Column 5' or 'Contact Column'</p>}
              </div>
            </div>

            {/* 2. Main Title */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-6">
              <label className="col-span-12 md:col-span-3 text-left md:text-right text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">
                Title
              </label>
              <div className="col-span-12 md:col-span-7">
                <input 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  className="theme-input w-full" 
                  placeholder="e.g. HELP or QUICK LINKS"
                />
              </div>
            </div>

            {/* 3. Subtitle */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-6">
              <label className="col-span-12 md:col-span-3 text-left md:text-right text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">
                Subtitle
              </label>
              <div className="col-span-12 md:col-span-7">
                <input 
                  name="subtitle" 
                  value={formData.subtitle} 
                  onChange={handleChange} 
                  className="theme-input w-full" 
                  placeholder="Additional tagline or description"
                />
              </div>
            </div>

            {/* 4. Content (Editor) */}
            <div className="grid grid-cols-12 gap-4 items-start pb-4">
              <label className="col-span-12 md:col-span-3 text-left md:text-right text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat pt-2">
                Column Content
              </label>
              <div className="col-span-12 md:col-span-9 border rounded-lg overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <JoditEditor 
                  ref={editor}
                  value={content} 
                  config={config} 
                  onBlur={newContent => setContent(newContent)} 
                />
              </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="flex justify-center items-center gap-4 pt-10 border-t border-gray-100 font-montserrat">
              <button 
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={loading}
                type="button"
                className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg font-bold text-[11px] uppercase shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
              >
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Check size={16} strokeWidth={3}/>} 
                {isEditMode ? "Update changes" : "Save Column"}
              </button>
              
              <button 
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={loading}
                type="button"
                className="flex items-center gap-2 bg-gray-800 text-white px-8 py-3 rounded-lg font-bold text-[11px] uppercase shadow-md hover:bg-black active:scale-95 transition-all text-nowrap"
              >
                <RotateCcw size={16} /> {isEditMode ? "Update & Go back" : "Save & Go back"}
              </button>

              <button 
                type="button"
                onClick={() => navigate('/admin/footer')} 
                className="flex items-center gap-2 bg-white border border-gray-300 px-8 py-3 rounded-lg font-bold text-[11px] uppercase shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-95 transition-all text-text-muted"
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .theme-input { 
          border: 1px solid #e2e8f0; 
          border-radius: 8px; 
          padding: 12px 16px; 
          font-size: 14px; 
          outline: none; 
          transition: all 0.2s ease; 
          background: white;
          color: #1a202c;
        }
        .theme-input:focus { 
          border-color: #008DDA; 
          box-shadow: 0 0 0 4px rgba(0, 141, 218, 0.1); 
        }
      `}</style>
    </div>
  );
};

export default AddEditFooter;