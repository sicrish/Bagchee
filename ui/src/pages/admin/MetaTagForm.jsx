import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const MetaTagForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  const [formData, setFormData] = useState({
    pageUrl: '',
    title: '',
    metaTitle: '',
    metaDesc: '',
    metaKeywords: '',
  });

  useEffect(() => {
    if (!isEdit) return;
    const fetch = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/meta-tags/get/${id}`);
        if (res.data.status) setFormData(res.data.data);
      } catch {
        toast.error('Failed to load meta tag');
        navigate('/admin/meta-tags');
      } finally {
        setInitialLoading(false);
      }
    };
    fetch();
  }, [id, isEdit, navigate]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.pageUrl.trim()) return toast.error('Page URL is required!');

    setLoading(true);
    const toastId = toast.loading(isEdit ? 'Updating...' : 'Saving...');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/meta-tags/save`, {
        id: isEdit ? id : undefined,
        ...formData
      });
      if (res.data.status) {
        toast.success(res.data.msg, { id: toastId });
        if (actionType === 'back') navigate('/admin/meta-tags');
        else if (!isEdit) setFormData({ pageUrl: '', title: '', metaTitle: '', metaDesc: '', metaKeywords: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Operation failed', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full border border-[#e6decd] rounded-[4px] px-3.5 py-2 text-[13px] outline-none transition-all bg-[#fffdf5] focus:bg-white focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,141,218,0.15)] font-body`;

  if (initialLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 text-primary">
      <Loader2 className="animate-spin" size={32} />
    </div>
  );

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          {isEdit ? 'Edit Meta Tag' : 'Add Meta Tag'}
        </h1>
      </div>

      <div className="max-w-4xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          <div className="bg-cream-100 px-6 py-3 border-b border-cream-200">
            <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">Meta Tag Details</h2>
          </div>

          <div className="p-8 space-y-5">
            {[
              { label: 'Page URL *', name: 'pageUrl', placeholder: 'e.g. /home or /books/history' },
              { label: 'Title', name: 'title', placeholder: 'e.g. Home | Bagchee' },
              { label: 'Meta Title', name: 'metaTitle', placeholder: 'e.g. Bagchee – Books That Stick' },
              { label: 'Meta Description', name: 'metaDesc', placeholder: 'Short description for search engines...' },
              { label: 'Meta Keywords', name: 'metaKeywords', placeholder: 'e.g. books, indian books, bagchee' },
            ].map(({ label, name, placeholder }) => (
              <div key={name} className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
                <label className="col-span-12 md:col-span-3 md:text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">
                  {label}
                </label>
                <div className="col-span-12 md:col-span-9">
                  {name === 'metaDesc' ? (
                    <textarea
                      name={name}
                      value={formData[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      rows={3}
                      className={`${inputClass} resize-none`}
                    />
                  ) : (
                    <input
                      type="text"
                      name={name}
                      value={formData[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      className={inputClass}
                    />
                  )}
                </div>
              </div>
            ))}

            <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-8 border-t mt-4 font-montserrat">
              <button onClick={(e) => handleSubmit(e, 'stay')} disabled={loading} className="w-full md:w-auto bg-primary text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md flex items-center justify-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {isEdit ? 'Update' : 'Save'}
              </button>
              <button onClick={(e) => handleSubmit(e, 'back')} disabled={loading} className="w-full md:w-auto bg-text-main text-white px-8 py-2.5 rounded font-bold text-[10px] uppercase shadow-md flex items-center justify-center gap-2">
                <RotateCcw size={14} /> {isEdit ? 'Update & Go Back' : 'Save & Go Back'}
              </button>
              <button type="button" onClick={() => navigate('/admin/meta-tags')} className="w-full md:w-auto bg-white border border-cream-200 text-text-main px-8 py-2.5 rounded font-bold text-[10px] uppercase flex items-center justify-center gap-2">
                <X size={14} className="text-red-600" /> Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MetaTagForm;
