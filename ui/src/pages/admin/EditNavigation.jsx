import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2 } from 'lucide-react';
import JoditEditor from 'jodit-react';
import axios from '../../utils/axiosConfig';

import toast from 'react-hot-toast';

const EditNavigation = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const editor = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    item: '',
    link: '',
    dropdown: 'inactive',
    active: 'active',
    order: ''
  });

  const [dropdownContent, setDropdownContent] = useState('');

  useEffect(() => {
    const fetchNavData = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await axios.get(`${API_URL}/navigation/get/${id}`);
        
        if (res.data.status) {
          const nav = res.data.data;
          setFormData({
            item: nav.item || '',
            link: nav.link || '',
            dropdown: nav.dropdown || 'inactive',
            active: nav.active || 'active',
            order: nav.order || ''
          });
          setDropdownContent(nav.dropdown_content || '');
        }
      } catch (error) {
        console.error(error);
        toast.error("Error loading navigation data");
        navigate('/admin/navigation');
      } finally {
        setFetching(false);
      }
    };
    if (id) fetchNavData();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Updating navigation...");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      
      // 🟢 CHANGE HERE: Mapping data to match Backend Controller
      const finalData = { 
          name: formData.item,       // Backend 'name' mangta hai, humare paas 'item' hai
          link: formData.link,
          order: formData.order,
          status: formData.active,   // Backend 'status' mangta hai, humare paas 'active' hai
          // Agar dropdown ka data backend me save karna hai to ye bhi bhejein, 
          // par controller me 'dropdown_content' handle hona chahiye.
          dropdown: formData.dropdown, 
          dropdown_content: dropdownContent 
      };

      const res = await axios.patch(`${API_URL}/navigation/update/${id}`, finalData);

      if (res.data.status) {
        toast.success("Navigation Updated! ✨", { id: toastId });
        if (actionType === 'back') {
          navigate('/admin/navigation');
        }
      }
    } catch (error) {
      console.error(error); // Error print karein taaki pata chale
      // Backend ka specific error message dikhane ke liye:
      const errorMsg = error.response?.data?.msg || "Update failed";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const config = useMemo(() => ({
    readonly: false,
    height: 300,
    theme: "default",
    buttons: [
      'source', '|', 'bold', 'italic', 'underline', '|', 'ul', 'ol', '|', 'font', 'fontsize', '|', 'image', 'table', 'link', '|', 'align', 'undo', 'redo'
    ],
  }), []);

  if (fetching) return (
    <div className="h-screen flex justify-center items-center bg-cream-50">
      <Loader2 className="animate-spin text-primary" size={40}/>
    </div>
  );

  return (
    // 🟢 bg-cream-50 (F7EEDD) and font-body (Roboto) from config
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10">
      
      {/* 🔵 TOP HEADER BAR (Primary Theme #008DDA) */}
      <div className="bg-primary  px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-slick font-display">
          Edit Navigation: <span className="text-cream-200">{formData.item}</span>
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
          
          <div className="bg-cream-50 px-6 py-3 border-b border-cream-200">
             <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">Update Details</h2>
          </div>

          <div className="p-8 space-y-6">
            {/* Item Name */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Item*</label>
              <div className="col-span-9">
                <input name="item" value={formData.item} onChange={handleChange} className="theme-input w-full" />
              </div>
            </div>

            {/* Link */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Link*</label>
              <div className="col-span-9">
                <input name="link" value={formData.link} onChange={handleChange} className="theme-input w-full" />
              </div>
            </div>

            {/* Dropdown Radios */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Dropdown</label>
              <div className="col-span-9 flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer text-text-main hover:text-primary transition-colors">
                  <input type="radio" name="dropdown" value="active" checked={formData.dropdown === "active"} onChange={handleChange} className="accent-primary w-4 h-4" /> active
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-text-main hover:text-primary transition-colors">
                  <input type="radio" name="dropdown" value="inactive" checked={formData.dropdown === "inactive"} onChange={handleChange} className="accent-primary w-4 h-4" /> inactive
                </label>
              </div>
            </div>

            {/* Editor */}
            <div className="grid grid-cols-12 gap-4 items-start border-b border-cream-50 pb-6">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2">Dropdown content</label>
              <div className="col-span-9 border rounded shadow-sm">
                <JoditEditor ref={editor} value={dropdownContent} config={config} onBlur={c => setDropdownContent(c)} />
              </div>
            </div>

            {/* Active Radios */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Status</label>
              <div className="col-span-9 flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer text-text-main hover:text-primary transition-colors">
                  <input type="radio" name="active" value="active" checked={formData.active === "active"} onChange={handleChange} className="accent-primary w-4 h-4" /> active
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-text-main hover:text-primary transition-colors">
                  <input type="radio" name="active" value="inactive" checked={formData.active === "inactive"} onChange={handleChange} className="accent-primary w-4 h-4" /> inactive
                </label>
              </div>
            </div>

            {/* Order */}
            <div className="grid grid-cols-12 gap-4 items-center pb-6">
              <label className="col-span-3 text-right text-[11px] font-bold text-text-muted uppercase font-montserrat">Order</label>
              <div className="col-span-9">
                <input name="order" type="number" value={formData.order} onChange={handleChange} className="theme-input w-32 font-bold" />
              </div>
            </div>

            {/* --- ACTION BUTTONS (Montserrat from config) --- */}
            <div className="flex justify-center items-center gap-4 pt-8 border-t mt-4">
              <button 
                onClick={(e) => handleSubmit(e, 'stay')} 
                disabled={loading} 
                className="bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded font-montserrat font-bold text-[10px] uppercase shadow-md active:scale-95 transition-all"
              >
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Check size={14} className="mr-2 inline"/>} Update
              </button>
              
              <button 
                onClick={(e) => handleSubmit(e, 'back')} 
                disabled={loading} 
                className="bg-text-main hover:opacity-90 text-white px-8 py-2.5 rounded font-montserrat font-bold text-[10px] uppercase shadow-md active:scale-95 transition-all"
              >
                <RotateCcw size={14} className="mr-2 inline"/> Save & go back to list
              </button>
              
              <button 
                type="button" 
                onClick={() => navigate('/admin/navigation')} 
                className="bg-white border border-cream-200 hover:bg-cream-50 px-8 py-2.5 rounded font-montserrat font-bold text-[10px] uppercase shadow-sm text-text-main transition-colors"
              >
                <X size={14} className="mr-2 inline text-red-600" /> Cancel
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
          transition: 0.2s; 
          background: #fffdf5; 
          color: #0B2F3A; 
        }
        .theme-input:focus { 
          border-color: #008DDA; 
          box-shadow: 0 0 0 3px rgba(0, 141, 218, 0.15); 
          background: #FFFFFF;
        }
      `}</style>
    </div>
  );
};

export default EditNavigation;