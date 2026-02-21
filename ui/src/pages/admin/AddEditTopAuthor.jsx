import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, Search, User, BookOpen, ChevronDown } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const AddEditTopAuthor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  // --- SEARCH STATES ---
  const [authorSearch, setAuthorSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [authorResults, setAuthorResults] = useState([]);
  const [bookResults, setBookResults] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null); 
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState({
    authorId: '',
    bookId: '',
    role: '',
    quote: '',
    active: 'yes', // Default 'yes' for dropdown
    order: ''
  });

  // 🟢 1. FETCH DATA (EDIT MODE)
  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/top-authors/get/${id}`);
          if (res.data.status) {
            const d = res.data.data;
            setFormData({
              authorId: d.authorId?._id || '',
              bookId: d.bookId?._id || '',
              role: d.role || '',
              quote: d.quote || '',
              active: d.active ? 'yes' : 'no',
              order: d.order || ''
            });
            setAuthorSearch(`${d.authorId?.first_name} ${d.authorId?.last_name}`);
            setBookSearch(d.bookId?.title || "");
          }
        } catch (error) {
          toast.error("Failed to load details");
          navigate('/admin/top-authors');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchData();
    }
  }, [id, isEdit, navigate]);

  // 🟢 2. DUAL SEARCH HANDLER
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const API_URL = process.env.REACT_APP_API_URL;

      if (authorSearch.length > 2 && activeDropdown === 'author') {
        setIsSearching(true);
        try {
          const res = await axios.get(`${API_URL}/authors/list?q=${authorSearch}`);
          if (res.data.status) setAuthorResults(res.data.data);
        } finally { setIsSearching(false); }
      } 
      else if (bookSearch.length > 2 && activeDropdown === 'book') {
        setIsSearching(true);
        try {
          const res = await axios.get(`${API_URL}/top-authors/search-inventory?q=${bookSearch}`);
          if (res.data.status) setBookResults(res.data.data);
        } finally { setIsSearching(false); }
      }
      else {
        setAuthorResults([]);
        setBookResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [authorSearch, bookSearch, activeDropdown]);

  // 🟢 3. SELECTION HANDLERS
  const handleSelectAuthor = (author) => {
    setFormData({ ...formData, authorId: author._id });
    setAuthorSearch(`${author.first_name} ${author.last_name}`);
    setActiveDropdown(null);
  };

  const handleSelectBook = (book) => {
    setFormData({ ...formData, bookId: book._id });
    setBookSearch(book.title);
    setActiveDropdown(null);
  };

  // 🟢 4. SUBMIT HANDLER
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.authorId || !formData.bookId) return toast.error("Author and Book are required!");

    setLoading(true);
    const toastId = toast.loading("Saving featured author...");

    try {
      const payload = { ...formData, active: formData.active === 'yes' };
      const url = isEdit ? `/top-authors/update/${id}` : `/top-authors/save`;
      
      const res = await axios[isEdit ? 'patch' : 'post'](`${process.env.REACT_APP_API_URL}${url}`, payload);

      if (res.data.status) {
        toast.success("Saved successfully! ✨", { id: toastId });
        if (actionType === 'back') navigate('/admin/top-authors');
      }
    } catch (error) {
      toast.error("Operation failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full border border-[#e6decd] rounded-[4px] px-3.5 py-2 text-[13px] outline-none transition-all duration-200 bg-[#fffdf5] focus:bg-white focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,141,218,0.15)] font-body`;

  if (initialLoading) return <div className="min-h-screen flex items-center justify-center bg-cream-50"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div className="bg-cream-50 min-h-screen font-body text-text-main pb-10" onClick={() => setActiveDropdown(null)}>
      
      <div className="bg-primary px-6 py-3 shadow-md text-white font-display font-bold uppercase tracking-slick">
          {isEdit ? "Edit Featured Author" : "Add Featured Author"}
      </div>

      <div className="max-w-5xl mx-auto p-6 mt-4">
        <form className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="bg-cream-100 px-6 py-3 border-b border-cream-200">
             <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-montserrat">Search & Details</h2>
          </div>

          <div className="p-8 space-y-6">
            
            {/* AUTHOR SEARCH */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4 relative z-[60]">
              <label className="col-span-12 md:col-span-3 md:text-right text-left text-[11px] font-bold text-text-muted uppercase font-montserrat">Author Name*</label>
              <div className="col-span-12 md:col-span-9 relative" onClick={(e) => e.stopPropagation()}>
                <div className="relative">
                  <input 
                    type="text" value={authorSearch} 
                    onChange={(e) => { setAuthorSearch(e.target.value); setActiveDropdown('author'); }}
                    onFocus={() => setActiveDropdown('author')}
                    className={`${inputClass} pr-10`} placeholder="Search author..." 
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
                {activeDropdown === 'author' && authorResults.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 max-h-40 overflow-y-auto z-50">
                    {authorResults.map(a => (
                      <div key={a._id} onClick={() => handleSelectAuthor(a)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b text-xs font-bold flex items-center gap-3 text-gray-700">
                        {a.first_name} {a.last_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* BOOK SEARCH */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4 relative z-50">
              <label className="col-span-12 md:col-span-3 md:text-right text-left text-[11px] font-bold text-text-muted uppercase font-montserrat">Featured Book*</label>
              <div className="col-span-12 md:col-span-9 relative" onClick={(e) => e.stopPropagation()}>
                <div className="relative">
                  <input 
                    type="text" value={bookSearch} 
                    onChange={(e) => { setBookSearch(e.target.value); setActiveDropdown('book'); }}
                    onFocus={() => setActiveDropdown('book')}
                    className={`${inputClass} pr-10`} placeholder="Search book title or ID..." 
                  />
                  <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
                {activeDropdown === 'book' && bookResults.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 max-h-40 overflow-y-auto z-50">
                    {bookResults.map(b => (
                      <div key={b._id} onClick={() => handleSelectBook(b)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b text-xs font-bold text-gray-700">
                        {b.title} <span className="text-primary ml-2">({b.bagchee_id})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ROLE FIELD */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-12 md:col-span-3 md:text-right text-left text-[11px] font-bold text-text-muted uppercase font-montserrat">Role / Award</label>
              <div className="col-span-12 md:col-span-9">
                <input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className={inputClass} placeholder="e.g. Padma Bhushan Awardee" />
              </div>
            </div>

            {/* QUOTE FIELD */}
            <div className="grid grid-cols-12 gap-4 items-start border-b border-cream-50 pb-4">
              <label className="col-span-12 md:col-span-3 md:text-right text-left text-[11px] font-bold text-text-muted uppercase font-montserrat pt-2">Author Quote</label>
              <div className="col-span-12 md:col-span-9">
                <textarea value={formData.quote} onChange={e => setFormData({...formData, quote: e.target.value})} className={`${inputClass} h-24 resize-none`} placeholder="Enter a famous quote..." />
              </div>
            </div>

            {/* 🟢 ACTIVE STATUS DROPDOWN */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-12 md:col-span-3 md:text-right text-left text-[11px] font-bold text-text-muted uppercase font-montserrat">Active</label>
              <div className="col-span-12 md:col-span-9 relative">
                <select 
                  name="active" 
                  value={formData.active} 
                  onChange={e => setFormData({...formData, active: e.target.value})} 
                  className={`${inputClass} appearance-none cursor-pointer`}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* 🟢 ORDER INPUT */}
            <div className="grid grid-cols-12 gap-4 items-center border-b border-cream-50 pb-4">
              <label className="col-span-12 md:col-span-3 md:text-right text-left text-[11px] font-bold text-text-muted uppercase font-montserrat">Order</label>
              <div className="col-span-12 md:col-span-9">
                <input 
                  type="number" 
                  name="order" 
                  value={formData.order} 
                  onChange={e => setFormData({...formData, order: e.target.value})} 
                  className={inputClass} 
                  placeholder="e.g. 1" 
                />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-center gap-4 pt-4">
              <button type="button" onClick={(e) => handleSubmit(e, 'stay')} disabled={loading} className="bg-primary text-white px-10 py-2.5 rounded font-bold text-[10px] uppercase shadow-md flex items-center gap-2 active:scale-95 transition-all">
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} Save
              </button>
              <button type="button" onClick={(e) => handleSubmit(e, 'back')} className="bg-text-main text-white px-10 py-2.5 rounded font-bold text-[10px] uppercase shadow-md flex items-center gap-2 active:scale-95 transition-all">
                <RotateCcw size={14}/> Save & Back
              </button>
              <button type="button" onClick={() => navigate('/admin/top-authors')} className="bg-white border border-cream-200 text-text-main px-10 py-2.5 rounded font-bold text-[10px] uppercase flex items-center gap-2 transition-all hover:bg-red-50 hover:text-red-600">
                <X size={14} /> Cancel
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditTopAuthor;