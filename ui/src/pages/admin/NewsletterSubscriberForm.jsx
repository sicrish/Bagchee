import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, X, Loader2, ChevronDown } from 'lucide-react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const NewsletterSubscriberForm = () => {
  const { id } = useParams(); // Get ID from URL (if editing)
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // States for Categories Dropdown (Multi-Select)
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    // categories is handled by selectedCategories state
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  // 🟢 1. Initialize: Fetch Categories List & (if Edit Mode) Subscriber Data
  useEffect(() => {
    const initPage = async () => {
      try {
        // Fetch Categories for Dropdown
        const catRes = await axios.get(`${API_BASE_URL}/main-categories/list`); // Adjust endpoint
        if (catRes.data.status) {
            // Flatten categories if needed or use main list
            setCategoriesList(catRes.data.data || []);
        }

        // Check if Edit Mode
        if (id) {
          setIsEditMode(true);
          const subRes = await axios.get(`${API_BASE_URL}/newsletter-subs/get/${id}`);
          if (subRes.data.status) {
            const data = subRes.data.data;
            setFormData({
              email: data.email || '',
              firstName: data.firstName || data.firstname || '',
              lastName: data.lastName || data.lastname || ''
            });
            // Handle pre-selected categories (backend might send array of strings or IDs)
            setSelectedCategories(data.categories || []);
          }
        }
      } catch (error) {
        console.error("Init Error:", error);
        toast.error("Failed to load data");
      }
    };

    initPage();
  }, [id]);

  // 🟢 2. Handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleCategory = (catName) => {
    setSelectedCategories(prev => 
      prev.includes(catName)
        ? prev.filter(c => c !== catName) // Remove
        : [...prev, catName] // Add
    );
  };

  // 🟢 3. Submit Logic (Dynamic Add/Edit)
  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!formData.email) return toast.error("Email is required!");

    setLoading(true);
    const toastId = toast.loading(isEditMode ? "Updating..." : "Saving...");

    try {
      const payload = {
        ...formData,
        categories: selectedCategories
      };

      let response;
      if (isEditMode) {
        // Update API
        response = await axios.patch(`${API_BASE_URL}/newsletter-subs/update/${id}`, payload);
      } else {
        // Create API
        response = await axios.post(`${API_BASE_URL}/newsletter-subs/save`, payload);
      }

      if (response.data.status) {
        toast.success(isEditMode ? "Updated successfully!" : "Added successfully!", { id: toastId });
        
        if (actionType === 'back') {
          navigate('/admin/newsletter-subs');
        } else if (!isEditMode) {
          // Reset form only if adding new
          setFormData({ email: '', firstName: '', lastName: '' });
          setSelectedCategories([]);
        }
      }
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error(error.response?.data?.msg || "Operation failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // 🔵 Common Input Style
  const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#0096cc] focus:shadow-[0_0_0_3px_rgba(0,141,218,0.1)] transition-all font-montserrat";

  return (
    <div className="bg-gray-50 min-h-screen font-body text-text-main pb-10">
      
      {/* --- HEADER --- */}
      <div className="bg-primary px-6 py-3 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-bold text-white uppercase tracking-wider font-display">
          {isEditMode ? 'Edit Newsletter subscribers' : 'Add Newsletter subscribers'}
        </h1>
      </div>

      <div className="max-w-5xl mx-auto p-6 mt-4">
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
            
            {/* Form Header */}
            <div className="bg-gray-100/50 px-6 py-3 border-b border-gray-200">
               <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-montserrat">
                  Subscriber Information
               </h2>
            </div>

            <form className="p-8 space-y-6">
               
               {/* Email Field */}
               <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-5">
                  <div className="col-span-12 md:col-span-3 text-left md:text-right">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-tight font-montserrat">Email</label>
                  </div>
                  <div className="col-span-12 md:col-span-9">
                     <input 
                        name="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        className={inputClass} 
                        placeholder="Enter email address" 
                     />
                  </div>
               </div>

               {/* First Name */}
               <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-5">
                  <div className="col-span-12 md:col-span-3 text-left md:text-right">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-tight font-montserrat">First name</label>
                  </div>
                  <div className="col-span-12 md:col-span-9">
                     <input 
                        name="firstName" 
                        type="text" 
                        value={formData.firstName} 
                        onChange={handleChange} 
                        className={inputClass} 
                     />
                  </div>
               </div>

               {/* Last Name */}
               <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-50 pb-5">
                  <div className="col-span-12 md:col-span-3 text-left md:text-right">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-tight font-montserrat">Last name</label>
                  </div>
                  <div className="col-span-12 md:col-span-9">
                     <input 
                        name="lastName" 
                        type="text" 
                        value={formData.lastName} 
                        onChange={handleChange} 
                        className={inputClass} 
                     />
                  </div>
               </div>

               {/* Categories (Multi-Select Dropdown) */}
               <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-50 pb-5">
                  <div className="col-span-12 md:col-span-3 text-left md:text-right pt-2.5">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-tight font-montserrat">Categories</label>
                  </div>
                  <div className="col-span-12 md:col-span-9 relative">
                     
                     {/* Trigger Box */}
                     <div 
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white cursor-pointer min-h-[42px] flex flex-wrap gap-2 items-center hover:border-primary transition-colors"
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                     >
                        {selectedCategories.length > 0 ? (
                           selectedCategories.map((cat, idx) => (
                              <span key={idx} className="bg-blue-50 text-[#0096cc] text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                 {cat}
                                 <button 
                                    type="button" 
                                    onClick={(e) => { e.stopPropagation(); toggleCategory(cat); }}
                                    className="hover:text-red-500"
                                 >×</button>
                              </span>
                           ))
                        ) : (
                           <span className="text-gray-400 text-xs">Select Categories</span>
                        )}
                        <ChevronDown size={14} className="ml-auto text-gray-400" />
                     </div>

                     {/* Dropdown Body */}
                     {isCategoryOpen && (
                        <div className="absolute z-10 top-full left-0 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 max-h-60 overflow-hidden flex flex-col">
                           {/* Search */}
                           <div className="p-2 border-b border-gray-100 bg-gray-50">
                              <input 
                                 type="text" 
                                 placeholder="Search..." 
                                 className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-primary outline-none"
                                 value={categorySearch}
                                 onChange={(e) => setCategorySearch(e.target.value)}
                                 onClick={(e) => e.stopPropagation()}
                                 autoFocus
                              />
                           </div>
                           {/* List */}
                           <div className="overflow-y-auto p-1">
                              {categoriesList
                                 .filter(c => (c.categorytitle || c.title || "").toLowerCase().includes(categorySearch.toLowerCase()))
                                 .map((cat) => {
                                    const catName = cat.categorytitle || cat.title || "Unnamed";
                                    const isSelected = selectedCategories.includes(catName);
                                    return (
                                       <div 
                                          key={cat.id || cat._id}
                                          onClick={() => toggleCategory(catName)}
                                          className={`flex items-center gap-2 p-2 cursor-pointer text-sm rounded hover:bg-blue-50 ${isSelected ? 'bg-blue-50 font-bold text-primary' : 'text-gray-700'}`}
                                       >
                                          <input type="checkbox" checked={isSelected} readOnly className="accent-primary pointer-events-none" />
                                          {catName}
                                       </div>
                                    )
                                 })
                              }
                           </div>
                        </div>
                     )}

                     {/* Overlay */}
                     {isCategoryOpen && <div className="fixed inset-0 z-0" onClick={() => setIsCategoryOpen(false)}></div>}
                  </div>
               </div>

               {/* --- ACTION BUTTONS --- */}
               <div className="flex flex-wrap justify-center gap-4 pt-4 mt-6">
                  <button 
                     type="button"
                     onClick={(e) => handleSubmit(e, 'stay')} 
                     disabled={loading}
                     className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded font-bold text-xs uppercase shadow-sm active:scale-95 transition-all flex items-center gap-2"
                  >
                     {loading ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} 
                     Save
                  </button>
                  
                  <button 
                     type="button"
                     onClick={(e) => handleSubmit(e, 'back')} 
                     disabled={loading}
                     className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded font-bold text-xs uppercase shadow-sm active:scale-95 transition-all flex items-center gap-2"
                  >
                     <RotateCcw size={14}/> Save and go back to list
                  </button>

                  <button 
                     type="button" 
                     onClick={() => navigate('/admin/newsletter-subs')} 
                     className="bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-6 py-2.5 rounded font-bold text-xs uppercase shadow-sm active:scale-95 transition-all flex items-center gap-2"
                  >
                     <X size={14} /> Cancel
                  </button>
               </div>

            </form>
        </div>
      </div>
    </div>
  );
};

export default NewsletterSubscriberForm;