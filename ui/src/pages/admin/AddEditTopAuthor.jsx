import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, User, BookOpen, ChevronDown } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // 🟢 React Query Import

const AddEditTopAuthor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  // Prevents typing overwrite
  const [isDataInitialized, setIsDataInitialized] = useState(false);

  // --- SEARCH STATES ---
  const [authorSearch, setAuthorSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null); 

  const [formData, setFormData] = useState({
    authorId: '',
    bookId: '',
    role: '',
    quote: '',
    active: 'yes', // Default 'yes' for dropdown
    order: ''
  });

  // 🚀 OPTIMIZATION 1: Fetch Existing Data with useQuery
  const { data: topAuthorData, isLoading: fetching } = useQuery({
    queryKey: ['topAuthorData', id],
    queryFn: async () => {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/top-authors/get/${id}`);
      if (!res.data.status) throw new Error("Failed to load details");
      return res.data.data;
    },
    enabled: isEdit, 
    staleTime: 1000 * 60 * 5, 
    refetchOnWindowFocus: false, 
    onError: (error) => {
      toast.error("Failed to load details");
      navigate('/admin/top-authors');
    }
  });

  // 🟢 Initialize Data Only Once
  useEffect(() => {
    if (isEdit && topAuthorData && !isDataInitialized) {
      const d = topAuthorData;
      setFormData({
        authorId: d.authorId?._id || '',
        bookId: d.bookId?._id || '',
        role: d.role || '',
        quote: d.quote || '',
        active: d.active ? 'yes' : 'no',
        order: d.order || ''
      });
      setAuthorSearch(`${d.authorId?.first_name || ''} ${d.authorId?.last_name || ''}`.trim());
      setBookSearch(d.bookId?.title || "");
      
      setIsDataInitialized(true);
    }
  }, [isEdit, topAuthorData, isDataInitialized]);

  // 🚀 OPTIMIZATION 2: Live Search for Authors (React Query cached)
  const { data: authorResults = [], isFetching: isAuthorSearching } = useQuery({
    queryKey: ['searchAuthors', authorSearch],
    queryFn: async () => {
      if (authorSearch.length <= 2 || activeDropdown !== 'author') return [];
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/authors/list?q=${authorSearch}`);
      return res.data.status ? res.data.data : [];
    },
    enabled: authorSearch.length > 2 && activeDropdown === 'author', // Call API only when 3+ chars typed
    staleTime: 1000 * 60 * 5 // Cache previous searches for speed
  });

  // 🚀 OPTIMIZATION 3: Live Search for Books (React Query cached)
  const { data: bookResults = [], isFetching: isBookSearching } = useQuery({
    queryKey: ['searchBooks', bookSearch],
    queryFn: async () => {
      if (bookSearch.length <= 2 || activeDropdown !== 'book') return [];
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/top-authors/search-inventory?q=${bookSearch}`);
      return res.data.status ? res.data.data : [];
    },
    enabled: bookSearch.length > 2 && activeDropdown === 'book',
    staleTime: 1000 * 60 * 5 
  });

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

  // 🚀 OPTIMIZATION 4: Form Save/Update Mutation
  const saveAuthorMutation = useMutation({
    mutationFn: async (payloadData) => {
      const url = isEdit ? `/top-authors/update/${id}` : `/top-authors/save`;
      // Usually updates are PATCH or PUT. Kept original logic from your code.
      const method = isEdit ? 'patch' : 'post';
      const res = await axios[method](`${process.env.REACT_APP_API_URL}${url}`, payloadData);
      return res.data;
    }
  });

  // 🟢 4. SUBMIT HANDLER
  const handleSubmit = (e, actionType) => {
    e.preventDefault();
    if (!formData.authorId || !formData.bookId) return toast.error("Author and Book are required!");

    const toastId = toast.loading(isEdit ? "Updating..." : "Saving featured author...");
    const payload = { ...formData, active: formData.active === 'yes' };

    saveAuthorMutation.mutate(payload, {
      onSuccess: (resData) => {
        if (resData.status) {
          toast.success("Saved successfully! ✨", { id: toastId });
          
          if (isEdit) {
            queryClient.invalidateQueries({ queryKey: ['topAuthorData', id] });
          }

          if (actionType === 'back') {
             navigate('/admin/top-authors');
          } else if (!isEdit) {
             setFormData({ authorId: '', bookId: '', role: '', quote: '', active: 'yes', order: '' });
             setAuthorSearch('');
             setBookSearch('');
          }
        } else {
          toast.error(resData.msg || "Operation failed", { id: toastId });
        }
      },
      onError: (error) => {
        toast.error("Operation failed", { id: toastId });
      }
    });
  };

  const inputClass = `w-full border border-[#e6decd] rounded-[4px] px-3.5 py-2 text-[13px] outline-none transition-all duration-200 bg-[#fffdf5] focus:bg-white focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,141,218,0.15)] font-body`;

  if (isEdit && (fetching || !isDataInitialized)) {
    return <div className="min-h-screen flex items-center justify-center bg-cream-50"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

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
                  {isAuthorSearching ? (
                     <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={16} />
                  ) : (
                     <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  )}
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
                  {isBookSearching ? (
                     <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={16} />
                  ) : (
                     <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  )}
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
              <button type="button" onClick={(e) => handleSubmit(e, 'stay')} disabled={saveAuthorMutation.isPending} className="bg-primary text-white px-10 py-2.5 rounded font-bold text-[10px] uppercase shadow-md flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                {saveAuthorMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} {isEdit ? "Update" : "Save"}
              </button>
              <button type="button" onClick={(e) => handleSubmit(e, 'back')} disabled={saveAuthorMutation.isPending} className="bg-text-main text-white px-10 py-2.5 rounded font-bold text-[10px] uppercase shadow-md flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                <RotateCcw size={14}/> {isEdit ? "Update & Back" : "Save & Back"}
              </button>
              <button type="button" onClick={() => navigate('/admin/top-authors')} disabled={saveAuthorMutation.isPending} className="bg-white border border-cream-200 text-text-main px-10 py-2.5 rounded font-bold text-[10px] uppercase flex items-center gap-2 transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
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