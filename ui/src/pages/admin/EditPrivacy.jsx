import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const EditPrivacy = () => {
  const navigate = useNavigate();
  const editor = useRef(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
  });
  const [pageContent, setPageContent] = useState('');

  useEffect(() => {
    const fetchPrivacyData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await axios.get(`${API_URL}/privacy/get`); 
        if (res.data.status && res.data.data) {
          const d = res.data.data;
          setFormData({
            title: d.title || '',
            meta_title: d.meta_title || d.meta_title || '',
            meta_description: d.meta_description || d.meta_description || '',
            meta_keywords: d.meta_keywords || d.meta_keywords || '',
          });
          setPageContent(d.page_content || d.page_content || '');
        }
      } catch (error) {
        console.error("Fetch Error");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchPrivacyData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Updating Privacy Policy...");

    try {
      const payload = { ...formData, page_content: page_content };
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.patch(`${API_URL}/privacy/update`, payload);

      if (res.data.status) {
        toast.success("Privacy Policy updated successfully!", { id: toastId });
        if (actionType === 'back') navigate('/admin/pages');
      }
    } catch (error) {
      toast.error("Failed to update", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const config = useMemo(() => ({
    readonly: false,
    height: 450,
    theme: "default",
    placeholder: 'Enter privacy policy content here...',
    buttons: ['source', '|', 'bold', 'italic', 'underline', '|', 'font', 'fontsize', 'brush', 'align', 'undo', 'redo']
  }), []);

  const inputClass = "w-full border border-gray-300 rounded px-4 py-2 text-[13px] outline-none transition-all focus:border-primary bg-white focus:ring-1 focus:ring-primary/20 font-body";
  const labelClass = "col-span-12 md:col-span-2 text-left md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2";

  if (initialLoading) return <div className="min-h-screen flex items-center justify-center bg-cream-50"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      <div className="bg-primary px-6 py-3 shadow-md text-white font-display font-bold uppercase tracking-widest">
        Edit Privacy Policy
      </div>

      <div className="max-w-[1400px] mx-auto p-4 md:p-6 mt-2">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden p-8 space-y-8">
          
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className={labelClass}>Title</label>
            <div className="col-span-12 md:col-span-10">
              <input name="title" value={formData.title} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 items-start">
            <label className={labelClass}>Page content</label>
            <div className="col-span-12 md:col-span-10 border rounded overflow-hidden shadow-inner">
              <JoditEditor value={pageContent} config={config} onBlur={c => setPageContent(c)} />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-cream-100">
            {['meta_title', 'meta_description', 'meta_keywords'].map((field) => (
              <div key={field} className="grid grid-cols-12 gap-4 items-center">
                <label className={labelClass}>{field.replace('_', ' ')}</label>
                <div className="col-span-12 md:col-span-10">
                  <input name={field} value={formData[field]} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center gap-4 pt-8 border-t mt-10">
            <button type="button" onClick={(e) => handleSubmit(e, 'stay')} className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-8 py-2.5 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm">
              {loading ? <Loader2 size={14} className="animate-spin"/> : <Check size={16} className="text-green-600"/>} 
              Update changes
            </button>
            <button type="button" onClick={(e) => handleSubmit(e, 'back')} className="bg-white border border-gray-300 hover:bg-gray-50 text-text-main px-8 py-2.5 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm">
              <RotateCcw size={16} className="text-primary"/> Update and go back
            </button>
            <button type="button" onClick={() => navigate('/admin/pages')} className="bg-white border border-gray-300 hover:bg-red-50 text-text-main px-8 py-2.5 rounded font-bold text-[11px] uppercase transition-all flex items-center gap-2 shadow-sm">
              <X size={16} className="text-red-600" /> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPrivacy;